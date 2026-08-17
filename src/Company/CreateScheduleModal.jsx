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

  const handleSingleSubmit = async () => {
    if (!single.rep_id || !single.doctor_id || !single.scheduled_at) { toast.error(t("schedules.createError")); return; }
    if (!isAssigned(single.rep_id, single.doctor_id)) { toast.error(t("schedules.notAssigned")); return; }
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-surface-container-high overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-surface-container-high">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-on-surface">{t("schedules.createTitle")}</h2>
                <p className="text-xs text-on-surface-variant">{t("schedules.weeklyDescription")}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-all">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-surface-container rounded-xl p-1">
            {["single", "batch"].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === m ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}>
                {t(`schedules.create${m.charAt(0).toUpperCase() + m.slice(1)}`)}
              </button>
            ))}
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
                    return (
                      <button key={d.id} type="button" onClick={() => setSingle((p) => ({ ...p, doctor_id: d.id }))}
                        className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                          sel ? "bg-primary/[0.06]" : "hover:bg-surface-container"}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                          sel ? "bg-primary text-on-primary" : "bg-primary-container/20 text-primary"}`}>
                          {getInitials(d)}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate ${sel ? "font-bold text-primary" : "font-semibold text-on-surface"}`}>{getDoctorName(d)}</p>
                          {d.specialization && <p className="text-[11px] text-on-surface-variant truncate">{d.specialization}{d.workplace_name ? ` \u00b7 ${d.workplace_name}` : ""}</p>}
                        </div>
                        {sel && <span className="material-symbols-outlined text-primary text-lg ml-auto">check_circle</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.dateTime")}</label>
                <input type="datetime-local" value={single.scheduled_at} onChange={(e) => setSingle((p) => ({ ...p, scheduled_at: e.target.value }))}
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
                {rows.map((row, i) => (
                  <div key={i} className="bg-surface-container/30 rounded-xl p-4 space-y-3 relative border border-surface-container-high">
                    {rows.length > 1 && (
                      <button onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-rose-100 text-on-surface-variant hover:text-rose-600 transition-all">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.selectDoctor")}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                          <span className="material-symbols-outlined text-lg">search</span>
                        </span>
                        <input type="text" value={row._search || ""} onChange={(e) => setRows((p) => p.map((r, j) => j === i ? { ...r, _search: e.target.value } : r))}
                          placeholder={t("schedules.selectDoctor") + "..."}
                          className="w-full bg-surface-container-high text-on-surface pl-11 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-on-surface-variant/40" />
                      </div>
                      <div className="max-h-36 overflow-y-auto rounded-xl border border-surface-container-high divide-y divide-surface-container-high">
                        {(row._search ? doctors.filter((d) => { const q = row._search.toLowerCase(); return getDoctorName(d).toLowerCase().includes(q) || (d.specialization || "").toLowerCase().includes(q); }) : doctors).length === 0 ? (
                          <div className="p-3 text-sm text-on-surface-variant text-center">No doctors found</div>
                        ) : (row._search ? doctors.filter((d) => { const q = row._search.toLowerCase(); return getDoctorName(d).toLowerCase().includes(q) || (d.specialization || "").toLowerCase().includes(q); }) : doctors).map((d) => {
                          const sel = row.doctor_id === d.id;
                          return (
                            <button key={d.id} type="button" onClick={() => setRows((p) => p.map((r, j) => j === i ? { ...r, doctor_id: d.id } : r))}
                              className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 ${sel ? "bg-primary/[0.06]" : "hover:bg-surface-container"}`}>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                                sel ? "bg-primary text-on-primary" : "bg-primary-container/20 text-primary"}`}>
                                {getInitials(d)}
                              </div>
                              <div className="min-w-0">
                                <span className={`block truncate font-semibold ${sel ? "text-primary" : "text-on-surface"}`}>{getDoctorName(d)}</span>
                                {d.specialization && <span className="block text-[11px] text-on-surface-variant truncate">{d.specialization}</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.dateTime")}</label>
                        <input type="datetime-local" value={row.scheduled_at} onChange={(e) => setRows((p) => p.map((r, j) => j === i ? { ...r, scheduled_at: e.target.value } : r))}
                          className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.notes")}</label>
                        <input type="text" value={row.notes} onChange={(e) => setRows((p) => p.map((r, j) => j === i ? { ...r, notes: e.target.value } : r))}
                          className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-on-surface-variant/40"
                          placeholder={t("schedules.notesPlaceholder")} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setRows((p) => [...p, { doctor_id: "", scheduled_at: toDatetimeLocal(now), notes: "" }])} disabled={!batchRepId}
                className="w-full py-3 rounded-xl border-2 border-dashed border-surface-container-high text-on-surface-variant text-sm font-bold hover:border-primary hover:text-primary hover:bg-primary/[0.04] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">add</span>{t("schedules.addRow")}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-container-high flex-shrink-0 flex justify-end gap-3">
          <button onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all">
            {t("app.cancel")}
          </button>
          <button onClick={mode === "single" ? handleSingleSubmit : handleBatchSubmit} disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60 disabled:hover:shadow-none disabled:hover:translate-y-0">
            {submitting ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
              : <span className="material-symbols-outlined text-sm">add</span>}
            {submitting ? t("schedules.creating") : t("schedules.createTitle")}
          </button>
        </div>
      </div>
    </div>
  );
}
