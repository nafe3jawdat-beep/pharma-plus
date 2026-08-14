import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTranslation } from "react-i18next";
import { useNotificationCount } from "../contexts/NotificationContext";
import { analyticsApi, pharmacyApi } from "../services/pharmacist";

const PERIOD_OPTIONS = [
  { value: 7, label: "last7Days" },
  { value: 30, label: "last30Days" },
];

const DEMAND_RADIUS_KM = 10;

const pharmacyIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#0b6a6a;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(11,106,106,0.4);border:3px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

function MapFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

const threatTone = (level) => {
  const v = String(level || "").toLowerCase();
  if (v === "high") return "bg-rose-100 text-rose-700";
  if (v === "medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { unreadCount } = useNotificationCount();
  const { selectedPharmacy } = useOutletContext();
  const pharmacyId = selectedPharmacy?.id;
  const filterRef = useRef(null);

  const savedLoc = useMemo(() => {
    try {
      const raw = localStorage.getItem("pharmacy_location");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [center, setCenter] = useState(() => {
    if (selectedPharmacy?.latitude != null && selectedPharmacy?.longitude != null) {
      return [Number(selectedPharmacy.latitude), Number(selectedPharmacy.longitude)];
    }
    if (savedLoc?.lat != null && savedLoc?.lng != null) {
      return [Number(savedLoc.lat), Number(savedLoc.lng)];
    }
    return [0, 0];
  });

  useEffect(() => {
    if (!selectedPharmacy?.id) return;
    if (center[0] !== 0 || center[1] !== 0) return;
    pharmacyApi
      .getProfile(selectedPharmacy.id)
      .then((res) => {
        const p = res.data || res;
        if (p?.latitude != null && p?.longitude != null) {
          setCenter([Number(p.latitude), Number(p.longitude)]);
        }
      })
      .catch(() => {});
  }, [selectedPharmacy?.id, center]);

  const [topMeds, setTopMeds] = useState([]);
  const [heatData, setHeatData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(7);
  const [periodOpen, setPeriodOpen] = useState(false);

  const [ai, setAi] = useState({ status: "idle", data: null });

  const fetchData = () => {
    if (!selectedPharmacy?.id) return;
    setLoading(true);
    analyticsApi
      .fetchDemandMap(selectedPharmacy.id, { search: search || undefined, period, radius: DEMAND_RADIUS_KM })
      .then((d) => {
        setTopMeds(d.topRequestedMedicines ?? []);
        setStatistics(d.statistics ?? {});
        setHeatData(
          (d.heatmapPoints ?? []).map((point) => ({
            lat: point.lat,
            lng: point.lng,
            intensity:
              point.requests > 140
                ? "high"
                : point.requests > 90
                  ? "medium"
                  : "low",
            topMeds: [point.activeIngredient],
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchAiDemand = useCallback(async () => {
    if (!pharmacyId) return;
    setAi((p) => (p.status === "ready" || p.status === "pending" ? p : { ...p, status: "loading" }));
    try {
      const res = await analyticsApi.getAiDemand(pharmacyId);
      const report = res?.data ?? null;
      if (report?.status === "completed" && report?.ai_insights) {
        setAi({ status: "ready", data: report });
      } else if (report) {
        setAi({ status: "pending", data: report });
      } else {
        setAi({ status: "idle", data: null });
      }
    } catch {
      setAi((p) => ({ ...p, status: "error" }));
    }
  }, [pharmacyId]);

  const generateDemandSummary = useCallback(async () => {
    if (!pharmacyId) return;
    setAi({ status: "loading", data: null });
    try {
      await analyticsApi.generateDemandSummary(pharmacyId);
    } catch {
      setAi({ status: "error", data: null });
      return;
    }
    setAi({ status: "pending", data: null });
    fetchAiDemand();
  }, [pharmacyId, fetchAiDemand]);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    fetchAiDemand();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedPharmacy?.id]);

  const pollCountRef = useRef(0);
  useEffect(() => {
    if (ai.status !== "pending") {
      pollCountRef.current = 0;
      return;
    }
    const timer = setInterval(() => {
      pollCountRef.current += 1;
      if (pollCountRef.current >= 15) {
        clearInterval(timer);
        return;
      }
      fetchAiDemand();
    }, 6000);
    return () => clearInterval(timer);
  }, [ai.status, fetchAiDemand]);

  const handleSearch = () => {
    fetchData();
  };

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading && !topMeds.length) {
    return <div className="flex-1 h-screen overflow-y-auto bg-surface p-6 lg:p-10"><div className="p-10 text-center">{t("app.loading")}</div></div>;
  }

  const aiInsights = ai.data?.ai_insights ?? null;
  const snapshot = ai.data?.input_snapshot ?? null;
  const topUsages = Array.isArray(snapshot?.top_usages) ? snapshot.top_usages : [];
  const advice = Array.isArray(aiInsights?.actionable_pharmacy_advice) ? aiInsights.actionable_pharmacy_advice : [];

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-surface p-6 lg:p-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">{t("analytics.title")}</h1>
          <p className="text-on-surface-variant">
            {t("analytics.description")}
          </p>
        </div>
        <Link
          to="/Dashboard/Notifications"
          className="relative p-2 hover:bg-primary-container/20 rounded-full transition-all flex-shrink-0"
        >
          <span className="material-symbols-outlined text-primary">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          )}
        </Link>
      </div>

      <div ref={filterRef} className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all"
            placeholder={t("placeholders.searchDrug")}
          />
        </div>

        <div className="relative">
          <div
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-2 text-sm text-on-surface cursor-pointer hover:border-outline-variant transition-all select-none min-w-[130px]"
          >
            <span className="flex-1">{PERIOD_OPTIONS.find((o) => o.value === period)?.label ? t("periods." + PERIOD_OPTIONS.find((o) => o.value === period).label) : ""}</span>
            <span className="material-symbols-outlined text-sm text-on-surface-variant" style={{ transform: periodOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>expand_more</span>
          </div>
          {periodOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 overflow-hidden z-50">
              {PERIOD_OPTIONS.map((o) => (
                <div
                  key={o.value}
                  onClick={() => { setPeriod(o.value); setPeriodOpen(false); }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-surface-container ${
                    period === o.value ? "text-primary font-bold" : "text-on-surface-variant"
                  }`}
                >
                  {t("periods." + o.label)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            {t("analytics.aiDemandSummary")}
          </h2>
          {ai.status !== "idle" && ai.status !== "loading" && (
            <button
              onClick={fetchAiDemand}
              className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              {t("analytics.refresh")}
            </button>
          )}
        </div>

        {ai.status === "loading" && (
          <div className="flex items-center gap-3 py-6 justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-on-surface-variant">{t("analytics.generating")}</span>
          </div>
        )}

        {ai.status === "pending" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">hourglass_top</span>
            <p className="text-sm text-on-surface-variant">{t("analytics.generationPending")}</p>
          </div>
        )}

        {ai.status === "error" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-rose-600">{t("analytics.generationError")}</p>
            <button
              onClick={fetchAiDemand}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-on-primary shadow-md transition-all hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              {t("analytics.retry")}
            </button>
          </div>
        )}

        {ai.status === "idle" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="material-symbols-outlined text-3xl text-primary">auto_awesome</span>
            <p className="max-w-md text-sm text-on-surface-variant">{t("analytics.aiDemandPrompt")}</p>
            <button
              onClick={generateDemandSummary}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dim px-6 py-2.5 text-sm font-bold text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              {t("analytics.generateDemandSummary")}
            </button>
          </div>
        )}

        {ai.status === "ready" && aiInsights && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold inline-block px-3 py-1.5 rounded-full ${
                aiInsights.has_epidemic_warning
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}>
                <span className="material-symbols-outlined align-middle text-sm mr-1">
                  {aiInsights.has_epidemic_warning ? "warning" : "check_circle"}
                </span>
                {aiInsights.has_epidemic_warning ? t("analytics.epidemicWarning") : t("analytics.noEpidemicWarning")}
              </span>
              {aiInsights.threat_level && (
                <span className={`text-xs font-bold inline-block px-3 py-1.5 rounded-full ${threatTone(aiInsights.threat_level)}`}>
                  {t("analytics.threatLevel")}: {aiInsights.threat_level}
                </span>
              )}
              {aiInsights.combined_demand_score != null && (
                <span className="text-xs font-bold inline-block px-3 py-1.5 rounded-full bg-primary-container/60 text-primary">
                  {t("analytics.combinedDemandScore")}: {aiInsights.combined_demand_score}
                </span>
              )}
            </div>

            {aiInsights.detected_disease && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">medication</span>
                <span className="text-sm font-semibold text-on-surface">{aiInsights.detected_disease}</span>
              </div>
            )}

            {aiInsights.clinical_summary && (
              <p className="text-sm leading-relaxed text-on-surface-variant">{aiInsights.clinical_summary}</p>
            )}

            {advice.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{t("analytics.actionableAdvice")}</h3>
                <ul className="space-y-2">
                  {advice.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 bg-surface-container-lowest rounded-lg px-3.5 py-2.5 text-sm text-on-surface">
                      <span className="material-symbols-outlined mt-0.5 text-base text-primary">arrow_forward</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {topUsages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{t("analytics.topUsages")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topUsages.map((u, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3.5 py-2.5 text-sm">
                      <span className="text-on-surface">{u.resolved_usage}</span>
                      <span className="text-on-surface-variant font-bold tabular-nums">{u.search_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statistics).map(([key, value]) => (
          <div key={key} className="bg-surface-container-lowest rounded-xl p-4 shadow">
            <p className="text-sm text-on-surface-variant">{key.replace(/([A-Z])/g, " $1")}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-low rounded-2xl p-4">
          <h2 className="font-semibold text-lg mb-4">{t("analytics.demandHeatmap")}</h2>

          <MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: 420, width: "100%" }}
            className="rounded-xl z-0"
          >
            <MapFix />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Circle
              center={center}
              radius={DEMAND_RADIUS_KM * 1000}
              pathOptions={{ color: "#0b6a6a", fillColor: "#0b6a6a", fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}
            />

            <Marker position={center} icon={pharmacyIcon}>
              <Tooltip permanent direction="top" offset={[0, -14]}>
                <span className="text-xs font-bold">{t("analytics.yourPharmacy")}</span>
              </Tooltip>
            </Marker>

            {heatData.map((zone, i) => (
              <CircleMarker
                key={i}
                center={[zone.lat, zone.lng]}
                radius={zone.intensity === "high" ? 20 : zone.intensity === "medium" ? 12 : 6}
                color={zone.intensity === "high" ? "red" : zone.intensity === "medium" ? "orange" : "green"}
                fillOpacity={0.4}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div>
                    <p className="font-bold">{zone.topMeds.join(", ")}</p>
                    <p className="text-xs">{t("analytics." + zone.intensity + "Demand")}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-4">
          <h2 className="font-semibold text-lg mb-4">{t("analytics.topMedications")}</h2>
          <div className="space-y-3">
            {topMeds.slice(0, 5).map((med, i) => (
              <div key={i} className="p-4 bg-surface-container-lowest rounded-xl">
                <p className="font-medium">{med.name}</p>
                <p className="text-sm text-on-surface-variant">
                  {med.demand} {t("analytics.requests")}
                </p>
                <span
                  className={`text-xs mt-2 inline-block px-2 py-1 rounded-full ${
                    med.trend === "up"
                      ? "bg-green-100 text-green-700"
                      : med.trend === "down"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100"
                  }`}
                >
                  {med.trend === "up" ? t("analytics.increasing") : med.trend === "down" ? t("analytics.decreasing") : t("analytics.stable")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
