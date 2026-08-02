import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { useOutletContext } from 'react-router-dom';
import toast from "react-hot-toast";
import { requestsApi } from '../services/pharmacist';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const STATUS_CHIPS = [
  { value: '', labelKey: 'orders.all' },
  { value: 'pending', labelKey: 'orders.status.pending' },
  { value: 'confirmed', labelKey: 'orders.status.confirmed' },
  { value: 'ready', labelKey: 'orders.status.ready' },
  { value: 'processing', labelKey: 'orders.status.processing' },
  { value: 'completed', labelKey: 'orders.status.completed' },
  { value: 'cancelled', labelKey: 'orders.status.cancelled' },
];

const SOURCE_OPTIONS = [
  { value: '', labelKey: 'orders.all' },
  { value: 'app', labelKey: 'orders.source.app' },
  { value: 'POS', labelKey: 'orders.source.pos' },
];

const TYPE_OPTIONS = [
  { value: '', labelKey: 'orders.all' },
  { value: 'sale', labelKey: 'orders.type.sale' },
  { value: 'damaged', labelKey: 'orders.type.damaged' },
  { value: 'purchase', labelKey: 'orders.type.purchase' },
  { value: 'supplier_return', labelKey: 'orders.type.supplierReturn' },
  { value: 'customer_return', labelKey: 'orders.type.customerReturn' },
  { value: 'damage_reversal', labelKey: 'orders.type.damageReversal' },
];

