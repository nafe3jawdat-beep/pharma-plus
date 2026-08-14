import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { useOutletContext } from 'react-router-dom';
import toast from "react-hot-toast";
import { requestsApi } from '../services/pharmacist';
import { useSendGrace } from '../hooks/useSendGrace';

const STATUS_BADGE = {
  pending: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  ready: "bg-purple-100 text-purple-700",
  processing: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-surface-container-high text-on-surface-variant",
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
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-surface-container-high rounded-full" />
          <div className="h-6 w-16 bg-surface-container-high rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const { selectedPharmacy, orderVersion } = useOutletContext();
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!selectedPharmacy?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    requestsApi
      .getAll(selectedPharmacy.id)
      .then((data) => setPrescriptions(data?.data ?? []))
      .catch(() => { setPrescriptions([]); setError(true); })
      .finally(() => setLoading(false));
  }, [selectedPharmacy?.id, orderVersion]);

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const pending = prescriptions.filter((r) => r.status === "pending").length;
    const confirmed = prescriptions.filter((r) => r.status === "confirmed").length;
    const ready = prescriptions.filter((r) => r.status === "ready").length;
    return { total, pending, confirmed, ready };
  }, [prescriptions]);

  const filtered = useMemo(() => {
    let list = prescriptions;
    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.patient_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prescriptions, statusFilter, searchQuery]);

  const filterTabs = useMemo(() => {
    const counts = {};
    prescriptions.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return [
      { value: "", labelKey: "orders.all", label: "All", count: prescriptions.length },
      { value: "pending", labelKey: "orders.status.pending", label: "Pending", count: counts.pending || 0 },
      { value: "confirmed", labelKey: "orders.status.confirmed", label: "confirmed", count: counts.confirmed || 0 },
      { value: "ready", labelKey: "orders.status.ready", label: "Ready", count: counts.ready || 0 },
    ];
  }, [prescriptions]);

  const handleInitiate = async (orderId) => {
    setActionLoading(orderId);
    try {
      await requestsApi.updateStatus(selectedPharmacy.id, orderId, "confirmed");
      setPrescriptions((prev) =>
        prev.map((rx) =>
          rx.order_id === orderId ? { ...rx, status: "confirmed" } : rx
        )
      );
      toast.success(t("orders.status.confirmed", "confirmed"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate preparation");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmMarkReady = async (orderId) => {
    try {
      await requestsApi.updateStatus(selectedPharmacy.id, orderId, "ready");
      setPrescriptions((prev) =>
        prev.map((rx) =>
          rx.order_id === orderId ? { ...rx, status: "ready" } : rx
        )
      );
      toast.success(t("requests.ready", "Ready"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as ready");
    } finally {
      setActionLoading(null);
    }
  };

  const { begin } = useSendGrace({
    onConfirm: confirmMarkReady,
    onCancel: () => {
      setActionLoading(null);
      toast(t("sendGrace.cancelled"), { icon: "\u2716\uFE0F" });
    },
  });

  const handleMarkReady = async (orderId) => {
    setActionLoading(orderId);
    begin(orderId);
  };

  const handleReject = async (orderId) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    setActionLoading(orderId);
    try {
      await requestsApi.updateStatus(selectedPharmacy.id, orderId, "cancelled");
      setPrescriptions((prev) =>
        prev.map((rx) =>
          rx.order_id === orderId ? { ...rx, status: "cancelled" } : rx
        )
      );
      toast.success(t("orders.cancelled", "Cancelled"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleDetail = (orderId) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  const getInitials = (name) =>
    (name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">{t("requests.title")}</h1>
          <p className="text-base text-on-surface-variant">{t("requests.description")}</p>
        </div>

        {!loading && prescriptions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="inbox" label="Total" count={stats.total} color="text-primary" bg="bg-primary-container/30" />
            <StatCard icon="schedule" label="Pending" count={stats.pending} color="text-blue-700" bg="bg-blue-100" />
            <StatCard icon="manufacturing" label="In Preparation" count={stats.confirmed} color="text-amber-700" bg="bg-amber-100" />
            <StatCard icon="check_circle" label="Ready" count={stats.ready} color="text-purple-700" bg="bg-purple-100" />
          </div>
        )}

        {!loading && prescriptions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient or invoice..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {!loading && prescriptions.length > 0 && (
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
              <p className="text-rose-600 font-medium">Failed to load requests</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">description</span>
              <p className="text-on-surface-variant">{t("requests.noRequests")}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">search_off</span>
              <p className="text-on-surface-variant">No requests match your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container-high">
              {filtered.map((rx, idx) => {
                const isLoading = actionLoading === rx.order_id;
                return (
                  <div
                    key={rx.order_id}
                    className="animate-[fadeIn_0.3s_ease_both]"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="p-4 sm:p-6 flex flex-col gap-3 hover:bg-surface transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {getInitials(rx.patient_name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-on-surface truncate">{rx.patient_name}</p>
                            <p className="text-sm text-on-surface-variant mt-0.5">
                              {rx.items_count} item{rx.items_count !== 1 ? "s" : ""} · <span className="font-semibold text-on-surface">${rx.total_price}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${STATUS_BADGE[rx.status] || "bg-surface-container-high text-on-surface-variant"}`}>
                          {t(`orders.status.${rx.status}`, rx.status)}
                        </span>
                      </div>

                      {rx.items?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 ml-[52px]">
                          {rx.items.slice(0, 3).map((item, i) => (
                            <span key={i} className="px-2 py-0.5 bg-surface-container-low rounded-md text-xs text-on-surface-variant">
                              {item.trade_name} x{item.quantity}
                            </span>
                          ))}
                          {rx.items.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-on-surface-variant">
                              +{rx.items.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 ml-[52px] flex-wrap">
                        {rx.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleInitiate(rx.order_id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all whitespace-nowrap disabled:opacity-50"
                            >
                              {isLoading ? (
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-sm">playlist_add_check</span>
                              )}
                              {t("requests.initiatePreparation")}
                            </button>
                            <button
                              onClick={() => handleReject(rx.order_id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-xs font-bold transition-all whitespace-nowrap disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                              {t("app.reject")}
                            </button>
                          </>
                        )}
                        {rx.status === "confirmed" && (
                          <>
                            <button
                              onClick={() => handleMarkReady(rx.order_id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all whitespace-nowrap disabled:opacity-50"
                            >
                              {isLoading ? (
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                              )}
                              {t("requests.markAsReady")}
                            </button>
                            <button
                              onClick={() => handleReject(rx.order_id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-xs font-bold transition-all whitespace-nowrap disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                              {t("app.reject")}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => toggleDetail(rx.order_id)}
                          className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-xs font-bold text-on-surface-variant transition-all whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {expandedId === rx.order_id ? "expand_less" : "expand_more"}
                          </span>
                          {t("app.details")}
                        </button>
                      </div>

                      {expandedId === rx.order_id && rx.items?.length > 0 && (
                        <div className="ml-[52px] mt-2 p-3 bg-surface-container-low rounded-xl border border-surface-container-high animate-[fadeIn_0.2s_ease_both]">
                          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Items</p>
                          <div className="space-y-1.5">
                            {rx.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-on-surface">{item.trade_name}</span>
                                <span className="text-on-surface-variant">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
