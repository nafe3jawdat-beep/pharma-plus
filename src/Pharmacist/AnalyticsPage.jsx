import { useEffect, useState, useRef } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { useNotificationCount } from "../contexts/NotificationContext";
import { analyticsApi } from "../services/pharmacist";

const PERIOD_OPTIONS = [
  { value: 7, label: "last7Days" },
  { value: 30, label: "last30Days" },
];

const RADIUS_OPTIONS = [
  { value: 5, label: "5km" },
  { value: 10, label: "10km" },
  { value: 25, label: "25km" },
  { value: 50, label: "50km" },
];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { unreadCount } = useNotificationCount();
  const { selectedPharmacy } = useOutletContext();
  const filterRef = useRef(null);

  const savedLoc = (() => {
    try {
      const raw = localStorage.getItem("pharmacy_location");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const pharmacyCenter = savedLoc ? [savedLoc.lat, savedLoc.lng] : [0, 0];

  const [topMeds, setTopMeds] = useState([]);
  const [heatData, setHeatData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(7);
  const [radius, setRadius] = useState(5);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);

  const fetchData = () => {
    if (!selectedPharmacy?.id) return;
    setLoading(true);
    analyticsApi
      .fetchDemandMap(selectedPharmacy.id, { search: search || undefined, period, radius })
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

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, radius]);

  const handleSearch = () => {
    fetchData();
  };

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setPeriodOpen(false);
        setRadiusOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading && !topMeds.length) {
    return <div className="flex-1 h-screen overflow-y-auto bg-surface p-6 lg:p-10"><div className="p-10 text-center">{t("app.loading")}</div></div>;
  }

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
            onClick={() => { setPeriodOpen(!periodOpen); setRadiusOpen(false); }}
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

        <div className="relative">
          <div
            onClick={() => { setRadiusOpen(!radiusOpen); setPeriodOpen(false); }}
            className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-2 text-sm text-on-surface cursor-pointer hover:border-outline-variant transition-all select-none min-w-[100px]"
          >
            <span className="flex-1">{RADIUS_OPTIONS.find((o) => o.value === radius)?.label ? t("periods." + RADIUS_OPTIONS.find((o) => o.value === radius).label) : ""}</span>
            <span className="material-symbols-outlined text-sm text-on-surface-variant" style={{ transform: radiusOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>expand_more</span>
          </div>
          {radiusOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 overflow-hidden z-50">
              {RADIUS_OPTIONS.map((o) => (
                <div
                  key={o.value}
                  onClick={() => { setRadius(o.value); setRadiusOpen(false); }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-surface-container ${
                    radius === o.value ? "text-primary font-bold" : "text-on-surface-variant"
                  }`}
                >
                  {t("periods." + o.label)}
                </div>
              ))}
            </div>
          )}
        </div>
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
            center={pharmacyCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="h-[420px] w-full rounded-xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Circle
              center={pharmacyCenter}
              radius={radius * 1000}
              pathOptions={{ color: "#0b6a6a", fillColor: "#0b6a6a", fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}
            />

            <Marker position={pharmacyCenter}>
              <Tooltip permanent direction="top" offset={[0, -12]}>
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
