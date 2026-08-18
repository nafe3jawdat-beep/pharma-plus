import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { companyService } from "../services/company";
import { useTranslation } from "react-i18next";

function toDatetimeLocal(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDatetime(dtLocal) {
  if (!dtLocal) return "";
  return dtLocal.replace("T", " ") + ":00";
}

function getDoctorName(d) {
  const u = d?.user;
  return u ? `${u.f_name || ""} ${u.l_name || ""}`.trim() : d?.id || "Unknown";
}

function getInitials(d) {
  const u = d?.user;
  return ((u?.f_name?.[0] || "") + (u?.l_name?.[0] || "")).toUpperCase() || "?";
}

const TAB_CONFIG = {
  single: { icon: "event", labelKey: "schedules.createSingle" },
  batch: { icon: "playlist_add", labelKey: "schedules.createBatch" },
};

export default function CreateScheduleModal({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("single");
  const [reps, setReps] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

  const [single, setSingle] = useState({ rep_id: "", doctor_id: "", scheduled_at: toDatetimeLocal(now), notes: "" });
  const [batchRepId, setBatchRepId] = useState("");
  const [rows, setRows] = useState([{ doctor_id: "", scheduled_at: toDatetimeLocal(now), notes: "" }]);

  useEffect(() => {
    if (!open) return;
    setDoctorSearch("");
    companyService.getReps().then((r) => setReps(r?.data ?? [])).catch(() => {});
    companyService.getDoctors({ per_page: 200 }).then((r) => setDoctors(r?.data ?? [])).catch(() => {});
    companyService.getAssignments().then((r) => setAssignments(r?.data ?? [])).catch(() => {});
  }, [open]);

  const filteredDoctors = useMemo(() => {
    if (!doctorSearch.trim()) return doctors;
    const q = doctorSearch.toLowerCase();
    return doctors.filter((d) => {
      const name = getDoctorName(d).toLowerCase();
      const spec = (d.specialization || "").toLowerCase();
      return name.includes(q) || spec.includes(q);
    });
  }, [doctors, doctorSearch]);

  const isAssigned = (repId, doctorId) =>
    assignments.some((a) => String(a.rep_id) === String(repId) && String(a.doctor_id) === String(doctorId));

  const validBatchCount = useMemo(() => rows.filter((r) => r.doctor_id && r.scheduled_at).length, [rows]);

  const handleSingleSubmit = async () => {
    if (!single.rep_id || !single.doctor_id || !single.scheduled_at) { toast.error(t("schedules.createError")); return; }
    if (!isAssigned(single.rep_id, single.doctor_id)) { toast.error(t("schedules.notAssigned")); return; }
    if (new Date(single.scheduled_at.replace("T", " ")) < new Date()) { toast.error(t("schedules.pastDate")); return; }
    setSubmitting(true);
    try {
      await companyService.createSchedule({ rep_id: single.rep_id, doctor_id: single.doctor_id, scheduled_at: toApiDatetime(single.scheduled_at), notes: single.notes || undefined });
      toast.success(t("schedules.created")); onCreated(); onClose();
    } catch { toast.error(t("schedules.createFailed")); }
    finally { setSubmitting(false); }
  };

  const handleBatchSubmit = async () => {
    if (!batchRepId) { toast.error(t("schedules.createError")); return; }
    const validRows = rows.filter((r) => r.doctor_id && r.scheduled_at);
    if (validRows.length === 0) { toast.error(t("schedules.createError")); return; }
    if (validRows.some((r) => !isAssigned(batchRepId, r.doctor_id))) { toast.error(t("schedules.notAssignedBatch")); return; }
    const now = new Date();
    if (validRows.some((r) => new Date(r.scheduled_at.replace("T", " ")) < now)) { toast.error(t("schedules.pastDate")); return; }
    setSubmitting(true);
    try {
      const payload = validRows.map((r) => ({ rep_id: batchRepId, doctor_id: r.doctor_id, scheduled_at: toApiDatetime(r.scheduled_at), notes: r.notes || undefined }));
      await companyService.batchCreateSchedules(payload);
      toast.success(t("schedules.batchCreated", { count: payload.length })); onCreated(); onClose();
    } catch { toast.error(t("schedules.batchCreateFailed")); }
    finally { setSubmitting(false); }
  };

  const handleClose = () => {
    setMode("single"); setSingle({ rep_id: "", doctor_id: "", scheduled_at: toDatetimeLocal(now), notes: "" });
    setBatchRepId(""); setRows([{ doctor_id: "", scheduled_at: toDatetimeLocal(now), notes: "" }]); setDoctorSearch(""); onClose();
  };

  const removeRow = (idx) => setRows((p) => p.filter((_, j) => j !== idx));
  const addRow = () => setRows((p) => [...p, { doctor_id: "", scheduled_at: toDatetimeLocal(now), notes: "" }]);
  const updateRow = (idx, patch) => setRows((p) => p.map((r, j) => j === idx ? { ...r, ...patch } : r));

  const getRowDoctorList = (row) => {
    const q = (row._search || "").toLowerCase();
    return q ? doctors.filter((d) => getDoctorName(d).toLowerCase().includes(q) || (d.specialization || "").toLowerCase().includes(q)) : doctors;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease_both]" />
      <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-surface-container-high overflow-hidden animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 flex-shrink-0 border-b border-surface-container-high">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.06] to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/15">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-on-surface tracking-tight">{t("schedules.createTitle")}</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{t("schedules.weeklyDescription")}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-all">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="relative flex bg-surface-container rounded-xl p-1">
            {["single", "batch"].map((m) => {
              const cfg = TAB_CONFIG[m];
              const active = mode === m;
              return (
                <button key={m} onClick={() => setMode(m)}
                  className={`relative flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    active ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}>
                  <span className="material-symbols-outlined text-base">{cfg.icon}</span>
                  {t(cfg.labelKey)}
                  {m === "batch" && rows.length > 1 && (
                    <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-extrabold flex items-center justify-center leading-none">
                      {rows.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-surface-container-high">

          {/* Single Mode */}
          {mode === "single" && (
            <>
              {/* Rep */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.selectRep")}</label>
                <select value={single.rep_id} onChange={(e) => setSingle((p) => ({ ...p, rep_id: e.target.value }))}
                  className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer">
                  <option value="">{t("schedules.selectRep")}</option>
                  {reps.map((r) => {
                    const name = r.user ? `${r.user.f_name || ""} ${r.user.l_name || ""}`.trim() : r.id;
                    return <option key={r.id} value={r.id}>{name}</option>;
                  })}
                </select>
              </div>

              {/* Doctor */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.selectDoctor")}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-lg">search</span>
                  </span>
                  <input type="text" value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder={t("schedules.selectDoctor") + "..."}
                    className="w-full bg-surface-container-high text-on-surface pl-11 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-on-surface-variant/40" />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-surface-container-high divide-y divide-surface-container-high">
                  {filteredDoctors.length === 0 ? (
                    <div className="p-4 text-sm text-on-surface-variant text-center">No doctors found</div>
                  ) : filteredDoctors.map((d) => {
                    const sel = single.doctor_id === d.id;
                    const docAssigned = isAssigned(single.rep_id, d.id);
                    return (
                      <button key={d.id} type="button" onClick={() => setSingle((p) => ({ ...p, doctor_id: d.id }))}
                        className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                          sel ? "bg-primary/[0.06]" : "hover:bg-surface-container"}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                          sel ? "bg-primary text-on-primary" : "bg-primary-container/20 text-primary"}`}>
                          {getInitials(d)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate ${sel ? "font-bold text-primary" : "font-semibold text-on-surface"}`}>{getDoctorName(d)}</p>
                          {d.specialization && <p className="text-[11px] text-on-surface-variant truncate">{d.specialization}{d.workplace_name ? ` \u00b7 ${d.workplace_name}` : ""}</p>}
                        </div>
                        {docAssigned ? (
                          <span className="material-symbols-outlined text-emerald-500 text-lg ml-auto">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-amber-500 text-lg ml-auto">warning</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {single.doctor_id && single.rep_id && !isAssigned(single.rep_id, single.doctor_id) && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium leading-relaxed">
                    <span className="material-symbols-outlined text-amber-500 text-base flex-shrink-0 mt-0.5">info</span>
                    {t("schedules.notAssigned")}
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.dateTime")}</label>
                <input type="datetime-local" value={single.scheduled_at} onChange={(e) => setSingle((p) => ({ ...p, scheduled_at: e.target.value }))}
                  min={toDatetimeLocal(now)}
                  className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.notes")}</label>
                <textarea value={single.notes} onChange={(e) => setSingle((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-h-[80px] resize-none placeholder:text-on-surface-variant/40"
                  placeholder={t("schedules.notesPlaceholder")} />
              </div>
            </>
          )}

          {/* Batch Mode */}
          {mode === "batch" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.selectRep")}</label>
                <select value={batchRepId} onChange={(e) => setBatchRepId(e.target.value)}
                  className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer">
                  <option value="">{t("schedules.selectRep")}</option>
                  {reps.map((r) => {
                    const name = r.user ? `${r.user.f_name || ""} ${r.user.l_name || ""}`.trim() : r.id;
                    return <option key={r.id} value={r.id}>{name}</option>;
                  })}
                </select>
              </div>

              <div className="space-y-4">
                {rows.map((row, i) => {
                  const docList = getRowDoctorList(row);
                  const rowDoctorAssigned = row.doctor_id && batchRepId ? isAssigned(batchRepId, row.doctor_id) : null;
                  return (
                    <div key={i}
                      className="relative bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm hover:shadow-md transition-all overflow-hidden animate-[slideUp_0.2s_ease-out]"
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>

                      {/* Row header */}
                      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center ring-1 ring-primary/15">
                            {i + 1}
                          </span>
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.selectDoctor")}</span>
                        </div>
                        {rows.length > 1 && (
                          <button onClick={() => removeRow(i)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-on-surface-variant/50 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-all">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>

                      <div className="px-4 pb-4 space-y-3">
                        {/* Doctor search + list */}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                            <span className="material-symbols-outlined text-lg">search</span>
                          </span>
                          <input type="text" value={row._search || ""} onChange={(e) => updateRow(i, { _search: e.target.value })}
                            placeholder={t("schedules.selectDoctor") + "..."}
                            className="w-full bg-surface-container-high text-on-surface pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-on-surface-variant/40" />
                        </div>
                        <div className="max-h-32 overflow-y-auto rounded-xl border border-surface-container-high divide-y divide-surface-container-high">
                          {docList.length === 0 ? (
                            <div className="p-3 text-sm text-on-surface-variant text-center">No doctors found</div>
                          ) : docList.map((d) => {
                            const sel = row.doctor_id === d.id;
                            const docAssigned = batchRepId ? isAssigned(batchRepId, d.id) : false;
                            return (
                              <button key={d.id} type="button" onClick={() => updateRow(i, { doctor_id: d.id })}
                                className={`w-full text-left px-3.5 py-2.5 text-sm transition-all flex items-center gap-2.5 ${sel ? "bg-primary/[0.06]" : "hover:bg-surface-container"}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 ${
                                  sel ? "bg-primary text-on-primary" : "bg-primary-container/20 text-primary"}`}>
                                  {getInitials(d)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className={`block truncate font-semibold text-sm ${sel ? "text-primary" : "text-on-surface"}`}>{getDoctorName(d)}</span>
                                  {d.specialization && <span className="block text-[11px] text-on-surface-variant truncate">{d.specialization}</span>}
                                </div>
                                {docAssigned ? (
                                  <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                ) : (
                                  <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Assignment warning for this row */}
                        {rowDoctorAssigned === false && (
                          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium leading-relaxed">
                            <span className="material-symbols-outlined text-amber-500 text-sm flex-shrink-0 mt-px">info</span>
                            {t("schedules.notAssigned")}
                          </div>
                        )}

                        {/* Date & Notes */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.dateTime")}</label>
                            <input type="datetime-local" value={row.scheduled_at} onChange={(e) => updateRow(i, { scheduled_at: e.target.value })}
                              min={toDatetimeLocal(now)}
                              className="w-full bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.notes")}</label>
                            <input type="text" value={row.notes} onChange={(e) => updateRow(i, { notes: e.target.value })}
                              className="w-full bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-on-surface-variant/40"
                              placeholder={t("schedules.notesPlaceholder")} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={addRow} disabled={!batchRepId}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-surface-container-high text-on-surface-variant text-sm font-bold hover:border-primary hover:text-primary hover:bg-primary/[0.04] transition-all flex items-center justify-center gap-2 disabled:opacity-40 group">
                <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">add_circle</span>
                {t("schedules.addRow")}
                {validBatchCount > 0 && (
                  <span className="ml-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-extrabold flex items-center justify-center leading-none group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                    {validBatchCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-container-high flex-shrink-0 flex items-center gap-3">
          <button onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all">
            {t("app.cancel")}
          </button>
          <button onClick={mode === "single" ? handleSingleSubmit : handleBatchSubmit} disabled={submitting || (mode === "batch" && validBatchCount === 0)}
            className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0">
            {submitting ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
              : <span className="material-symbols-outlined text-sm">add</span>}
            {submitting ? t("schedules.creating") : mode === "batch" && validBatchCount > 0
              ? t("schedules.createVisits", { count: validBatchCount }) || `${t("schedules.createTitle")} (${validBatchCount})`
              : t("schedules.createTitle")}
          </button>
        </div>
      </div>
    </div>
  );
}
