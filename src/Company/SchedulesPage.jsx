import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { companyService } from "../services/company";
import { useTranslation } from "react-i18next";
import CreateScheduleModal from "./CreateScheduleModal";

const DAY_NAMES_SUNDAY_FIRST = ["sun", "mon", "tue", "wed", "thu", "fri"];
const WEEKDAY_LABELS_EN = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" };

const STATUS_STYLES = {
  planned:   { border: "border-s-primary",       bg: "bg-primary/[0.06]",        text: "text-primary",       dot: "bg-primary",         badge: "bg-primary/10 text-primary" },
  upcoming:  { border: "border-s-amber-500",     bg: "bg-amber-50",              text: "text-amber-700",     dot: "bg-amber-500",       badge: "bg-amber-100 text-amber-700" },
  completed: { border: "border-s-emerald-500",   bg: "bg-emerald-50",            text: "text-emerald-700",   dot: "bg-emerald-500",     badge: "bg-emerald-100 text-emerald-700" },
  cancelled: { border: "border-s-rose-400",      bg: "bg-rose-50",               text: "text-rose-600",      dot: "bg-rose-400",        badge: "bg-rose-100 text-rose-600" },
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 0 : day));
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toDateStr(date) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function formatTime(datetime) {
  if (!datetime) return "";
  const timePart = (datetime.split(" ")[1] || "");
  const [h, m] = timePart.split(":");
  if (!h) return "";
  const hour = parseInt(h, 10), ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m || "00"} ${ampm}`;
}
function getInitial(name) { return (name || "?")[0].toUpperCase(); }

function AdherenceRing({ rate }) {
  const pct = parseFloat(rate) || 0;
  const r = 18, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="transform -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-container-high" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} className="text-primary transition-all duration-1000" />
      </svg>
      <span className="absolute text-xs font-extrabold text-primary">{pct}%</span>
    </div>
  );
}

function QuickCreateSheet({ dayDate, repId, onClose, onCreated }) {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    companyService.getDoctors({ per_page: 200 }).then((r) => setDoctors(r?.data ?? [])).catch(() => {});
    companyService.getAssignments().then((r) => setAssignments(r?.data ?? [])).catch(() => {});
  }, []);

  const isAssigned = (doctorId) =>
    assignments.some((a) => String(a.rep_id) === String(repId) && String(a.doctor_id) === String(doctorId));

  const selectedIsAssigned = selectedDoctor ? isAssigned(selectedDoctor) : false;

  const handleSubmit = async () => {
    if (!selectedDoctor) { toast.error(t("schedules.createError")); return; }
    if (!selectedIsAssigned) { toast.error(t("schedules.notAssigned")); return; }
    const now = new Date();
    if (dayDate.toDateString() === now.toDateString()) {
      const [h, m] = time.split(":").map(Number);
      const sel = new Date(dayDate); sel.setHours(h, m, 0, 0);
      if (sel < now) { toast.error(t("schedules.pastDate")); return; }
    }
    setSubmitting(true);
    try {
      await companyService.createSchedule({
        rep_id: repId, doctor_id: selectedDoctor,
        scheduled_at: `${toDateStr(dayDate)} ${time}:00`,
        notes: notes || undefined,
      });
      toast.success(t("schedules.created"));
      onCreated(); onClose();
    } catch { toast.error(t("schedules.createFailed")); }
    finally { setSubmitting(false); }
  };

  function getDocName(d) { const u = d?.user; return u ? `${u.f_name || ""} ${u.l_name || ""}`.trim() : d?.id || "Unknown"; }
  function getDocInitials(d) { const u = d?.user; return ((u?.f_name?.[0] || "") + (u?.l_name?.[0] || "")).toUpperCase() || "?"; }

  const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl border border-surface-container-high overflow-hidden animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-surface-container-high">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-on-surface">{t("schedules.createTitle")}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{dayLabel}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-all">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* Doctor Select */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.selectDoctor")}</label>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-surface-container-high divide-y divide-surface-container-high">
              {doctors.length === 0 ? (
                <div className="p-4 text-center">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant/20 block mb-1">person_search</span>
                  <p className="text-xs text-on-surface-variant">{t("schedules.selectRep")}</p>
                </div>
              ) : doctors.map((d) => {
                const sel = selectedDoctor === d.id;
                const docAssigned = isAssigned(d.id);
                return (
                  <button key={d.id} type="button" onClick={() => setSelectedDoctor(d.id)}
                    className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                      sel ? "bg-primary/[0.06]" : "hover:bg-surface-container"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                      sel ? "bg-primary text-on-primary" : "bg-primary-container/20 text-primary"}`}>
                      {getDocInitials(d)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-semibold ${sel ? "text-primary" : "text-on-surface"}`}>{getDocName(d)}</p>
                    </div>
                    {docAssigned ? (
                      <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDoctor && !selectedIsAssigned && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium leading-relaxed">
                <span className="material-symbols-outlined text-amber-500 text-base flex-shrink-0 mt-0.5">info</span>
                {t("schedules.notAssigned")}
              </div>
            )}
          </div>

          {/* Time & Notes Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.time")}</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("schedules.notes")}</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("schedules.notesPlaceholder")}
                className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-on-surface-variant/40" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-container-high flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-sm font-bold transition-all">
            {t("app.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={submitting || !selectedDoctor || !selectedIsAssigned}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary text-sm font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                {t("schedules.creating")}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">add</span>
                {t("schedules.created").replace("!", "").trim() || "Create"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulesPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reps, setReps] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedRepId, setSelectedRepId] = useState("");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [inlineCreate, setInlineCreate] = useState(null);
  const [stats, setStats] = useState(null);

  const weekDays = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = useMemo(() => addDays(weekStart, 5), [weekStart]);
  const weekLabel = useMemo(() => {
    const s = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const e = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${s} \u2013 ${e}`;
  }, [weekStart, weekEnd]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { from: toDateStr(weekStart), to: toDateStr(addDays(weekStart, 6)) };
    if (selectedRepId) params.rep_id = selectedRepId;
    Promise.all([
      companyService.getSchedules(params),
      companyService.getReps(),
      companyService.getAssignments(),
    ])
      .then(([schedRes, repRes, assignRes]) => {
        setSchedules(schedRes?.data ?? []);
        setReps(repRes?.data ?? []);
        setAssignments(assignRes?.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weekStart, selectedRepId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    companyService.getDashboard().then((r) => setStats(r?.data?.stats ?? null)).catch(() => {});
  }, []);

  const findDefaultWeek = useCallback(() => {
    companyService.getSchedules({ status: "planned" })
      .then((res) => {
        const planned = res?.data ?? [];
        if (planned.length > 0) {
          const earliest = planned.map((s) => s.scheduled_at?.split(" ")[0]).filter(Boolean).sort()[0];
          if (earliest) { setWeekStart(getWeekStart(new Date(earliest + "T00:00:00"))); return; }
        }
        setWeekStart(getWeekStart(new Date()));
      })
      .catch(() => { setWeekStart(getWeekStart(new Date())); });
  }, []);

  useEffect(() => { findDefaultWeek(); }, [findDefaultWeek]);

  const schedulesByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((d) => { map[toDateStr(d)] = []; });
    schedules.forEach((s) => {
      const key = s.scheduled_at?.split(" ")[0];
      if (map[key]) map[key].push(s);
    });
    Object.keys(map).forEach((k) => { map[k].sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || "")); });
    return map;
  }, [schedules, weekDays]);

  const assignedDoctorsForRep = useMemo(() => {
    if (!selectedRepId) return [];
    return assignments.filter((a) => String(a.rep_id) === String(selectedRepId)).map((a) => a.doctor_id);
  }, [assignments, selectedRepId]);

  const uniqueLocations = useMemo(() => new Set(schedules.map((s) => s.workplace_name).filter(Boolean)).size, [schedules]);

  const conflictCount = useMemo(() => {
    const byDayTime = {};
    schedules.forEach((s) => { const key = s.scheduled_at; if (!byDayTime[key]) byDayTime[key] = []; byDayTime[key].push(s); });
    return Object.values(byDayTime).filter((arr) => arr.length > 1).reduce((sum, arr) => sum + arr.length - 1, 0);
  }, [schedules]);

  const handlePublish = async (schedule) => {
    setActionLoading(schedule.id);
    try { await companyService.publishSchedule(schedule.id); toast.success(t("schedules.published")); fetchData(); }
    catch { toast.error(t("schedules.publishFailed")); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (schedule) => {
    if (!window.confirm(t("schedules.confirmCancel", { doctor: schedule.doctor_name }))) return;
    setActionLoading(schedule.id);
    try { await companyService.cancelSchedule(schedule.id); toast.success(t("schedules.cancelled")); fetchData(); }
    catch { toast.error(t("schedules.cancelFailed")); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface" dir={isRtl ? "rtl" : "ltr"}>
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>
      <div className="relative z-10 max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{t("schedules.weeklyTitle")}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">{t("schedules.weeklyTitle")}</h1>
            <p className="text-sm text-on-surface-variant mt-1 max-w-lg">{t("schedules.weeklyDescription")}</p>
          </div>
          <button
            onClick={() => reps.length === 0 ? toast.error(t("schedules.addRepFirst")) : setShowCreateModal(true)}
            className="group px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">add</span>
            {t("schedules.createTitle")}
          </button>
        </div>

        {/* Bento Grid */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-5">

            {/* Rep Selector */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-surface-container-high">
                <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">badge</span>
                  {t("schedules.rep")}
                </h3>
              </div>
              {reps.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-on-surface-variant">{t("schedules.noReps")}</p>
                </div>
              ) : (
                <div className="p-2 max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-surface-container-high">
                  <button onClick={() => setSelectedRepId("")}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-all ${
                      !selectedRepId ? "bg-primary/[0.08] ring-1 ring-primary/20 shadow-sm" : "hover:bg-surface-container"
                    }`}>
                    <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">groups</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface">{t("schedules.allReps")}</p>
                      <p className="text-[10px] text-on-surface-variant">{reps.length} {t("company.totalReps")}</p>
                    </div>
                    {!selectedRepId && <span className="material-symbols-outlined text-sm text-primary">check</span>}
                  </button>
                  <div className="my-1.5 mx-3 h-px bg-surface-container-high" />
                  {reps.map((r) => {
                    const name = r.user ? `${r.user.f_name || ""} ${r.user.l_name || ""}`.trim() : r.rep_name || r.id;
                    const isSel = selectedRepId === r.id;
                    const suspended = r.user?.status === "suspended";
                    return (
                      <button key={r.id} onClick={() => setSelectedRepId(isSel ? "" : r.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-all ${
                          isSel ? "bg-primary/[0.08] ring-1 ring-primary/20 shadow-sm" : "hover:bg-surface-container"
                        }`}>
                        <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-extrabold text-primary">{getInitial(name)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-on-surface truncate">{name}</p>
                          <p className="text-[10px] text-on-surface-variant truncate">{r.user?.location || t("schedules.rep")}</p>
                        </div>
                        {suspended ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">!</span>
                        ) : isSel ? (
                          <span className="material-symbols-outlined text-sm text-primary">check</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assigned Doctors */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-surface-container-high">
                <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">local_hospital</span>
                  {t("schedules.availableDoctors")}
                </h3>
              </div>
              <div className="p-3 min-h-[80px]">
                {!selectedRepId ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant/20">person_search</span>
                    <p className="text-xs text-on-surface-variant text-center">{t("schedules.selectRep")}</p>
                  </div>
                ) : assignedDoctorsForRep.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant/20">warning</span>
                    <p className="text-xs text-on-surface-variant text-center">{t("schedules.noDoctorsAssigned")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {assignedDoctorsForRep.map((docId) => {
                      const assignment = assignments.find((a) => String(a.rep_id) === String(selectedRepId) && String(a.doctor_id) === String(docId));
                      return (
                        <div key={docId} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container/30 border border-surface-container-high/50">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-200" />
                          <span className="text-sm font-semibold text-on-surface truncate">{assignment?.doctor_name || docId}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Efficiency */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-surface-container-high">
                <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">donut_large</span>
                  {t("schedules.efficiencyAnalysis")}
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <AdherenceRing rate={stats?.adherence_rate || 0} />
                  <div>
                    <p className="text-2xl font-extrabold text-on-surface tabular-nums">{stats?.adherence_rate || 0}%</p>
                    <p className="text-[11px] text-on-surface-variant font-medium">{t("company.adherenceRate")}</p>
                  </div>
                </div>
                <div className="mt-4 w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary-dim h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(stats?.adherence_rate || 0, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Calendar Area */}
          <div className="flex-1 min-w-0">
            {/* Week Nav */}
            <div className="flex items-center justify-between mb-5 bg-surface-container-lowest rounded-2xl border border-surface-container-high p-3">
              <div className="flex items-center gap-1">
                <button onClick={() => navigateWeek(-1)}
                  className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all">
                  <span className="material-symbols-outlined text-xl">{isRtl ? "chevron_left" : "chevron_right"}</span>
                </button>
                <div className="text-center min-w-[180px]">
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">{t("schedules.weekOf")}</p>
                  <p className="text-base font-extrabold text-on-surface">{weekLabel}</p>
                </div>
                <button onClick={() => navigateWeek(1)}
                  className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all">
                  <span className="material-symbols-outlined text-xl">{isRtl ? "chevron_right" : "chevron_left"}</span>
                </button>
              </div>
              <button onClick={() => setWeekStart(getWeekStart(new Date()))}
                className="px-4 py-2 rounded-xl bg-primary/[0.08] hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">today</span>
                {t("schedules.today")}
              </button>
            </div>

            {/* Calendar */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="h-16 rounded-2xl bg-surface-container-high animate-pulse" />
                    <div className="flex-1 min-h-[160px] space-y-2">
                      <div className="h-20 rounded-2xl bg-surface-container-high animate-pulse" />
                      <div className="h-20 rounded-2xl bg-surface-container-high animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {weekDays.map((dayDate, idx) => {
                  const dateKey = toDateStr(dayDate);
                  const daySchedules = schedulesByDay[dateKey] || [];
                  const isFriday = idx === 5;
                  const dayLabel = WEEKDAY_LABELS_EN[DAY_NAMES_SUNDAY_FIRST[idx]];
                  const isToday = dateKey === toDateStr(new Date());

                  return (
                    <div key={dateKey} className="flex flex-col gap-2">
                      {/* Day Header */}
                      <div className={`relative text-center py-3 rounded-2xl overflow-hidden ${
                        isToday
                          ? "bg-gradient-to-br from-primary to-primary-dim text-on-primary shadow-lg shadow-primary/20"
                          : isFriday
                            ? "bg-surface-container-high text-on-surface-variant"
                            : "bg-surface-container-lowest border border-surface-container-high"
                      }`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${
                          isToday ? "text-on-primary/80" : "opacity-60"
                        }`}>{t(`schedules.${dayLabel}`, dayLabel)}</p>
                        <p className={`text-xl font-extrabold ${
                          isToday ? "text-on-primary" : "text-on-surface"
                        }`}>{dayDate.getDate()}</p>
                        {isToday && (
                          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/[0.06] rounded-full blur-xl" />
                        )}
                      </div>

                      {isFriday ? (
                        <div className="flex-1 min-h-[160px] flex items-center justify-center rounded-2xl bg-surface-container-lowest border border-surface-container-high/60">
                          <div className="text-center">
                            <div className="w-10 h-10 rounded-xl bg-surface-container mx-auto flex items-center justify-center">
                              <span className="material-symbols-outlined text-lg text-on-surface-variant/30">hotel</span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant/30 mt-2 font-semibold">{t("schedules.offDay")}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-h-[160px] flex flex-col gap-1.5">
                          {daySchedules.map((schedule) => {
                            const colors = STATUS_STYLES[schedule.status] || STATUS_STYLES.planned;
                            const isBusy = actionLoading === schedule.id;
                            const canPublish = schedule.status === "planned";
                            const canCancel = schedule.status === "planned" || schedule.status === "upcoming";
                            return (
                              <div key={schedule.id}
                                className={`rounded-2xl border-s-[3px] ${colors.border} ${colors.bg} p-3 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer`}
                                onClick={() => { if (canPublish) handlePublish(schedule); else if (canCancel) handleCancel(schedule); }}>
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-2">
                                      <span className="material-symbols-outlined text-[11px] text-on-surface-variant/40 shrink-0">schedule</span>
                                      <span className="text-[11px] font-bold text-on-surface-variant tabular-nums whitespace-nowrap">{formatTime(schedule.scheduled_at)}</span>
                                    </div>
                                    <p className="text-sm font-bold text-on-surface truncate leading-snug">{schedule.doctor_name}</p>
                                    {schedule.workplace_name && (
                                      <p className="text-[11px] text-on-surface-variant/60 truncate flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[11px]">location_on</span>
                                        {schedule.workplace_name}
                                      </p>
                                    )}
                                    {schedule.notes && (
                                      <p className="text-[11px] text-on-surface-variant/40 truncate mt-0.5 leading-relaxed">&ldquo;{schedule.notes}&rdquo;</p>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                                    {canPublish && (
                                      <button onClick={(e) => { e.stopPropagation(); handlePublish(schedule); }} disabled={isBusy}
                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-primary/10 text-on-surface-variant/30 hover:text-primary transition-all disabled:opacity-30 active:scale-90"
                                        title={t("schedules.publish")}>
                                        {isBusy
                                          ? <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                                          : <span className="material-symbols-outlined text-xs">send</span>}
                                      </button>
                                    )}
                                    {canCancel && (
                                      <button onClick={(e) => { e.stopPropagation(); handleCancel(schedule); }} disabled={isBusy}
                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-rose-50 text-on-surface-variant/30 hover:text-rose-500 transition-all disabled:opacity-30 active:scale-90"
                                        title={t("schedules.cancel")}>
                                        <span className="material-symbols-outlined text-xs">close</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {!isFriday && dayDate.toDateString() >= new Date().toDateString() && (
                            <div className="mt-auto">
                              <button onClick={() => setInlineCreate({ dateKey })}
                                className="w-full py-3 rounded-2xl border border-dashed border-surface-container-high/70 hover:border-primary/40 hover:bg-primary/[0.03] text-on-surface-variant/50 hover:text-primary transition-all flex items-center justify-center gap-1.5 group">
                                <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">add</span>
                                <span className="text-[10px] font-semibold">{t("schedules.emptySlot")}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {[
            { icon: "calendar_month", label: t("schedules.scheduledVisits"), value: stats?.total_schedules ?? schedules.length, accent: "bg-primary-container/20 text-primary" },
            { icon: "group", label: t("schedules.coveredDoctors"), value: stats?.total_assignments ?? assignments.length, accent: "bg-violet-100 text-violet-600" },
            { icon: "pin_drop", label: t("schedules.regions"), value: uniqueLocations, accent: "bg-amber-100 text-amber-600" },
            { icon: "warning", label: t("schedules.conflicts"), value: conflictCount, accent: conflictCount > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600" },
          ].map((stat, i) => (
            <div key={stat.label}
              className="group bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`w-12 h-12 rounded-xl ${stat.accent} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-on-surface tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/20 text-lg ml-auto transition-all group-hover:text-primary group-hover:translate-x-0.5">
                arrow_forward
              </span>
            </div>
          ))}
        </div>

        <CreateScheduleModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={fetchData} />
      </div>

      {/* Quick Create Sheet */}
      {inlineCreate && (
        <QuickCreateSheet
          dayDate={new Date(inlineCreate.dateKey + "T00:00:00")}
          repId={selectedRepId || (reps[0]?.id ?? "")}
          onClose={() => setInlineCreate(null)}
          onCreated={fetchData}
        />
      )}
    </div>
  );

  function navigateWeek(dir) { setWeekStart((prev) => addDays(prev, dir * 7)); }
}
