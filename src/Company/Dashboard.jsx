import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { companyService } from "../services/company";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

function AdherenceRing({ rate }) {
  const pct = parseFloat(rate) || 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-container-high" />
        <circle
          cx="32" cy="32" r={radius}
          fill="none" stroke="currentColor" strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-extrabold text-primary">{pct}%</span>
    </div>
  );
}

function StatCard({ icon, label, value, onClick, accent, delay }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{label}</p>
        </div>
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight tabular-nums">{value ?? "--"}</h2>
          {onClick && (
            <span className="material-symbols-outlined text-on-surface-variant/30 text-lg group-hover:text-primary group-hover:translate-x-0.5 transition-all">
              arrow_forward
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-on-surface">{value || "--"}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-surface-container-high animate-pulse" />
        <div className="h-3 w-20 bg-surface-container-high rounded animate-pulse" />
      </div>
      <div className="h-8 w-16 bg-surface-container-high rounded animate-pulse" />
    </div>
  );
}

export default function CompanyDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyService.getDashboard()
      .then((res) => setData(res?.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const company = data?.company;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greetingMorning");
    if (h < 17) return t("dashboard.greetingAfternoon");
    return t("dashboard.greetingEvening");
  })();

  const statCards = [
    { icon: "group", label: t("company.totalReps"), value: stats?.total_reps, accent: "bg-primary-container/30 text-primary", route: "/Company/Dashboard/Reps" },
    { icon: "link", label: t("company.totalAssignments"), value: stats?.total_assignments, accent: "bg-violet-100 text-violet-600", route: "/Company/Dashboard/Assignments" },
    { icon: "calendar_month", label: t("company.totalSchedules"), value: stats?.total_schedules, accent: "bg-amber-100 text-amber-600", route: "/Company/Dashboard/Schedules" },
    { icon: "check_circle", label: t("company.completedVisits"), value: stats?.completed_visits, accent: "bg-emerald-100 text-emerald-600", route: "/Company/Dashboard/Visits" },
    { icon: "verified", label: t("company.verifiedVisits"), value: stats?.verified_visits, accent: "bg-teal-100 text-teal-600", route: "/Company/Dashboard/Visits" },
    { icon: "gpp_bad", label: t("company.failedVisits"), value: stats?.failed_visits, accent: "bg-rose-100 text-rose-600", route: "/Company/Dashboard/Visits" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-secondary/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                {company?.commercial_name || t("company.dashboard")}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              {greeting} {user?.f_name}
            </h1>
            <p className="text-sm text-on-surface-variant/70 mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card, i) => (
                <StatCard
                  key={card.label}
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
                  accent={card.accent}
                  delay={i * 60}
                  onClick={() => navigate(card.route)}
                />
              ))
          }

          {/* Adherence Rate Card */}
          {loading ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-surface-container-high animate-pulse" />
                <div className="h-3 w-24 bg-surface-container-high rounded animate-pulse" />
              </div>
              <div className="w-16 h-16 rounded-full bg-surface-container-high animate-pulse" />
            </div>
          ) : (
            <div
              className="group relative bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer overflow-hidden"
              onClick={() => navigate("/Company/Dashboard/Visits")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">donut_large</span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t("company.adherenceRate")}</p>
                </div>
                <div className="flex items-center gap-4">
                  <AdherenceRing rate={stats?.adherence_rate} />
                  <div>
                    <p className="text-2xl font-extrabold text-on-surface">{stats?.adherence_rate ?? 0}%</p>
                    <p className="text-[11px] text-on-surface-variant">{t("company.adherenceRate")}</p>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined absolute top-4 right-4 text-on-surface-variant/20 text-lg group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                arrow_forward
              </span>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
