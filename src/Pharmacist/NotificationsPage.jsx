import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { notificationApi } from "../services/pharmacist";
import { useNotificationCount } from "../contexts/NotificationContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

const typeConfig = {
  pharmacist_invitation: {
    icon: "person_add",
    color: "text-blue-600",
    ring: "ring-blue-100",
    dot: "bg-blue-500",
    gradient: "from-blue-500/5 to-transparent",
    label: "Invitation",
  },
  join_request: {
    icon: "group",
    color: "text-amber-600",
    ring: "ring-amber-100",
    dot: "bg-amber-500",
    gradient: "from-amber-500/5 to-transparent",
    label: "Join Request",
  },
  order_update: {
    icon: "receipt_long",
    color: "text-emerald-600",
    ring: "ring-emerald-100",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500/5 to-transparent",
    label: "Order",
  },
  stock_alert: {
    icon: "inventory_2",
    color: "text-rose-600",
    ring: "ring-rose-100",
    dot: "bg-rose-500",
    gradient: "from-rose-500/5 to-transparent",
    label: "Stock Alert",
  },
};

const fallback = { icon: "notifications", color: "text-gray-500", ring: "ring-gray-100", dot: "bg-gray-400", gradient: "from-gray-500/5 to-transparent", label: "Notification" };

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getDateGroup(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffDays = Math.floor((now - then) / 86400000);
  if (diffDays < 1 && now.getDate() === then.getDate()) return "Today";
  if (diffDays < 2 && now.getDate() - then.getDate() === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Earlier";
}

const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [processing, setProcessing] = useState(null);
  const { refresh } = useNotificationCount();
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    setError(null);
    notificationApi
      .fetchAll()
      .then((res) => setNotifications(res?.data ?? res ?? []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read_at).length, [notifications]);

  const filtered = useMemo(() => {
    if (activeTab === "unread") return notifications.filter((n) => !n.read_at);
    if (activeTab === "read") return notifications.filter((n) => n.read_at);
    return notifications;
  }, [notifications, activeTab]);

  const grouped = useMemo(() => {
    const map = {};
    for (const n of filtered) {
      const g = getDateGroup(n.created_at);
      if (!map[g]) map[g] = [];
      map[g].push(n);
    }
    return groupOrder.filter((g) => map[g]).map((g) => ({ label: g, items: map[g] }));
  }, [filtered]);

  const handleAction = (action, id) => {
    setProcessing(id);
    const apiMap = {
      accept: notificationApi.acceptInvitation,
      reject: notificationApi.rejectInvitation,
      acceptJoin: notificationApi.acceptJoinRequest,
      rejectJoin: notificationApi.rejectJoinRequest,
    };
    apiMap[action](id)
      .then(() => { fetchNotifications(); refresh(); })
      .catch(() => {})
      .finally(() => setProcessing(null));
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-surface to-surface-container-lowest font-['Manrope'] antialiased">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[22px]">notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shadow-lg shadow-primary/30">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">{t("notifications.title")}</h1>
                <p className="text-on-surface-variant text-sm mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {!loading && notifications.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-2xl mb-8 w-fit">
            {[
              { key: "all", label: "All", count: notifications.length },
              { key: "unread", label: "Unread", count: unreadCount },
              { key: "read", label: "Read", count: notifications.length - unreadCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 text-xs ${activeTab === tab.key ? "text-primary/70" : "text-on-surface-variant/40"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-white border border-surface-container-high p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-high" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-surface-container-high rounded-lg w-24" />
                      <div className="h-5 bg-surface-container-high rounded-full w-16" />
                    </div>
                    <div className="h-3.5 bg-surface-container-high rounded-lg w-4/5" />
                    <div className="h-3 bg-surface-container-high/60 rounded-lg w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 ${
              !isOnline ? 'bg-amber-50' : 'bg-red-50'
            }`}>
              <span className={`material-symbols-outlined text-3xl ${
                !isOnline ? 'text-amber-400' : 'text-red-400'
              }`}>{!isOnline ? 'cloud_off' : 'cloud_off'}</span>
            </div>
            <p className="text-on-surface font-semibold mb-1">
              {!isOnline ? "You're offline" : "Couldn't load notifications"}
            </p>
            <p className="text-on-surface-variant text-sm mb-5">
              {!isOnline
                ? "Notifications will appear when you reconnect."
                : error
              }</p>
            {isOnline && (
              <button
                onClick={fetchNotifications}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Retry
              </button>
            )}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-surface-container-high mb-4">
              <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl">
                {activeTab === "unread" ? "done_all" : "notifications_off"}
              </span>
            </div>
            <p className="text-on-surface font-semibold mb-1">
              {activeTab === "unread" ? "All caught up" : "No notifications"}
            </p>
            <p className="text-on-surface-variant text-sm">
              {activeTab === "unread"
                ? "You've read all your notifications."
                : activeTab === "read"
                ? "Read notifications will appear here."
                : "When you get notifications, they'll show up here."}
            </p>
          </div>
        )}

        {/* Grouped List */}
        {!loading && !error && grouped.length > 0 && (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/50">{group.label}</span>
                  <div className="flex-1 h-px bg-surface-container-high" />
                </div>

                <div className="space-y-2">
                  {group.items.map((n) => {
                    const isUnread = !n.read_at;
                    const cfg = typeConfig[n.type] || fallback;
                    const isProcessing = processing === n.id;

                    return (
                      <div
                        key={n.id}
                        className={`group relative rounded-2xl transition-all duration-300 overflow-hidden ${
                          isUnread
                            ? "bg-white border border-surface-container-high shadow-sm hover:shadow-md hover:border-surface-container-high/80"
                            : "bg-surface-container-lowest/60 border border-transparent hover:border-surface-container-high/40"
                        }`}
                      >
                        {/* Unread gradient overlay */}
                        {isUnread && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${cfg.gradient} pointer-events-none rounded-2xl`} />
                        )}

                        <div className="relative p-4 sm:p-5 flex items-start gap-3.5">
                          {/* Icon */}
                          <div className="relative flex-shrink-0">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isUnread ? `bg-white ring-2 ${cfg.ring} shadow-sm` : "bg-surface-container-high"
                            }`}>
                              <span className={`material-symbols-outlined text-[20px] ${isUnread ? cfg.color : "text-on-surface-variant/50"}`}>
                                {cfg.icon}
                              </span>
                            </div>
                            {isUnread && (
                              <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${cfg.dot} ring-2 ring-white`}>
                                <span className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-40`} />
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={`text-sm leading-tight ${isUnread ? "font-bold text-on-surface" : "font-semibold text-on-surface/70"}`}>
                                    {n.title || cfg.label}
                                  </h3>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isUnread ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant/50"}`}>
                                    {cfg.label}
                                  </span>
                                </div>
                                <p className={`text-[13px] mt-1.5 leading-relaxed ${isUnread ? "text-on-surface/70" : "text-on-surface-variant/60"}`}>
                                  {n.message}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <span className={`text-[11px] whitespace-nowrap ${isUnread ? "text-on-surface/40 font-medium" : "text-on-surface-variant/30"}`}>
                                  {timeAgo(n.created_at)}
                                </span>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            {n.type === "pharmacist_invitation" && isUnread && (
                              <div className="flex items-center gap-2.5 mt-4">
                                <button
                                  onClick={() => handleAction("accept", n.id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">check</span>
                                  {t("app.accept")}
                                </button>
                                <button
                                  onClick={() => handleAction("reject", n.id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:ring-1 hover:ring-rose-200 active:scale-[0.97] transition-all disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                  {t("app.reject")}
                                </button>
                              </div>
                            )}
                            {n.type === "join_request" && isUnread && (
                              <div className="flex items-center gap-2.5 mt-4">
                                <button
                                  onClick={() => handleAction("acceptJoin", n.id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">check</span>
                                  {t("app.accept")}
                                </button>
                                <button
                                  onClick={() => handleAction("rejectJoin", n.id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:ring-1 hover:ring-rose-200 active:scale-[0.97] transition-all disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                  {t("app.reject")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
