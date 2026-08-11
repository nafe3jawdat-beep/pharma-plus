import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { reportsApi } from "../../services/pharmacist";

const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const PRESETS = [7, 30, 90];

const TOP_MEDS_LIMITS = [5, 10];
const DEMAND_LIMITS = [5, 10, 25, 50];
const RADIUS_OPTIONS = [5, 10, 25, 50, 100];
const GROUP_BY_OPTIONS = ["product", "ingredient", "region"];

const TABS = [
  { key: "overview", labelKey: "tabOverview", icon: "monitoring" },
  { key: "medications", labelKey: "tabMedications", icon: "pill" },
  { key: "inventory", labelKey: "tabInventory", icon: "inventory_2" },
  { key: "staff", labelKey: "tabStaff", icon: "group" },
  { key: "ai", labelKey: "tabAiInsights", icon: "auto_awesome" },
];

const fmtMoney = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (v) => (v == null ? "-" : `${(Number(v) * 100).toFixed(1)}%`);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString() : "-";

const selectCls =
  "bg-surface-container/50 border border-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all";

function SectionCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`bg-surface-container-lowest rounded-2xl border border-surface-container-high ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-surface-container-high">
        <div>
          <h2 className="font-bold text-on-surface">{title}</h2>
          {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function StatCard({ label, value, icon, tone = "default" }) {
  const tones = {
    default: { icon: "bg-surface-container/70 text-on-surface-variant", value: "text-on-surface" },
    green: { icon: "bg-emerald-50 text-emerald-600", value: "text-emerald-600" },
    red: { icon: "bg-rose-50 text-rose-500", value: "text-rose-500" },
    orange: { icon: "bg-amber-50 text-amber-500", value: "text-amber-500" },
  }[tone];
  return (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`w-9 h-9 rounded-xl ${tones.icon} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant text-right">{label}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight tabular-nums ${tones.value}`}>{value}</p>
    </div>
  );
}

function SectionError({ onRetry, t }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="material-symbols-outlined text-3xl text-rose-400 mb-2">error</span>
      <p className="text-sm text-on-surface-variant font-medium mb-3">{t("finance.error")}</p>
      <button onClick={onRetry} className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container transition-all">
        {t("finance.retry")}
      </button>
    </div>
  );
}

function SectionEmpty({ icon, message, t, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-container/60 flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">{icon}</span>
      </div>
      <p className="text-sm text-on-surface-variant font-medium max-w-sm">{message || t("finance.noData")}</p>
      {children}
    </div>
  );
}

function SectionLoading({ t }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-sm text-on-surface-variant">{t("finance.loading")}</span>
    </div>
  );
}

function Th({ children, align = "start" }) {
  return (
    <th className={`px-5 py-3.5 text-${align} text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant whitespace-nowrap`}>
      {children}
    </th>
  );
}

function Td({ children, align = "start", className = "" }) {
  return (
    <td className={`px-5 py-4 text-${align} ${className}`}>{children}</td>
  );
}

