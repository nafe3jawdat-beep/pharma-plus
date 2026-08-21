import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { notificationApi } from "../services/pharmacist";
import { useNotificationCount } from "../contexts/NotificationContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

const typeConfig = {
  pharmacist_invitation: {
    icon: "person_add",
    color: "text-primary",
    ring: "ring-primary/20",
    dot: "bg-primary",
    bg: "bg-primary/10",
    gradient: "from-primary/8 to-transparent",
    labelKey: "notifications.typeInvitation",
  },
  join_request: {
    icon: "group",
    color: "text-primary",
    ring: "ring-primary/20",
    dot: "bg-primary",
    bg: "bg-primary/10",
    gradient: "from-primary/8 to-transparent",
    labelKey: "notifications.typeJoinRequest",
  },
  order_update: {
    icon: "receipt_long",
    color: "text-primary",
    ring: "ring-primary/20",
    dot: "bg-primary",
    bg: "bg-primary/10",
    gradient: "from-primary/8 to-transparent",
    labelKey: "notifications.typeOrder",
  },
  stock_alert: {
    icon: "inventory_2",
    color: "text-rose-500",
    ring: "ring-rose-200",
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    gradient: "from-rose-500/8 to-transparent",
    labelKey: "notifications.typeStockAlert",
  },
};

const fallback = {
  icon: "notifications",
  color: "text-on-surface-variant",
  ring: "ring-surface-container-high",
  dot: "bg-on-surface-variant/40",
  bg: "bg-surface-container-high",
  gradient: "from-primary/5 to-transparent",
  labelKey: "notifications.typeGeneric",
};

function timeAgo(dateStr, t, lng) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("notifications.justNow");
  if (mins < 60) return t("notifications.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("notifications.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days === 1) return t("notifications.yesterday");
  if (days < 7) return t("notifications.daysAgo", { count: days });
  return then.toLocaleDateString(lng, { day: "numeric", month: "short" });
}

function getDateGroup(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thenStart = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const diffDays = Math.round((todayStart - thenStart) / 86400000);
  if (diffDays < 1) return "Today";
  if (diffDays < 2) return "Yesterday";
  if (diffDays < 7) return "ThisWeek";
  return "Earlier";
}

const groupOrder = ["Today", "Yesterday", "ThisWeek", "Earlier"];

const ACTION_TOAST_KEY = {
  accept: "notifications.inviteAccepted",
  reject: "notifications.inviteRejected",
  acceptJoin: "notifications.joinAccepted",
  rejectJoin: "notifications.joinRejected",
};

function serverResolution(n) {
  const raw = n?.data?.status ?? n?.data?.invitation_status ?? n?.data?.request_status;
  const v = typeof raw === "string" ? raw.toLowerCase() : "";
  if (v === "accepted" || v === "approved") return "accepted";
  if (v === "rejected" || v === "declined") return "rejected";
  return null;
}

