import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../services/admin";
import StatCard from "./common/StatCard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [usersRes, pendingDocs, pendingPharms, pendingCompanies, proposalsRes] = await Promise.allSettled([
          adminApi.users.list(),
          adminApi.doctors.pendingVerifications(),
          adminApi.pharmacists.pendingVerifications(),
          adminApi.companies.pending(),
          adminApi.proposals.list({ status: "pending" }),
        ]);

        if (!mounted) return;

        const totalCount = usersRes.status === "fulfilled" ? (usersRes.value?.meta?.total ?? usersRes.value?.data?.length ?? 0) : 0;
        const pendingDoctors = pendingDocs.status === "fulfilled" ? (pendingDocs.value?.meta?.total ?? pendingDocs.value?.data?.length ?? 0) : 0;
        const pendingPharmacists = pendingPharms.status === "fulfilled" ? (pendingPharms.value?.meta?.total ?? pendingPharms.value?.data?.length ?? 0) : 0;
        const pendingCompaniesCount = pendingCompanies.status === "fulfilled" ? (pendingCompanies.value?.meta?.total ?? pendingCompanies.value?.data?.length ?? 0) : 0;
        const pendingProposals = proposalsRes.status === "fulfilled" ? (proposalsRes.value?.meta?.total ?? proposalsRes.value?.data?.length ?? 0) : 0;

        setStats({
          total_users: totalCount,
          pending_doctors: pendingDoctors,
          pending_pharmacists: pendingPharmacists,
          pending_companies: pendingCompaniesCount,
          pending_proposals: pendingProposals,
        });
      } catch {
        if (mounted) setStats({
          total_users: 0, pending_doctors: 0, pending_pharmacists: 0, pending_companies: 0, pending_proposals: 0,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const cards = [
    {
      icon: "people",
      label: "Total Users",
      value: stats?.total_users,
      accent: "bg-primary-container/30 text-primary",
      onClick: () => navigate("/Admin/Users"),
    },
    {
      icon: "stethoscope",
      label: "Pending Doctors",
      value: stats?.pending_doctors ?? 0,
      accent: "bg-amber-100 text-amber-600",
      onClick: () => navigate("/Admin/Doctors/Pending"),
    },
    {
      icon: "medication",
      label: "Pending Pharmacists",
      value: stats?.pending_pharmacists ?? 0,
      accent: "bg-blue-100 text-blue-600",
      onClick: () => navigate("/Admin/Pharmacists/Pending"),
    },
    {
      icon: "business",
      label: "Pending Companies",
      value: stats?.pending_companies ?? 0,
      accent: "bg-violet-100 text-violet-600",
      onClick: () => navigate("/Admin/Companies/Pending"),
    },
    {
      icon: "description",
      label: "Pending Proposals",
      value: stats?.pending_proposals ?? 0,
      accent: "bg-cyan-100 text-cyan-600",
      onClick: () => navigate("/Admin/Proposals"),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-secondary/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Admin overview</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            {getGreeting()}, <span className="text-primary">{user?.f_name || "Admin"}</span>
          </h1>
          <p className="text-sm text-on-surface-variant/70 mt-1">{formatDate()}</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : cards.map((s) => <StatCard key={s.label} {...s} />)
          }
        </div>
      </div>
    </div>
  );
}