function DataTable({ headers, rows, t }) {
  if (!rows || rows.length === 0) return <SectionEmpty icon="table_rows" message={t("finance.noData")} t={t} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container/60 border-b border-surface-container-high">
            {headers.map((h, i) => <Th key={i} align={h.align || "start"}>{h.label}</Th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-high">
          {rows.map((r, i) => (
            <tr key={r.key ?? i} className="hover:bg-surface-container/30 transition-colors">
              {r.cells.map((c, j) => <Td key={j} align={(headers[j] || {}).align || "start"} className={c.className || ""}>{c.content}</Td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FinancePage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const pharmacyId = selectedPharmacy?.id;

  const today = new Date();
  const initStart = toDateStr(new Date(today.getTime() - 29 * 86400000));
  const initEnd = toDateStr(today);

  const [activeTab, setActiveTab] = useState("overview");
  const [startDate, setStartDate] = useState(initStart);
  const [endDate, setEndDate] = useState(initEnd);
  const [preset, setPreset] = useState(30);
  const [filters, setFilters] = useState({
    start_date: `${initStart}T00:00:00Z`,
    end_date: `${initEnd}T23:59:59Z`,
    days: 30,
    topMedsLimit: 5,
    groupBy: "product",
    radius: 25,
    demandLimit: 10,
  });
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const [topMeds, setTopMeds] = useState(null);
  const [topMedsLoading, setTopMedsLoading] = useState(false);
  const [topMedsError, setTopMedsError] = useState(false);

  const [ai, setAi] = useState({ status: "idle", data: null, loading: false });

  const fetchAll = useCallback(async () => {
    if (!pharmacyId) return;
    setLoading(true);
    const requests = [
      ["summary", reportsApi.financialSummary(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["demand", reportsApi.demand(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date, radius: filters.radius, group_by: filters.groupBy, limit: filters.demandLimit })],
      ["expiring", reportsApi.expiringInventory(pharmacyId, { days: filters.days })],
      ["slowMoving", reportsApi.slowMoving(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["staff", reportsApi.staffPerformance(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
    ];
    const results = await Promise.allSettled(requests.map(([, p]) => p));
    const nextData = {};
    const nextErrors = {};
    results.forEach((r, i) => {
      const key = requests[i][0];
      if (r.status === "fulfilled") {
        nextData[key] = r.value?.data ?? null;
        nextErrors[key] = false;
      } else {
        nextData[key] = null;
        nextErrors[key] = true;
      }
    });
    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  }, [pharmacyId, filters]);

  const loadTopMeds = useCallback(async (limit = filters.topMedsLimit) => {
    if (!pharmacyId) return;
    setTopMedsLoading(true);
    setTopMedsError(false);
    try {
      const res = await reportsApi.topMedications(pharmacyId, {
        start_date: filters.start_date,
        end_date: filters.end_date,
        limit,
      });
      setTopMeds(res?.data ?? []);
    } catch {
      setTopMeds([]);
      setTopMedsError(true);
    } finally {
      setTopMedsLoading(false);
    }
  }, [pharmacyId, filters.start_date, filters.end_date, filters.topMedsLimit]);

  const fetchAiReport = useCallback(async () => {
    if (!pharmacyId) return;
    setAi((p) => ({ ...p, loading: true }));
    try {
      const res = await reportsApi.aiInsights(pharmacyId);
      const report = res?.data ?? null;
      if (report?.status === "completed") {
        setAi({ status: "ready", data: report, loading: false });
      } else if (report) {
        setAi({ status: "pending", data: report, loading: false });
      } else {
        setAi({ status: "idle", data: null, loading: false });
      }
    } catch {
      setAi({ status: "error", data: null, loading: false });
    }
  }, [pharmacyId]);

  const generateAiReport = useCallback(async () => {
    if (!pharmacyId) return;
    setAi({ status: "loading", data: null, loading: true });
    try {
      await reportsApi.generateAiInsights(pharmacyId, {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    } catch {
      setAi({ status: "error", data: null, loading: false });
      return;
    }
    await fetchAiReport();
  }, [pharmacyId, filters.start_date, filters.end_date, fetchAiReport]);

  useEffect(() => { fetchAll(); /* eslint-disable-line react-hooks/set-state-in-effect */ }, [fetchAll]);

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 86400000);
    const s = toDateStr(start);
    const e = toDateStr(end);
    setStartDate(s);
    setEndDate(e);
    setPreset(days);
    setTopMeds(null);
    setAi({ status: "idle", data: null, loading: false });
    setFilters((f) => ({ ...f, start_date: `${s}T00:00:00Z`, end_date: `${e}T23:59:59Z` }));
  };

  const applyRange = () => {
    setTopMeds(null);
    setAi({ status: "idle", data: null, loading: false });
    setFilters((f) => ({ ...f, start_date: `${startDate}T00:00:00Z`, end_date: `${endDate}T23:59:59Z` }));
  };

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const summary = data.summary;
  const summaryError = errors.summary;
  const demand = data.demand ?? [];
  const demandError = errors.demand;
  const expiring = data.expiring;
  const expiringError = errors.expiring;
  const slowMoving = data.slowMoving ?? [];
  const slowMovingError = errors.slowMoving;
  const staff = data.staff ?? [];
  const staffError = errors.staff;

  const breakdownData = Object.entries(summary?.expense_breakdown ?? {}).map(([k, v]) => ({
    name: t(`finance.expense_${k}`, { defaultValue: k }),
    value: Number(v ?? 0),
  }));

  const operationalLosses = Object.entries(summary?.operational_losses ?? {}).map(([k, v]) => ({
    name: t(`finance.loss_${k}`, { defaultValue: k }),
    value: Number(v ?? 0),
  }));

  const totalOperationalLosses = operationalLosses.reduce((a, b) => a + b.value, 0);

  const topMedsRows = (topMeds ?? []).map((m, i) => ({
    key: `${m.medication_id}-${i}`,
    cells: [
      { content: <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface-variant">{m.rank}</span> },
      { content: <span className="font-bold text-on-surface">{m.medication_name}</span> },
      { content: <span className="tabular-nums">{Number(m.total_quantity_sold).toLocaleString()}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(m.unit_price)}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(m.unit_cost)}</span>, align: "end" },
      { content: <span className="font-bold text-emerald-600 tabular-nums">{fmtMoney(m.net_profit)}</span>, align: "end" },
    ],
  }));

  const demandRows = demand.map((d, i) => ({
    key: `${d.group_key}-${d.group_type}-${i}`,
    cells: [
      { content: <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface-variant">{d.rank}</span> },
      { content: <span className="font-bold text-on-surface">{d.group_key}</span> },
      { content: <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-container/40 text-primary capitalize">{t(`finance.${d.group_type}`)}</span> },
      { content: <span className="tabular-nums">{Number(d.search_count).toLocaleString()}</span>, align: "end" },
      { content: <span className="tabular-nums">{d.radius_km}</span>, align: "end" },
    ],
  }));

  const expiredRows = (expiring?.expired_batches ?? []).map((b, i) => ({
    key: `${b.batch_id}-expired-${i}`,
    cells: [
      { content: <span className="font-mono text-xs text-on-surface-variant">{b.batch_id}</span> },
      { content: <span className="font-bold text-on-surface">{b.medication_name}</span> },
      { content: <span className="tabular-nums">{fmtDate(b.expiration_date)}</span>, align: "end" },
      { content: <span className="tabular-nums">{Number(b.quantity).toLocaleString()}</span>, align: "end" },
      { content: <span className="font-bold text-rose-500 tabular-nums">{fmtMoney(b.loss_value)}</span>, align: "end" },
    ],
  }));

  const nearingRows = (expiring?.nearing_expiry_batches ?? []).map((b, i) => ({
    key: `${b.batch_id}-nearing-${i}`,
    cells: [
      { content: <span className="font-mono text-xs text-on-surface-variant">{b.batch_id}</span> },
      { content: <span className="font-bold text-on-surface">{b.medication_name}</span> },
      { content: <span className="tabular-nums">{fmtDate(b.expiration_date)}</span>, align: "end" },
      { content: (
        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums ${b.days_until_expiry <= 15 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
          {b.days_until_expiry} {t("finance.days")}
        </span>
      ), align: "end" },
      { content: <span className="tabular-nums">{Number(b.quantity).toLocaleString()}</span>, align: "end" },
      { content: <span className="font-bold text-on-surface tabular-nums">{fmtMoney(b.stock_value)}</span>, align: "end" },
    ],
  }));

  const slowMovingRows = slowMoving.map((it, i) => ({
    key: `${it.inventory_item_id}-${i}`,
    cells: [
      { content: <span className="font-mono text-xs text-on-surface-variant">{it.inventory_item_id}</span> },
      { content: <span className="font-bold text-on-surface">{it.medication_name}</span> },
      { content: <span className="font-mono text-xs text-on-surface-variant">{it.batch_id || "-"}</span> },
      { content: <span className="tabular-nums">{Number(it.stock_quantity).toLocaleString()}</span>, align: "end" },
      { content: <span className="tabular-nums">{it.last_sale_date ? fmtDate(it.last_sale_date) : <span className="text-rose-500 font-semibold">{t("finance.neverSold")}</span>}</span>, align: "end" },
      { content: <span className="tabular-nums">{it.days_without_sale != null ? `${it.days_without_sale} ${t("finance.days")}` : "-"}</span>, align: "end" },
      { content: <span className="font-bold text-on-surface tabular-nums">{fmtMoney(it.stock_value)}</span>, align: "end" },
    ],
  }));

  const staffRows = staff.map((p, i) => ({
    key: `${p.pharmacist_id}-${i}`,
    cells: [
      { content: <span className="font-bold text-on-surface">{p.pharmacist_name}</span> },
      { content: <span className="tabular-nums">{Number(p.total_orders_handled).toLocaleString()}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(p.total_sales_volume)}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(p.average_order_value)}</span>, align: "end" },
      { content: <span className="tabular-nums">{Number(p.returns_count).toLocaleString()}</span>, align: "end" },
      { content: <span className="font-bold text-on-surface tabular-nums">{fmtPct(p.return_rate)}</span>, align: "end" },
    ],
  }));

  const insights = ai.data?.ai_insights ?? {};
  const keyFindings = Array.isArray(insights.key_findings) ? insights.key_findings : [];
  const recommendations = Array.isArray(insights.actionable_recommendations) ? insights.actionable_recommendations : [];
  const riskAlerts = Array.isArray(insights.inventory_risk_alerts) ? insights.inventory_risk_alerts : [];

  return (
    <main className="relative p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-md shadow-primary/15">
              <span className="material-symbols-outlined text-on-primary text-lg">savings</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t("finance.title")}</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">{t("finance.subtitle")}</p>
            </div>
          </div>
        </header>

        {/* Filter bar */}
        <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-4 sm:p-5 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.05em] uppercase text-on-surface-variant font-bold ml-1">{t("finance.period")}</label>
            <div className="flex gap-1.5">
              {PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => applyPreset(d)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${preset === d ? "bg-primary text-on-primary shadow-md" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"}`}
                >
                  {t(`finance.last${d}Days`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.05em] uppercase text-on-surface-variant font-bold ml-1">{t("finance.startDate")}</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPreset(null); }} className={selectCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.05em] uppercase text-on-surface-variant font-bold ml-1">{t("finance.endDate")}</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPreset(null); }} className={selectCls} />
          </div>
          <button
            onClick={applyRange}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            {t("finance.apply")}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-surface-container/60 rounded-2xl w-fit max-w-full">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  active ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Active tab content */}
        <div key={activeTab} className="space-y-6 animate-fade-in">
          {/*__TAB_CONTENT__*/}
        </div>
      </div>
    </main>
  );
}
