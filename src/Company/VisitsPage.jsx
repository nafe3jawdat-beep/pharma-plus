import { useState, useEffect, useCallback } from "react";
import { companyService } from "../services/company";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const STATUS_TABS = ["all", "verified", "failed"];
const inputClass = "w-full bg-surface-container/50 text-on-surface px-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40";

function formatDateTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatTime(dt) { return dt ? new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; }
function formatDate(dt) { return dt ? new Date(dt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : ""; }
function toDateInputValue(date) { return date.toISOString().split("T")[0]; }
function getInitials(name) { return name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?"; }

const pastelColors = [
  "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700",
];

function AdherenceRing({ rate }) {
  const pct = parseFloat(rate) || 0;
  const r = 22, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="transform -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-container-high" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} className="text-primary transition-all duration-1000" />
      </svg>
      <span className="absolute text-xs font-extrabold text-primary">{pct}%</span>
    </div>
  );
}

const customMarkerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#0b6a6a;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(11,106,106,0.4);border:3px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
});

export default function VisitsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [visits, setVisits] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reps, setReps] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const today = new Date();
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30);

  const [filters, setFilters] = useState({
    from: toDateInputValue(thirtyDaysAgo), to: toDateInputValue(today), rep_id: "", status: "all",
  });

  const fetchVisits = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.rep_id) params.rep_id = filters.rep_id;
    if (filters.status === "verified") params.verification_status = "true";
    else if (filters.status === "failed") params.verification_status = "false";
    companyService.getVisits(params)
      .then((res) => { setVisits(res?.data ?? []); setMeta(res?.meta ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { companyService.getReps().then((r) => setReps(r?.data ?? [])).catch(() => {}); }, []);
  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const handleFilterChange = (key, value) => setFilters((p) => ({ ...p, [key]: value }));
  const clearFilters = () => setFilters({ from: toDateInputValue(thirtyDaysAgo), to: toDateInputValue(today), rep_id: "", status: "all" });

  const total = meta?.total_visits ?? visits.length;
  const verified = meta?.verified_visits ?? visits.filter(v => v.verification_status).length;
  const failed = meta?.failed_verifications ?? visits.filter(v => !v.verification_status).length;
  const adherence = meta?.adherence_rate ?? (total > 0 ? ((verified / total) * 100).toFixed(1) : "0");

  return (
    <div className="flex-1 overflow-y-auto bg-surface" dir={isRtl ? "rtl" : "ltr"}>
      <div className="relative">
        <div className="absolute top-0 end-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>
      <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <header>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">{t("visits.title")}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{t("visits.description")}</p>
        </header>

        {loading && visits.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-surface-container-high animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t("visits.totalVisits"), value: total, icon: "calendar_month", color: "text-primary", bg: "bg-primary/10" },
                { label: t("visits.verified"), value: verified, icon: "verified", color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: t("visits.failed"), value: failed, icon: "cancel", color: "text-rose-500", bg: "bg-rose-50" },
                { label: t("visits.adherenceRate"), value: null, icon: null, color: null, bg: null },
              ].map((card, i) => (
                <div key={i}
                  className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md animate-[fadeIn_0.3s_ease-out]"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  {card.value !== null ? (
                    <>
                      <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined text-2xl ${card.color}`}>{card.icon}</span>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-on-surface tabular-nums">{card.value.toLocaleString()}</p>
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{card.label}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AdherenceRing rate={adherence} />
                      <div>
                        <p className="text-xl font-extrabold text-on-surface">{adherence}%</p>
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{card.label}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("visits.from")}</label>
                <input type="date" value={filters.from} onChange={(e) => handleFilterChange("from", e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("visits.to")}</label>
                <input type="date" value={filters.to} onChange={(e) => handleFilterChange("to", e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5 flex-[1.5] min-w-0">
                <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("visits.rep")}</label>
                <select value={filters.rep_id} onChange={(e) => handleFilterChange("rep_id", e.target.value)} className={inputClass}>
                  <option value="">{t("visits.allReps")}</option>
                  {reps.map((r) => {
                    const name = r.user ? `${r.user.f_name || ""} ${r.user.l_name || ""}`.trim() : r.id;
                    return <option key={r.id} value={r.id}>{name}</option>;
                  })}
                </select>
              </div>
              <button onClick={clearFilters}
                className="px-5 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all whitespace-nowrap">
                {t("schedules.clear")}
              </button>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((status) => {
                const active = filters.status === status;
                const dot = status === "verified" ? "bg-emerald-500" : status === "failed" ? "bg-rose-500" : "bg-primary";
                return (
                  <button key={status} onClick={() => handleFilterChange("status", status)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      active ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest border border-surface-container-high text-on-surface-variant hover:bg-surface-container-high"
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${active ? "bg-white/80" : dot}`} />
                    {t(`visits.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                  </button>
                );
              })}
            </div>

            {/* Visit List */}
            {visits.length === 0 ? (
              <div className="bg-surface-container-lowest p-12 rounded-2xl border border-surface-container-high text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">fact_check</span>
                  </div>
                  <p className="text-on-surface-variant text-lg font-medium">{t("visits.noVisits")}</p>
                  {(filters.from || filters.to || filters.rep_id || filters.status !== "all") && (
                    <button onClick={clearFilters} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all shadow-md">
                      {t("schedules.clear")}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface border-b border-surface-container-high">
                        <th className="text-start px-5 py-3.5 text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("visits.repLabel")}</th>
                        <th className="text-start px-5 py-3.5 text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("visits.doctorLabel")}</th>
                        <th className="text-start px-5 py-3.5 text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("visits.scheduledAt")}</th>
                        <th className="text-start px-5 py-3.5 text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("visits.scannedAt")}</th>
                        <th className="text-start px-5 py-3.5 text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("visits.verificationStatus")}</th>
                        <th className="text-end px-5 py-3.5 text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("app.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {visits.map((visit, index) => {
                        const verified = visit.verification_status;
                        return (
                          <tr key={visit.visit_id || index}
                            className={`border-s-4 ${verified ? "border-s-emerald-500" : "border-s-rose-500"} hover:bg-surface transition-all cursor-pointer`}
                            onClick={() => setSelectedVisit(visit)}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center ${pastelColors[index % 6]}`}>{getInitials(visit.rep_name)}</div>
                                <span className="font-semibold text-on-surface text-sm truncate">{visit.rep_name || "—"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center ${pastelColors[(index + 3) % 6]}`}>{getInitials(visit.doctor_name)}</div>
                                <span className="font-medium text-on-surface text-sm truncate">{visit.doctor_name || "—"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-container/15 text-primary text-xs font-bold">
                                <span className="material-symbols-outlined text-xs">event</span>
                                {formatDateTime(visit.scheduled_at)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {visit.scanned_at ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface-variant text-xs font-bold">
                                  <span className="material-symbols-outlined text-xs">qr_code_scanner</span>
                                  {formatDateTime(visit.scanned_at)}
                                </span>
                              ) : <span className="text-xs text-on-surface-variant/50">—</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                verified ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}>
                                <span className="material-symbols-outlined text-sm">{verified ? "check_circle" : "gpp_bad"}</span>
                                {verified ? t("visits.verifiedLabel") : t("visits.failedLabel")}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-end">
                              <button onClick={(e) => { e.stopPropagation(); setSelectedVisit(visit); }}
                                className="p-2 rounded-xl hover:bg-primary-container/30 text-on-surface-variant hover:text-primary transition-all"
                                title={t("visits.viewDetails")}>
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {selectedVisit && (() => {
          const v = selectedVisit;
          const isVerified = v.verification_status;
          const hasCoords = v.latitude && v.longitude;
          const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${v.latitude},${v.longitude}` : null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVisit(null)}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 animate-[fadeIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}>

                <div className={`p-6 rounded-t-3xl ${isVerified ? "bg-gradient-to-r from-emerald-50 to-emerald-100/40" : "bg-gradient-to-r from-rose-50 to-rose-100/40"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${isVerified ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} flex items-center justify-center`}>
                        <span className="material-symbols-outlined text-2xl">{isVerified ? "check_circle" : "gpp_bad"}</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-on-surface">{t("visits.details")}</h2>
                        <p className="text-sm text-on-surface-variant">{v.workplace_name || t("visits.visitInfo")}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedVisit(null)} className="p-2 rounded-xl hover:bg-black/5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    {/* Rep & Doctor */}
                    <div className="bg-surface-container/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary text-xs font-bold flex items-center justify-center">{getInitials(v.rep_name)}</div>
                        <div><p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">{t("visits.repLabel")}</p><p className="font-bold text-on-surface">{v.rep_name || "—"}</p></div>
                      </div>
                      <div className="h-px bg-surface-container-high" />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center justify-center">{getInitials(v.doctor_name)}</div>
                        <div><p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">{t("visits.doctorLabel")}</p><p className="font-bold text-on-surface">{v.doctor_name || "—"}</p></div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-surface-container/30 rounded-2xl p-4">
                      <div className="relative ps-8 space-y-5">
                        <div className="absolute top-2 bottom-2 w-0.5 bg-surface-container-high rounded-full" style={{ insetInlineStart: '11px' }} />
                        <div className="relative">
                          <div className="absolute top-1 w-5 h-5 rounded-full bg-primary border-[3px] border-primary-container" style={{ insetInlineStart: '-32px' }} />
                          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">{t("visits.scheduledAtLabel")}</p>
                          <p className="font-bold text-on-surface">{formatDate(v.scheduled_at)}</p>
                          <p className="text-sm text-on-surface-variant">{formatTime(v.scheduled_at)}</p>
                        </div>
                        {v.scanned_at && (
                          <div className="relative">
                            <div className={`absolute top-1 w-5 h-5 rounded-full border-[3px] ${isVerified ? "bg-emerald-500 border-emerald-200" : "bg-rose-400 border-rose-200"}`} style={{ insetInlineStart: '-32px' }} />
                            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">{t("visits.scannedAtLabel")}</p>
                            <p className="font-bold text-on-surface">{formatDate(v.scanned_at)}</p>
                            <p className="text-sm text-on-surface-variant">{formatTime(v.scanned_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Workplace & GPS */}
                    <div className="bg-surface-container/30 rounded-2xl p-4 space-y-3">
                      {v.workplace_name && (
                        <div>
                          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">{t("visits.workplace")}</p>
                          <p className="font-bold text-on-surface flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-base text-primary">business</span>{v.workplace_name}
                          </p>
                        </div>
                      )}
                      {hasCoords && (
                        <div>
                          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">{t("visits.coordinates")}</p>
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <span className="text-on-surface-variant text-xs">{t("visits.latitude")}:</span>
                              <span className="font-mono font-bold text-on-surface">{parseFloat(v.latitude).toFixed(6)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-on-surface-variant text-xs">{t("visits.longitude")}:</span>
                              <span className="font-mono font-bold text-on-surface">{parseFloat(v.longitude).toFixed(6)}</span>
                            </span>
                          </div>
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all">
                            <span className="material-symbols-outlined text-sm">open_in_new</span>{t("visits.openInMaps")}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasCoords && (
                    <div className="lg:w-72 h-64 lg:h-auto rounded-2xl overflow-hidden border border-surface-container-high flex-shrink-0">
                      <MapContainer center={[parseFloat(v.latitude), parseFloat(v.longitude)]} zoom={15} scrollWheelZoom={false}
                        style={{ width: "100%", height: "100%" }} zoomControl={false}>
                        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[parseFloat(v.latitude), parseFloat(v.longitude)]} icon={customMarkerIcon}>
                          <Popup><div className="font-sans text-sm"><strong>{v.workplace_name || "Visit Location"}</strong><br />{v.latitude}, {v.longitude}</div></Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 flex justify-end">
                  <button onClick={() => setSelectedVisit(null)}
                    className="px-6 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all">
                    {t("app.close")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
