import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { proposalsApi } from "../services/pharmacist";

const STATUS_BADGE = {
  pending: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-rose-100 text-rose-700",
};

function StatCard({ icon, label, count, color, bg }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-outlined ${color}`}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-xl font-extrabold text-on-surface">{count}</p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-surface-container-high rounded" />
          <div className="h-3 w-60 bg-surface-container-high rounded" />
        </div>
        <div className="h-6 w-16 bg-surface-container-high rounded-full" />
      </div>
    </div>
  );
}

export default function ProposalsPage() {
  const { t } = useTranslation();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    proposalsApi
      .list()
      .then((data) => setProposals(data?.data ?? []))
      .catch(() => { setProposals([]); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = proposals.length;
    const pending = proposals.filter((p) => p.status === "pending").length;
    const approved = proposals.filter((p) => p.status === "approved").length;
    const rejected = proposals.filter((p) => p.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [proposals]);

  const filtered = useMemo(() => {
    if (!statusFilter) return proposals;
    return proposals.filter((p) => p.status === statusFilter);
  }, [proposals, statusFilter]);

  const filterTabs = useMemo(() => {
    const counts = {};
    proposals.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return [
      { value: "", labelKey: "orders.all", label: "All", count: proposals.length },
      { value: "pending", labelKey: "proposals.status.pending", label: "Pending", count: counts.pending || 0 },
      { value: "approved", labelKey: "proposals.status.approved", label: "Approved", count: counts.approved || 0 },
      { value: "rejected", labelKey: "proposals.status.rejected", label: "Rejected", count: counts.rejected || 0 },
    ];
  }, [proposals]);

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">{t("proposals.title")}</h1>
          <p className="text-base text-on-surface-variant">{t("proposals.description")}</p>
        </div>

        {!loading && proposals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="inbox" label={t("proposals.total")} count={stats.total} color="text-primary" bg="bg-primary-container/30" />
            <StatCard icon="schedule" label={t("proposals.status.pending")} count={stats.pending} color="text-blue-700" bg="bg-blue-100" />
            <StatCard icon="check_circle" label={t("proposals.status.approved")} count={stats.approved} color="text-green-700" bg="bg-green-100" />
            <StatCard icon="cancel" label={t("proposals.status.rejected")} count={stats.rejected} color="text-rose-700" bg="bg-rose-100" />
          </div>
        )}

        {!loading && proposals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.value
                    ? "bg-primary text-white"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {t(tab.labelKey, tab.label)}
                {tab.count > 0 && (
                  <span className={`ml-1.5 ${statusFilter === tab.value ? "text-white/70" : "text-on-surface-variant/60"}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
          {loading ? (
            <div className="divide-y divide-surface-container-high">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-rose-500 mb-3">error</span>
              <p className="text-rose-600 font-medium">{t("proposals.loadError")}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
              >
                {t("app.tryAgain")}
              </button>
            </div>
          ) : proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-primary/60" style={{ fontVariationSettings: "'wght' 300" }}>rate_review</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{t("proposals.emptyTitle")}</h3>
              <p className="text-on-surface-variant/70 text-sm max-w-md text-center">
                {t("proposals.emptyHint")}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">search_off</span>
              <p className="text-on-surface-variant">{t("proposals.noMatch")}</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container-high">
              {filtered.map((proposal, idx) => (
                <div
                  key={proposal.id}
                  className="animate-[fadeIn_0.3s_ease_both]"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-4 sm:p-6 flex flex-col gap-3 hover:bg-surface transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-xl">medication</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-on-surface truncate">{proposal.medication_name || "—"}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {proposal.form && (
                              <span className="text-sm text-on-surface-variant">{proposal.form}</span>
                            )}
                            {proposal.created_at && (
                              <span className="text-xs text-on-surface-variant/50">
                                {new Date(proposal.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${STATUS_BADGE[proposal.status] || "bg-surface-container-high text-on-surface-variant"}`}>
                        {t(`proposals.status.${proposal.status}`, proposal.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 ml-[52px] flex-wrap">
                      <button
                        onClick={() => setExpandedId(prev => prev === proposal.id ? null : proposal.id)}
                        className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-xs font-bold text-on-surface-variant transition-all whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {expandedId === proposal.id ? "expand_less" : "expand_more"}
                        </span>
                        {t("app.details")}
                      </button>
                    </div>

                    {expandedId === proposal.id && (
                      <div className="ml-[52px] mt-2 p-4 bg-surface-container-low rounded-xl border border-surface-container-high animate-[fadeIn_0.2s_ease_both]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-0.5">{t("proposals.medicationName")}</p>
                            <p className="text-sm text-on-surface">{proposal.medication_name || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-0.5">{t("drugs.dosageForm")}</p>
                            <p className="text-sm text-on-surface">{proposal.form || "—"}</p>
                          </div>
                          {proposal.image_url && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1">{t("proposals.image")}</p>
                              <img src={proposal.image_url} alt={proposal.medication_name} className="h-24 rounded-lg object-cover border border-surface-container-high" />
                            </div>
                          )}
                          {proposal.status === "rejected" && proposal.rejection_reason && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] uppercase tracking-wider text-rose-500/80 font-bold mb-0.5">{t("proposals.rejectionReason")}</p>
                              <p className="text-sm text-on-surface">{proposal.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