const STATUS_STYLE = {
  pending: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  confirmed: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  ready: { badge: "bg-purple-50 text-purple-700 ring-purple-200", dot: "bg-purple-500" },
  processing: { badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  completed: { badge: "bg-green-50 text-green-700 ring-green-200", dot: "bg-green-500" },
  cancelled: { badge: "bg-surface-container-high text-on-surface-variant ring-surface-container-high", dot: "bg-on-surface-variant/40" },
};

const CHIP_DOT = {
  pending: "bg-amber-500",
  confirmed: "bg-indigo-500",
  ready: "bg-purple-500",
  processing: "bg-sky-500",
  completed: "bg-green-500",
  cancelled: "bg-on-surface-variant/50",
};

const TYPE_BADGE = {
  sale: "bg-primary-container/60 text-primary-dim",
  damaged: "bg-amber-100 text-amber-700",
  purchase: "bg-blue-100 text-blue-700",
  supplier_return: "bg-purple-100 text-purple-700",
  customer_return: "bg-rose-100 text-rose-700",
  damage_reversal: "bg-slate-200 text-slate-700",
};

const TYPE_ICON = {
  sale: "shopping_bag",
  damaged: "report",
  purchase: "local_shipping",
  supplier_return: "keyboard_return",
  customer_return: "assignment_return",
  damage_reversal: "undo",
};

const SOURCE_ICON = { app: "smartphone", POS: "point_of_sale" };

const initialFilters = {
  status: '',
  source: '',
  type: '',
  invoice_number: '',
  is_returned: '',
  min_price: '',
  max_price: '',
  min_cost: '',
  max_cost: '',
  date_from: '',
  date_to: '',
};

const inputClass = "w-full bg-surface-container/50 text-on-surface px-3 py-2 rounded-xl border border-surface-container-high text-sm focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all";
const labelClass = "text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1.5 block";

function StarRating({ rating }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-sm ${i <= rating ? 'text-amber-400' : 'text-on-surface-variant/30'}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >star</span>
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status] || { badge: "bg-surface-container-high text-on-surface-variant ring-surface-container-high", dot: "bg-on-surface-variant/40" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {t(`orders.status.${status}`, status)}
    </span>
  );
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isSupplierOrder(type) {
  return type === "purchase" || type === "supplier_return";
}

function DetailBlock({ label, children }) {
  return (
    <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5">
      <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{label}</p>
      <div className="text-sm text-on-surface">{children}</div>
    </div>
  );
}

export default function OrdersPage() {
  const { selectedPharmacy, orderVersion } = useOutletContext();
  const { t } = useTranslation();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const { isOnline } = useNetworkStatus();

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);

  const reviewsByOrderId = Object.fromEntries(
    reviews.filter((r) => r.order_id).map((r) => [r.order_id, r])
  );

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  const activeOrder = orders.find((o) => o.order_id === activeId) || null;

  const fetchOrders = useCallback(async () => {
    if (!selectedPharmacy?.id) return;

    const params = { page };
    if (filters.status) params.status = filters.status;
    if (filters.source) params.source = filters.source;
    if (filters.type) params.type = filters.type;
    if (filters.invoice_number) params.invoice_number = filters.invoice_number;
    if (filters.is_returned) params.is_returned = filters.is_returned;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.min_cost) params.min_cost = filters.min_cost;
    if (filters.max_cost) params.max_cost = filters.max_cost;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    const data = await requestsApi.getAll(selectedPharmacy.id, params);
    setOrders(data?.data ?? []);
    setTotal(data?.meta?.total ?? data?.data?.length ?? 0);
  }, [selectedPharmacy, filters, page]);

  const fetchReviews = useCallback(async () => {
    if (!selectedPharmacy?.id) return;

    const data = await requestsApi.getReviews(selectedPharmacy.id);
    setReviews(data?.data ?? []);
    setAverageRating(data?.meta?.average_rating ?? null);
  }, [selectedPharmacy]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);

    if (!selectedPharmacy?.id) {
      setLoading(false);
      return;
    }

    Promise.all([fetchOrders(), fetchReviews()])
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [fetchOrders, fetchReviews, selectedPharmacy?.id, orderVersion]);

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  const updateDraft = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const commitStatus = (value) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPage(1);
  };

  const toggleFilters = () => {
    if (!filtersOpen) setDraftFilters({ ...filters });
    setFiltersOpen((prev) => !prev);
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm(t("orders.confirmCancel"))) return;

    setCancelling(orderId);
    try {
      await requestsApi.updateStatus(selectedPharmacy.id, orderId, "cancelled");
      toast.success(t("orders.cancelled"));
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || t("orders.cancelFailed"));
    } finally {
      setCancelling(null);
    }
  };

  const q = search.trim().toLowerCase();
  const visibleOrders = q
    ? orders.filter((o) =>
        [o.invoice_number, o.patient_name, o.supplier_name, o.pharmacist_name, o.notes, o.pharmacist_note]
          .some((v) => v && String(v).toLowerCase().includes(q))
      )
    : orders;

  const stats = [
    { key: "total", label: t("orders.statTotal"), value: String(total), icon: "receipt_long", iconClass: "bg-primary-container/60 text-primary-dim" },
    { key: "pending", label: t("orders.statPending"), value: String(orders.filter((o) => o.status === "pending").length), icon: "hourglass_top", iconClass: "bg-amber-100 text-amber-700" },
    { key: "revenue", label: t("orders.statRevenue"), value: formatCurrency(orders.filter((o) => o.type === "sale" && o.status !== "cancelled").reduce((s, o) => s + Number(o.total_price || 0), 0)), icon: "payments", iconClass: "bg-green-100 text-green-700" },
    { key: "rating", label: t("orders.averageRating"), value: averageRating ? Number(averageRating).toFixed(1) : "—", icon: "star", iconClass: "bg-purple-100 text-purple-700" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{t("orders.title")}</h1>
            <p className="text-base text-on-surface-variant">{t("orders.description")}</p>
          </div>
          <div className="flex items-center gap-2.5">
            {averageRating && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold ring-1 ring-inset ring-amber-200">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {Number(averageRating).toFixed(1)} · {t("orders.averageRating")}
              </span>
            )}
            <button
              onClick={() => fetchOrders()}
              title="Refresh"
              className="w-10 h-10 rounded-full bg-surface-container-lowest border border-surface-container-high text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.key} className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-4 flex items-center gap-3.5 shadow-ambient-sm">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${stat.iconClass}`}>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              </span>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold truncate">{stat.label}</p>
                <p className="text-2xl font-extrabold tabular-nums truncate">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 lg:max-w-md">
              <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("orders.searchPlaceholder")}
                className="w-full bg-surface-container-lowest text-on-surface ps-10 pe-9 py-2.5 rounded-xl border border-surface-container-high focus:ring-2 focus:ring-primary outline-none text-sm transition-all placeholder:text-on-surface-variant/60"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleFilters}
                className={`relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  filtersOpen || activeFilterCount > 0
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface-container-lowest text-on-surface border border-surface-container-high hover:border-primary/40 hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-sm">filter_alt</span>
                {t("orders.filters")}
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="px-3 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 transition-all">
                  {t("orders.clearAll")}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_CHIPS.map((chip) => {
              const active = filters.status === chip.value;
              const dot = CHIP_DOT[chip.value];
              return (
                <button
                  key={chip.value}
                  onClick={() => commitStatus(chip.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    active
                      ? "bg-primary text-white shadow-md"
                      : "bg-surface-container-lowest text-on-surface-variant border border-surface-container-high hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot} ${active ? "bg-white" : ""}`} />}
                  {t(chip.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {filtersOpen && (
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-ambient-sm border border-surface-container-high flex flex-col gap-4 animate-[fadeIn_0.2s_ease_both]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>{t("orders.filterStatus")}</label>
                <select value={draftFilters.status} onChange={(e) => updateDraft("status", e.target.value)} className={inputClass}>
                  {STATUS_CHIPS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterSource")}</label>
                <select value={draftFilters.source} onChange={(e) => updateDraft("source", e.target.value)} className={inputClass}>
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterType")}</label>
                <select value={draftFilters.type} onChange={(e) => updateDraft("type", e.target.value)} className={inputClass}>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterInvoice")}</label>
                <input type="text" value={draftFilters.invoice_number} onChange={(e) => updateDraft("invoice_number", e.target.value)} className={inputClass} placeholder={t("orders.filterInvoicePlaceholder")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>{t("orders.filterDateFrom")}</label>
                <input type="date" value={draftFilters.date_from} onChange={(e) => updateDraft("date_from", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterDateTo")}</label>
                <input type="date" value={draftFilters.date_to} onChange={(e) => updateDraft("date_to", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterReturned")}</label>
                <select value={draftFilters.is_returned} onChange={(e) => updateDraft("is_returned", e.target.value)} className={inputClass}>
                  <option value="">{t("orders.all")}</option>
                  <option value="1">{t("orders.yes")}</option>
                  <option value="0">{t("orders.no")}</option>
                </select>
              </div>
            </div>
            <div className="border-t border-surface-container-high pt-4">
              <p className={labelClass}>{t("orders.priceRange")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1 block">{t("orders.minPrice")}</label>
                  <input type="number" min="0" value={draftFilters.min_price} onChange={(e) => updateDraft("min_price", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1 block">{t("orders.maxPrice")}</label>
                  <input type="number" min="0" value={draftFilters.max_price} onChange={(e) => updateDraft("max_price", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1 block">{t("orders.minCost")}</label>
                  <input type="number" min="0" value={draftFilters.min_cost} onChange={(e) => updateDraft("min_cost", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1 block">{t("orders.maxCost")}</label>
                  <input type="number" min="0" value={draftFilters.max_cost} onChange={(e) => updateDraft("max_cost", e.target.value)} className={inputClass} placeholder="0" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={clearFilters} className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-sm font-bold transition-all">
                {t("orders.clearAll")}
              </button>
              <button onClick={applyFilters} className="px-5 py-2 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check</span>
                {t("orders.applyFilters")}
              </button>
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-ambient-sm overflow-hidden">
          {loading ? (
            <div className="p-6 flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : error && !isOnline ? (
            <div className="p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-50 mb-4">
                <span className="material-symbols-outlined text-amber-400 text-3xl">cloud_off</span>
              </div>
              <p className="text-on-surface font-semibold mb-1">{t("orders.loadError")}</p>
              <p className="text-on-surface-variant text-sm">{t("orders.offlineMessage")}</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center text-rose-600">{t("orders.loadError")}</div>
          ) : visibleOrders.length === 0 ? (
            <div className="p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-surface-container-high mb-4">
                <span className="material-symbols-outlined text-on-surface-variant/60 text-3xl">{q ? "search_off" : "receipt_long"}</span>
              </div>
              <p className="text-on-surface font-semibold">{q ? t("orders.noSearchResults") : t("orders.noOrders")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container-high text-[11px] uppercase tracking-widest text-on-surface-variant/60 font-bold">
                    <th className="px-4 py-3.5 text-start">{t("orders.date")}</th>
                    <th className="px-4 py-3.5 text-start">{t("orders.invoiceNumber")}</th>
                    <th className="px-4 py-3.5 text-start">{t("orders.patient")}</th>
                    <th className="px-4 py-3.5 text-start">{t("orders.supplier")}</th>
                    <th className="px-4 py-3.5 text-start">{t("orders.filterType")}</th>
                    <th className="px-4 py-3.5 text-start">{t("orders.filterSource")}</th>
                    <th className="px-4 py-3.5 text-end">{t("orders.items")}</th>
                    <th className="px-4 py-3.5 text-end">{t("orders.total")}</th>
                    <th className="px-4 py-3.5 text-start">{t("orders.statusLabel")}</th>
                    <th className="px-4 py-3.5 text-start">{t("orders.rating")}</th>
                    <th className="px-4 py-3.5 text-end">{t("orders.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {visibleOrders.map((order) => {
                    const review = reviewsByOrderId[order.order_id];
                    return (
                      <tr
                        key={order.order_id}
                        onClick={() => setActiveId(order.order_id)}
                        className={`cursor-pointer transition-colors hover:bg-surface-container-low/70 ${activeId === order.order_id ? "bg-surface-container-low" : ""}`}
                      >
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-mono font-semibold text-primary whitespace-nowrap">
                          {order.invoice_number || "—"}
                        </td>
                        <td className="px-4 py-3.5 font-medium">
                          {order.patient_name || (isSupplierOrder(order.type) ? "—" : order.pharmacist_name || "—")}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium whitespace-nowrap">
                          {order.supplier_name || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {order.type && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${TYPE_BADGE[order.type] || "bg-surface-container-high text-on-surface-variant"}`}>
                              <span className="material-symbols-outlined text-xs">{TYPE_ICON[order.type] || "category"}</span>
                              {t(`orders.type.${order.type}`, order.type)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {order.source && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-secondary-container/70 text-on-secondary-container">
                              <span className="material-symbols-outlined text-xs">{SOURCE_ICON[order.source] || "widgets"}</span>
                              {t(`orders.source.${order.source}`, order.source)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-end text-sm tabular-nums text-on-surface-variant">
                          {order.items_count ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-end text-sm font-extrabold tabular-nums whitespace-nowrap">
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          {review ? (
                            <span className="inline-flex items-center gap-2" title={review.comment || ""}>
                              <StarRating rating={review.rating} />
                              {review.comment && (
                                <span className="text-xs text-on-surface-variant truncate max-w-[140px] hidden xl:inline">
                                  "{review.comment}"
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant/40 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-end">
                          <span className="inline-flex items-center gap-2 justify-end">
                            {order.status === "pending" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancel(order.order_id); }}
                                disabled={cancelling === order.order_id}
                                className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 text-xs font-bold hover:bg-rose-100 transition-all"
                              >
                                {cancelling === order.order_id ? t("app.loading") : t("orders.cancel")}
                              </button>
                            )}
                            <span
                              className="material-symbols-outlined text-on-surface-variant/60 hover:text-primary transition-colors"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              chevron_right
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {activeOrder && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease_both]" onClick={() => setActiveId(null)} />
          <aside className="absolute inset-y-0 end-0 w-full max-w-md bg-surface-container-lowest shadow-2xl animate-[fadeIn_0.2s_ease_both] flex flex-col">
            <div className="flex items-start justify-between gap-4 p-5 border-b border-surface-container-high">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-lg font-extrabold tracking-tight truncate">{t("orders.orderDetails")}</h2>
                  <StatusBadge status={activeOrder.status} />
                </div>
                <p className="text-sm text-on-surface-variant font-mono truncate">{activeOrder.invoice_number || "—"}</p>
              </div>
              <button
                onClick={() => setActiveId(null)}
                className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailBlock label={t("orders.date")}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">calendar_today</span>
                    {formatDate(activeOrder.created_at)}
                  </span>
                </DetailBlock>
                <DetailBlock label={t("orders.filterSource")}>
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">{SOURCE_ICON[activeOrder.source] || "widgets"}</span>
                    {activeOrder.source ? t(`orders.source.${activeOrder.source}`, activeOrder.source) : "—"}
                  </span>
                </DetailBlock>
              </div>

              {(activeOrder.patient_name || activeOrder.pharmacist_name || activeOrder.supplier_name) && (
                <DetailBlock label={t("orders.customer")}>
                  <div className="flex flex-col gap-0.5">
                    {activeOrder.patient_name && <span className="font-medium">{activeOrder.patient_name}</span>}
                    {activeOrder.pharmacist_name && <span className="text-on-surface-variant">{activeOrder.pharmacist_name}</span>}
                    {activeOrder.supplier_name && <span className="text-on-surface-variant">{activeOrder.supplier_name}</span>}
                  </div>
                </DetailBlock>
              )}

              <DetailBlock label={t("orders.orderItems")}>
                {activeOrder.items?.length > 0 ? (
                  <div className="space-y-2">
                    {activeOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{item.trade_name}</span>
                        <span className="text-on-surface-variant tabular-nums whitespace-nowrap">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-on-surface-variant">{t("orders.noItems")}</span>
                )}
              </DetailBlock>

              {(activeOrder.notes || activeOrder.pharmacist_note) && (
                <DetailBlock label={t("orders.notes")}>
                  <p className="whitespace-pre-wrap">{activeOrder.notes || activeOrder.pharmacist_note}</p>
                </DetailBlock>
              )}

              {reviewsByOrderId[activeOrder.order_id] && (
                <DetailBlock label={t("orders.rating")}>
                  <div className="flex items-center gap-2.5">
                    <StarRating rating={reviewsByOrderId[activeOrder.order_id].rating} />
                    {reviewsByOrderId[activeOrder.order_id].comment && (
                      <span className="text-on-surface-variant text-sm">"{reviewsByOrderId[activeOrder.order_id].comment}"</span>
                    )}
                  </div>
                </DetailBlock>
              )}

              <div className="mt-auto rounded-xl bg-surface-container-low p-4 flex items-center justify-between">
                <p className="text-sm font-bold text-on-surface-variant">{t("orders.total")}</p>
                <p className="text-2xl font-extrabold tabular-nums">{formatCurrency(activeOrder.total_price)}</p>
              </div>
            </div>

            <div className="p-5 border-t border-surface-container-high">
              {activeOrder.status === "pending" ? (
                <button
                  onClick={() => { handleCancel(activeOrder.order_id); setActiveId(null); }}
                  disabled={cancelling === activeOrder.order_id}
                  className="w-full py-3 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 text-sm font-bold hover:bg-rose-100 transition-all disabled:opacity-60"
                >
                  {cancelling === activeOrder.order_id ? t("app.loading") : t("orders.cancel")}
                </button>
              ) : (
                <button
                  onClick={() => setActiveId(null)}
                  className="w-full py-3 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container-highest transition-all"
                >
                  {t("orders.close")}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
