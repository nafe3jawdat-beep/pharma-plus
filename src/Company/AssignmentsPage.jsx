import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { companyService } from "../services/company";
import { useTranslation } from "react-i18next";

const inputClass = "w-full bg-surface-container/50 text-on-surface px-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40";

function getDoctorName(d) { const u = d?.user; return u ? `${u.f_name || ""} ${u.l_name || ""}`.trim() : d?.id || "Unknown"; }
function getRepName(r) { const u = r?.user; return u ? `${u.f_name || ""} ${u.l_name || ""}`.trim() : r?.id || "Unknown"; }
function getDoctorInitials(d) { const u = d?.user; return ((u?.f_name?.[0] || "") + (u?.l_name?.[0] || "")).toUpperCase() || "?"; }

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="flex-1 space-y-2"><div className="h-4 w-24 bg-surface-container-high rounded-lg animate-pulse" /><div className="h-3 w-32 bg-surface-container-high rounded-lg animate-pulse" /></div>
          </div>
          <div className="h-3 w-full bg-surface-container-high rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function AssignmentsPage() {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [reps, setReps] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [repSearch, setRepSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedRep, setSelectedRep] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState([]);

  const fetchAssignments = () => {
    companyService.getAssignments()
      .then((res) => setAssignments(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssignments();
    companyService.getReps().then((r) => setReps(r?.data ?? [])).catch(() => {});
    companyService.getDoctors({ per_page: 200 }).then((r) => setDoctors(r?.data ?? [])).catch(() => {});
  }, []);

  const assignedDoctorIds = useMemo(() => {
    if (!selectedRep) return new Set();
    return new Set(assignments.filter((a) => String(a.rep_id) === String(selectedRep)).map((a) => String(a.doctor_id)));
  }, [assignments, selectedRep]);

  const availableDoctors = useMemo(() => doctors.filter((d) => !assignedDoctorIds.has(String(d.id))), [doctors, assignedDoctorIds]);

  const filteredDoctors = useMemo(() => {
    if (!doctorSearch.trim()) return availableDoctors;
    const q = doctorSearch.toLowerCase();
    return availableDoctors.filter((d) => {
      const name = getDoctorName(d).toLowerCase();
      const spec = (d.specialization || "").toLowerCase();
      const wp = (d.workplace_name || "").toLowerCase();
      return name.includes(q) || spec.includes(q) || wp.includes(q);
    });
  }, [availableDoctors, doctorSearch]);

  const filteredReps = useMemo(() => {
    if (!repSearch.trim()) return reps;
    const q = repSearch.toLowerCase();
    return reps.filter((r) => getRepName(r).toLowerCase().includes(q));
  }, [reps, repSearch]);

  const pendingCount = useMemo(() => {
    if (!selectedRep) return 0;
    return assignments.filter((a) => String(a.rep_id) === String(selectedRep)).length;
  }, [assignments, selectedRep]);

  const isSelected = (doctorId) => selectedDoctors.some((d) => String(d.id) === String(doctorId));
  const addDoctor = (doctor) => { if (!isSelected(doctor.id)) setSelectedDoctors((p) => [...p, doctor]); };
  const removeDoctor = (doctorId) => setSelectedDoctors((p) => p.filter((d) => String(d.id) !== String(doctorId)));

  const handleConfirm = async () => {
    if (!selectedRep || selectedDoctors.length === 0) { toast.error(t("assignments.formError")); return; }
    setSubmitting(true);
    let created = 0, failed = 0;
    try {
      for (const doc of selectedDoctors) {
        try { await companyService.createAssignment(selectedRep, doc.id); created++; } catch { failed++; }
      }
      if (created > 0) {
        toast.success(failed > 0 ? `${t("assignments.created")} (${failed} ${t("assignments.createFailed")})` : t("assignments.created"));
      } else { toast.error(t("assignments.createFailed")); }
      setSelectedDoctors([]);
      fetchAssignments();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (assignment) => {
    if (!window.confirm(t("assignments.confirmDelete", { rep: assignment.rep_name, doctor: assignment.doctor_name }))) return;
    try { await companyService.deleteAssignment(assignment.id); toast.success(t("assignments.deleted")); fetchAssignments(); }
    catch { toast.error(t("assignments.deleteFailed")); }
  };

  const openForm = () => { setShowBatchForm(true); setSelectedDoctors([]); setSelectedRep(""); setDoctorSearch(""); setRepSearch(""); };
  const closeForm = () => { setShowBatchForm(false); setSelectedDoctors([]); setSelectedRep(""); setDoctorSearch(""); setRepSearch(""); };

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>
      <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">{t("assignments.title")}</h1>
            <p className="text-sm text-on-surface-variant mt-1 max-w-xl">{t("assignments.description")}</p>
          </div>
          <button onClick={showBatchForm ? closeForm : openForm}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-sm">{showBatchForm ? "close" : "add"}</span>
            {showBatchForm ? t("app.cancel") : t("assignments.addAssignment")}
          </button>
        </header>

        {/* Batch Form */}
        {showBatchForm && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-[fadeIn_0.2s_ease-out]">
            {/* Left: Doctor Selection */}
            <div className="lg:col-span-7">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-extrabold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person_search</span>
                    {t("assignments.selectDoctors")}
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[11px] font-bold text-on-surface-variant">
                      {t("assignments.all")} ({doctors.length})
                    </span>
                    <span className="px-3 py-1 bg-primary/10 rounded-full text-[11px] font-bold text-primary">
                      {t("assignments.available")} ({availableDoctors.length})
                    </span>
                  </div>
                </div>
                <div className="relative mb-4">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-lg">search</span>
                  </span>
                  <input type="text" value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder={t("assignments.selectDoctor") + "..."} className={`${inputClass} pl-11`} />
                </div>
                <div className="grid grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-surface-container-high rounded-lg">
                  {filteredDoctors.length === 0 ? (
                    <div className="py-12 text-center text-on-surface-variant text-sm">{t("assignments.noAssignments")}</div>
                  ) : filteredDoctors.map((doctor) => {
                    const added = isSelected(doctor.id);
                    return (
                      <div key={doctor.id}
                        className={`p-3.5 rounded-xl flex items-center justify-between border transition-all group ${
                          added ? "border-primary bg-primary/[0.04]" : "border-transparent bg-surface-container/40 hover:border-surface-container-high"
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary text-xs font-extrabold flex-shrink-0">
                            {getDoctorInitials(doctor)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-on-surface truncate">{getDoctorName(doctor)}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {doctor.specialization || ""}{doctor.specialization && doctor.workplace_name ? " \u00b7 " : ""}{doctor.workplace_name || ""}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => added ? removeDoctor(doctor.id) : addDoctor(doctor)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                            added ? "bg-primary text-on-primary" : "bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary"
                          }`}>
                          <span className="material-symbols-outlined text-lg">{added ? "check" : "add"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Rep Selector & Summary */}
            <div className="lg:col-span-5 space-y-5">
              {/* Rep Selector */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high">
                <h3 className="text-base font-extrabold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  {t("assignments.selectRep")}
                </h3>
                <div className="relative mb-3">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none">
                    <span className="material-symbols-outlined text-lg">search</span>
                  </span>
                  <input type="text" value={repSearch} onChange={(e) => setRepSearch(e.target.value)}
                    placeholder={t("assignments.selectRep") + "..."} className={`${inputClass} pl-11`} />
                </div>
                <select value={selectedRep} onChange={(e) => { setSelectedRep(e.target.value); setSelectedDoctors([]); setDoctorSearch(""); }}
                  className="w-full bg-surface-container/50 border border-surface-container-high rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm font-semibold text-on-surface appearance-none">
                  <option value="">{t("assignments.selectRep")}</option>
                  {filteredReps.map((r) => (
                    <option key={r.id} value={r.id}>{getRepName(r)}</option>
                  ))}
                </select>
                {selectedRep && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-primary/[0.05] rounded-xl">
                    <span className="material-symbols-outlined text-primary text-lg">info</span>
                    <p className="text-xs font-bold text-primary">{t("assignments.repStatus", { count: pendingCount })}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-lg shadow-primary/10 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="text-lg font-extrabold mb-0.5">{t("assignments.summaryTitle")}</h3>
                      <p className="text-primary-container/70 text-xs">{t("assignments.selectedCount", { count: selectedDoctors.length })}</p>
                    </div>
                    <span className="bg-primary-container text-primary px-2.5 py-1 rounded-full text-[11px] font-bold">{t("assignments.underReview")}</span>
                  </div>

                  {selectedDoctors.length > 0 ? (
                    <div className="space-y-2.5 mb-6 max-h-[200px] overflow-y-auto pr-1">
                      {selectedDoctors.map((doc, i) => (
                        <div key={doc.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold">{i + 1}</div>
                            <p className="text-sm font-medium">{getDoctorName(doc)}</p>
                          </div>
                          <button onClick={() => removeDoctor(doc.id)} className="text-primary-container/40 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-6 py-6 text-center">
                      <p className="text-primary-container/40 text-sm">{t("assignments.selectDoctor")}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <button onClick={handleConfirm} disabled={submitting || !selectedRep || selectedDoctors.length === 0}
                      className="w-full bg-primary-container text-primary py-3.5 rounded-xl font-extrabold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                        : <span className="material-symbols-outlined text-lg">send</span>}
                      {submitting ? t("employees.saving") : t("assignments.confirmAndSend")}
                    </button>
                    <button onClick={() => setSelectedDoctors([])} className="w-full py-2 text-primary-container/60 text-xs font-bold hover:text-white transition-colors">
                      {t("assignments.cancelAll")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="bg-primary/[0.04] p-4 rounded-xl border-r-4 border-primary/30">
                <p className="text-primary text-xs font-bold mb-1">{t("assignments.smartTip")}</p>
                <p className="text-on-surface-variant text-xs">{t("assignments.tipText")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Existing Assignments */}
        {loading ? <SkeletonCards /> : assignments.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 rounded-2xl border border-surface-container-high text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">link</span>
              </div>
              <p className="text-on-surface-variant text-lg font-medium">{t("assignments.noAssignments")}</p>
              <button onClick={openForm} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all shadow-md">
                {t("assignments.addAssignment")}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignments.map((a, i) => (
              <div key={a.id} className="group relative bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg animate-[fadeIn_0.3s_ease-out]"
                style={{ animationDelay: `${i * 40}ms` }}>

                {/* Delete Button (always visible) */}
                <button onClick={() => handleDelete(a)}
                  className="absolute top-3 end-3 w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant/30 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                  title={t("app.delete")}>
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>

                {/* Connection Line */}
                <div className="absolute left-1/2 top-20 bottom-20 w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent hidden md:block" />

                <div className="flex flex-col gap-4">
                  {/* Rep Row */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-on-primary text-sm font-extrabold flex items-center justify-center flex-shrink-0 shadow-sm">
                      {(a.rep_name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface truncate">{a.rep_name || "—"}</p>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("assignments.repLabel")}</p>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="flex items-center gap-2.5 px-1">
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-primary/5" />
                    <span className="material-symbols-outlined text-xs text-primary/30">arrow_downward</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-primary/5" />
                  </div>

                  {/* Doctor Row */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary-container to-secondary-container/70 text-on-secondary-container text-sm font-extrabold flex items-center justify-center flex-shrink-0 shadow-sm">
                      {(a.doctor_name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface truncate">{a.doctor_name || "—"}</p>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("assignments.doctorLabel")}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