function ResolutionChip({ resolution, t }) {
  const accepted = resolution === "accepted";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
      accepted ? "bg-emerald-50 text-emerald-600" : "bg-surface-container-high text-on-surface-variant"
    }`}>
      <span className="material-symbols-outlined text-sm">{accepted ? "check_circle" : "cancel"}</span>
      {t(accepted ? "notifications.statusAccepted" : "notifications.statusRejected")}
    </span>
  );
}

const TABS = [
  { key: "all", icon: "notifications" },
  { key: "unread", icon: "mark_email_unread" },
  { key: "read", icon: "mark_email_read" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [processing, setProcessing] = useState(null);
  const [resolvedActions, setResolvedActions] = useState({});
  const [selectedNotification, setSelectedNotification] = useState(null);
  const { refresh } = useNotificationCount();
  const { t, i18n } = useTranslation();
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

  useEffect(() => { fetchNotifications(); /* eslint-disable-line react-hooks/set-state-in-effect */ }, [fetchNotifications]);

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
    return groupOrder.filter((g) => map[g]).map((g) => ({ key: g, items: map[g] }));
  }, [filtered]);

  const getResolution = useCallback(
    (n) => resolvedActions[n?.id] || serverResolution(n),
    [resolvedActions]
  );

  const handleAction = (action, id) => {
    setProcessing(id);
    const apiMap = {
      accept: notificationApi.acceptInvitation,
      reject: notificationApi.rejectInvitation,
      acceptJoin: notificationApi.acceptJoinRequest,
      rejectJoin: notificationApi.rejectJoinRequest,
    };
    apiMap[action](id)
      .then(() => {
        setResolvedActions((p) => ({ ...p, [id]: action.startsWith("accept") ? "accepted" : "rejected" }));
        toast.success(t(ACTION_TOAST_KEY[action]));
        fetchNotifications();
        refresh();
      })
      .catch(() => {
        toast.error(t("notifications.actionFailed"));
      })
      .finally(() => setProcessing(null));
  };

  const tabMeta = {
    all: { label: t("notifications.tabsAll"), count: notifications.length },
    unread: { label: t("notifications.tabsUnread"), count: unreadCount },
    read: { label: t("notifications.tabsRead"), count: notifications.length - unreadCount },
  };

  const emptyMeta = {
    all: { title: t("notifications.emptyTitle"), desc: t("notifications.emptyDescription") },
    unread: { title: t("notifications.emptyUnreadTitle"), desc: t("notifications.emptyUnreadDescription") },
    read: { title: t("notifications.emptyReadTitle"), desc: t("notifications.emptyReadDescription") },
  }[activeTab];

  return (
    <div className="h-full overflow-y-auto bg-surface antialiased">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dim p-6 shadow-ambient sm:p-8">
          <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -start-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" />
          <span className="pointer-events-none absolute -end-4 -top-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 text-6xl text-white/10">
            <span className="material-symbols-outlined">notifications</span>
          </span>

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-2xl text-on-primary">notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -end-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-dim px-1.5 text-[11px] font-extrabold text-white shadow-lg ring-2 ring-white/30">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-on-primary sm:text-3xl">{t("notifications.title")}</h1>
                <p className="mt-1 text-sm font-medium text-on-primary/80">{t("notifications.description")}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15">
                <span className="material-symbols-outlined text-lg text-on-primary/80">mark_email_unread</span>
                <span className="text-sm font-extrabold tabular-nums text-on-primary">{unreadCount}</span>
                <span className="text-xs font-semibold text-on-primary/70">{t("notifications.unreadLabel")}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15">
                <span className="material-symbols-outlined text-lg text-on-primary/80">notifications_active</span>
                <span className="text-sm font-extrabold tabular-nums text-on-primary">{notifications.length}</span>
                <span className="text-xs font-semibold text-on-primary/70">{t("notifications.totalLabel")}</span>
              </div>
              <button
                onClick={fetchNotifications}
                title={t("notifications.refresh")}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-on-primary ring-1 ring-white/25 transition-all hover:bg-white/25 active:scale-90"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {!loading && notifications.length > 0 && (
          <div className="mb-8 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-1.5 shadow-ambient-sm">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const meta = tabMeta[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    active
                      ? "bg-primary text-on-primary shadow-md"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {meta.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-extrabold tabular-nums ${
                    active ? "bg-on-primary/15 text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    {meta.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-start gap-3.5 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 sm:p-5">
                <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-surface-container-high" />
                <div className="flex-1 space-y-2.5 py-0.5">
                  <div className="h-4 w-1/3 rounded-lg bg-surface-container-high" />
                  <div className="h-3.5 w-4/5 rounded-lg bg-surface-container-high/70" />
                  <div className="h-3 w-1/4 rounded-lg bg-surface-container-high/50" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center rounded-3xl border border-surface-container-high bg-surface-container-lowest/60 px-6 py-16 text-center shadow-ambient-sm">
            <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-3xl ${!isOnline ? "bg-amber-50" : "bg-rose-50"}`}>
              <span className={`material-symbols-outlined text-4xl ${!isOnline ? "text-amber-400" : "text-rose-400"}`}>cloud_off</span>
            </div>
            <p className="text-lg font-bold text-on-surface">{!isOnline ? t("notifications.offlineTitle") : t("notifications.loadFailedTitle")}</p>
            <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">
              {!isOnline ? t("notifications.offlineDescription") : error}
            </p>
            {isOnline && (
              <button
                onClick={fetchNotifications}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                {t("notifications.retry")}
              </button>
            )}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-surface-container-high bg-surface-container-lowest/50 px-6 py-16 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <span className="material-symbols-outlined text-4xl text-primary/40">{activeTab === "unread" ? "done_all" : "notifications_off"}</span>
            </div>
            <p className="text-lg font-bold text-on-surface">{emptyMeta.title}</p>
            <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">{emptyMeta.desc}</p>
          </div>
        )}

        {/* Grouped List */}
        {!loading && !error && grouped.length > 0 && (
          <div className="space-y-7">
            {grouped.map((group) => (
              <div key={group.key}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {t(`notifications.group${group.key}`)}
                  </span>
                  <div className="h-px flex-1 bg-surface-container-high" />
                  <span className="text-[11px] font-bold tabular-nums text-on-surface-variant/50">{group.items.length}</span>
                </div>

                <div className="space-y-3">
                  {group.items.map((n) => {
                    const isUnread = !n.read_at;
                    const cfg = typeConfig[n.type] || fallback;
                    const isProcessing = processing === n.id;
                    const resolution = getResolution(n);

                    return (
                      <div
                        key={n.id}
                        onClick={() => setSelectedNotification(n)}
                        className={`group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ${
                          isUnread
                            ? "border border-primary/15 bg-surface-container-lowest shadow-ambient-sm hover:-translate-y-0.5 hover:shadow-ambient"
                            : "border border-transparent bg-surface-container-lowest/50 hover:border-surface-container-high/60"
                        }`}
                      >
                        {isUnread && <div className="absolute inset-y-0 start-0 w-1 bg-primary" />}
                        {isUnread && <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />}

                        <div className="relative flex items-start gap-3.5 p-4 sm:p-5">
                          <div className="relative flex-shrink-0">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${
                              isUnread ? "bg-primary/10 shadow-sm ring-2 ring-primary/15" : "bg-surface-container-high"
                            }`}>
                              <span className={`material-symbols-outlined text-[20px] ${isUnread ? "text-primary" : "text-on-surface-variant/40"}`}>
                                {cfg.icon}
                              </span>
                            </div>
                            {isUnread && (
                              <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white">
                                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-40" />
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className={`text-sm leading-tight ${isUnread ? "font-bold text-on-surface" : "font-semibold text-on-surface/70"}`}>
                                    {n.title || t(cfg.labelKey)}
                                  </h3>
                                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isUnread ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant/50"
                                  }`}>
                                    {t(cfg.labelKey)}
                                  </span>
                                </div>
                                <p className={`mt-1.5 text-[13px] leading-relaxed ${isUnread ? "text-on-surface/70" : "text-on-surface-variant/60"}`}>
                                  {n.message}
                                </p>
                              </div>
                              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                                <span className={`whitespace-nowrap text-[11px] ${isUnread ? "font-medium text-primary/60" : "text-on-surface-variant/30"}`}>
                                  {timeAgo(n.created_at, t, i18n.language)}
                                </span>
                                {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
                              </div>
                            </div>

                            {(n.type === "pharmacist_invitation" || n.type === "join_request") && resolution && (
                              <div className="mt-4">
                                <ResolutionChip resolution={resolution} t={t} />
                              </div>
                            )}

                            {(n.type === "pharmacist_invitation" || n.type === "join_request") && isUnread && !resolution && (
                              <div className="mt-4 flex items-center gap-2.5">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(n.type === "pharmacist_invitation" ? "accept" : "acceptJoin", n.id); }}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">check</span>
                                  {t("app.accept")}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(n.type === "pharmacist_invitation" ? "reject" : "rejectJoin", n.id); }}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-lowest px-4 py-2 text-xs font-bold text-on-surface-variant transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
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

      {/* Detail Modal */}
      {selectedNotification && (() => {
        const cfg = typeConfig[selectedNotification.type] || fallback;
        const data = selectedNotification.data;
        const dataEntries = data && typeof data === "object" ? Object.entries(data) : [];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedNotification(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-lg rounded-3xl bg-surface-container-lowest shadow-2xl border border-surface-container-high overflow-hidden animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-surface-container-high">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/15">
                    <span className="material-symbols-outlined text-xl text-primary">{cfg.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-on-surface">{t("notifications.detailsTitle")}</h2>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary`}>
                      {t(cfg.labelKey)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{selectedNotification.title || t(cfg.labelKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{selectedNotification.message}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </div>

                {dataEntries.length > 0 && (
                  <div className="rounded-2xl border border-surface-container-high overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr] text-xs">
                      {dataEntries.map(([key, val]) => (
                        <div key={key} contents>
                          <div className="px-4 py-2.5 font-bold text-on-surface-variant bg-primary/5 border-b border-surface-container-high capitalize">{key.replace(/_/g, " ")}</div>
                          <div className="px-4 py-2.5 text-on-surface border-b border-surface-container-high break-words">
                            {typeof val === "object" ? JSON.stringify(val, null, 2) : String(val ?? "—")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dataEntries.length === 0 && (
                  <p className="text-xs text-on-surface-variant/50 italic">{t("notifications.noAdditionalDetails")}</p>
                )}
              </div>

                {(selectedNotification.type === "pharmacist_invitation" || selectedNotification.type === "join_request") && getResolution(selectedNotification) && (
                  <div className="px-6 py-4 border-t border-surface-container-high">
                    <ResolutionChip resolution={getResolution(selectedNotification)} t={t} />
                  </div>
                )}

                {(selectedNotification.type === "pharmacist_invitation" || selectedNotification.type === "join_request") && !getResolution(selectedNotification) && (
                <div className="px-6 py-4 border-t border-surface-container-high flex items-center gap-3">
                  <button
                    onClick={() => {
                      handleAction(selectedNotification.type === "pharmacist_invitation" ? "accept" : "acceptJoin", selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    disabled={processing === selectedNotification.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    {t("app.accept")}
                  </button>
                  <button
                    onClick={() => {
                      handleAction(selectedNotification.type === "pharmacist_invitation" ? "reject" : "rejectJoin", selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    disabled={processing === selectedNotification.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-lowest px-5 py-2.5 text-sm font-bold text-on-surface-variant transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    {t("app.reject")}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
