import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { companyService } from "../services/company";
import { useTranslation } from "react-i18next";

const GENDERS = [{ value: "male" }, { value: "female" }];

const emptyForm = {
  f_name: "", l_name: "", email: "", password: "", password_confirmation: "",
  phone_number: "", age: "", gender: "", location: "",
};

const inputClass = "w-full bg-surface-container/50 text-on-surface px-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40";

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-surface-container-high rounded-lg animate-pulse" />
              <div className="h-3 w-36 bg-surface-container-high rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-surface-container-high rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-surface-container-high rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RepsPage() {
  const { t } = useTranslation();
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendData, setSuspendData] = useState({ email: "", password: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isRepSuspended = (rep) => {
    const u = rep?.user;
    if (u?.status === "suspended" || rep?.status === "suspended") return true;
    if (u?.is_active === false || rep?.is_active === false) return true;
    if (u?.is_suspended === true || rep?.is_suspended === true) return true;
    return false;
  };

  const fetchReps = () => {
    setLoading(true);
    companyService.getReps()
      .then((res) => setReps(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReps(); }, []);

  const filtered = reps.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = `${r.user?.f_name || ""} ${r.user?.l_name || ""}`.toLowerCase();
    const email = (r.user?.email || "").toLowerCase();
    const loc = (r.user?.location || "").toLowerCase();
    return name.includes(q) || email.includes(q) || loc.includes(q);
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.f_name.trim() || !formData.email.trim()) {
      toast.error(t("reps.nameEmailRequired"));
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error(t("validation.passwordLength"));
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      toast.error(t("validation.passwordsDoNotMatch"));
      return;
    }
    if (formData.age) {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 20 || ageNum > 80) {
        toast.error(t("validation.ageRange"));
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        f_name: formData.f_name, l_name: formData.l_name, email: formData.email,
        password: formData.password, password_confirmation: formData.password_confirmation,
        phone_number: formData.phone_number, age: formData.age, gender: formData.gender,
        location: formData.location,
      };
      await companyService.createRep(payload);
      toast.success(t("reps.repAdded"));
      setFormData(emptyForm);
      setShowForm(false);
      fetchReps();
    } catch {
      toast.error(t("reps.addFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setSubmitting(true);
    try {
      await companyService.suspendRep(suspendTarget.id, suspendData.email, suspendData.password);
      toast.success(t("reps.repSuspended"));
      setSuspendTarget(null);
      setSuspendData({ email: "", password: "" });
      fetchReps();
    } catch {
      toast.error(t("reps.suspendFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (rep) => {
    setSubmitting(true);
    try {
      await companyService.activateRep(rep.id);
      toast.success(t("reps.repActivated"));
      fetchReps();
    } catch {
      toast.error(t("reps.activateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await companyService.deleteRep(deleteTarget.id);
      toast.success(t("reps.repDeleted"));
      setDeleteTarget(null);
      fetchReps();
    } catch {
      toast.error(t("reps.deleteFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = reps.filter((r) => !isRepSuspended(r)).length;
  const suspendedCount = reps.filter((r) => isRepSuspended(r)).length;

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>
      <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">{t("reps.title")}</h1>
            <p className="text-sm text-on-surface-variant mt-1">{t("reps.description")}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">{showForm ? "close" : "person_add"}</span>
            {showForm ? t("app.cancel") : t("reps.addRep")}
          </button>
        </header>

        {/* Stats bar */}
        {!loading && reps.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-sm font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-lg">group</span>
              {t("company.totalReps")}: <span className="text-on-surface font-bold">{reps.length}</span>
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-sm font-semibold text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {t("reps.active")}: <span className="text-on-surface font-bold">{activeCount}</span>
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-sm font-semibold text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {t("reps.suspended")}: <span className="text-on-surface font-bold">{suspendedCount}</span>
            </span>
          </div>
        )}

        {/* Add Form (slide-in) */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl shadow-sm border border-surface-container-high flex flex-col gap-5 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">person_add</span>
              </div>
              <h2 className="text-lg font-extrabold">{t("reps.newRep")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "f_name", label: t("auth.firstName"), type: "text", placeholder: "John", required: true },
                { name: "l_name", label: t("auth.lastName"), type: "text", placeholder: "Doe" },
                { name: "email", label: t("auth.email"), type: "email", placeholder: t("placeholders.email"), required: true },
                { name: "password", label: t("auth.password"), type: "password", placeholder: "********", required: true },
                { name: "password_confirmation", label: t("auth.confirmPassword"), type: "password", placeholder: "********", required: true },
                { name: "phone_number", label: t("auth.phoneNumber"), type: "text", placeholder: t("placeholders.phoneExample") },
                { name: "age", label: t("auth.age"), type: "number", placeholder: t("placeholders.ageExample") },
                { name: "location", label: t("auth.location"), type: "text", placeholder: t("placeholders.locationExample"), full: true },
              ].map((field) => (
                <div key={field.name} className={`flex flex-col gap-1.5 ${field.full ? "md:col-span-2" : ""}`}>
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                    {field.label} {field.required && <span className="text-rose-400">*</span>}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder={field.placeholder}
                    min={field.name === "age" ? 20 : undefined}
                    max={field.name === "age" ? 80 : undefined}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.gender")}</label>
                <div className="flex gap-2 h-[46px] items-center">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, gender: g.value }))}
                      className={`flex-1 h-full rounded-xl text-sm font-bold transition-all border ${
                        formData.gender === g.value
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container/50 border-surface-container-high text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {g.value === "male" ? t("auth.male") : t("auth.female")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm); }}
                className="px-6 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all">
                {t("app.cancel")}
              </button>
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60">
                {submitting ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                  : <span className="material-symbols-outlined text-sm">check</span>}
                {submitting ? t("employees.saving") : t("reps.addRep")}
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        {!loading && reps.length > 0 && (
          <div className="relative max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("employees.searchPlaceholder") || "Search reps..."}
              className={`${inputClass} pl-11`}
            />
          </div>
        )}

        {/* Suspend Modal */}
        {suspendTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-2xl max-w-md w-full border border-surface-container-high animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600">warning</span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">{t("reps.confirmSuspend")}</h3>
                  <p className="text-sm text-on-surface-variant">{t("reps.suspendHint", { name: suspendTarget.user?.f_name })}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 mb-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.email")}</label>
                  <input type="email" value={suspendData.email} onChange={(e) => setSuspendData((p) => ({ ...p, email: e.target.value }))}
                    className={inputClass} placeholder={suspendTarget.user?.email || ""} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.password")}</label>
                  <input type="password" value={suspendData.password} onChange={(e) => setSuspendData((p) => ({ ...p, password: e.target.value }))}
                    className={inputClass} placeholder="********" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setSuspendTarget(null); setSuspendData({ email: "", password: "" }); }}
                  className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all">
                  {t("app.cancel")}
                </button>
                <button onClick={handleSuspend} disabled={submitting || !suspendData.email || !suspendData.password}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all disabled:opacity-60">
                  {submitting ? t("employees.saving") : t("reps.confirmSuspendBtn")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation — top-center toast */}
        {deleteTarget && (
          <div className="fixed top-0 inset-x-0 z-50 flex justify-center pt-6 px-4" onClick={() => setDeleteTarget(null)}>
            <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md flex items-center gap-4 p-4 animate-[fadeIn_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-rose-600 text-xl">delete</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-on-surface truncate">
                  {t("reps.confirmDelete", { name: deleteTarget.user?.f_name || "" })}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {t("reps.deleteHint") || "This action cannot be undone."}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setDeleteTarget(null)}
                  className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-all">
                  {t("app.cancel")}
                </button>
                <button onClick={handleDelete} disabled={submitting}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-60">
                  {submitting ? t("employees.saving") : t("app.delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rep Cards */}
        {loading ? <SkeletonCards /> : filtered.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 rounded-2xl border border-surface-container-high text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">group</span>
              </div>
              <p className="text-on-surface-variant text-lg font-medium">{search ? t("visits.noVisits") : t("reps.noReps")}</p>
              {!search && (
                <button onClick={() => setShowForm(true)}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all shadow-md">
                  {t("reps.addRep")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((rep, i) => {
              const name = rep.user ? `${rep.user.f_name || ""} ${rep.user.l_name || ""}`.trim() : "—";
              const initials = rep.user ? ((rep.user.f_name?.[0] || "") + (rep.user.l_name?.[0] || "")).toUpperCase() : "?";
              const suspended = isRepSuspended(rep);

              return (
                <div key={rep.id} className="group bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg animate-[fadeIn_0.3s_ease-out]"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${
                        suspended ? "bg-amber-100 text-amber-700" : "bg-primary-container/30 text-primary"
                      }`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface truncate">{name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{rep.user?.email}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${
                      suspended ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {suspended ? t("reps.suspended") : t("reps.active")}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {rep.user?.phone_number && (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant/50">call</span>
                        {rep.user.phone_number}
                      </div>
                    )}
                    {rep.user?.location && (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant truncate">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant/50">location_on</span>
                        {rep.user.location}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-surface-container-high">
                    {!suspended ? (
                      <button onClick={() => setSuspendTarget(rep)}
                        className="flex-1 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">pause_circle</span>
                        {t("reps.suspend")}
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(rep)}
                        className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">play_circle</span>
                        {t("reps.activate")}
                      </button>
                    )}
                    <button onClick={() => setDeleteTarget(rep)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-on-surface-variant hover:text-rose-600 transition-all">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
