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

const fmtMoney = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (v) => (v == null ? "-" : `${(Number(v) * 100).toFixed(1)}%`);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString() : "-";

const selectCls =
  "bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all";

const STAT_TONES = {
  default: { chip: "bg-primary-container/30 text-primary", value: "text-on-surface" },
  green: { chip: "bg-emerald-100 text-emerald-600", value: "text-emerald-600" },
  red: { chip: "bg-rose-100 text-rose-500", value: "text-rose-500" },
  orange: { chip: "bg-amber-100 text-amber-500", value: "text-amber-500" },
};

function SectionCard({ icon, title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden shadow-ambient-sm ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-surface-container-high">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </div>
          )}
          <div>
            <h2 className="font-bold text-on-surface">{title}</h2>
            {subtitle && <p className="text-xs text-on-surface-variant/80 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function StatCard({ label, value, icon, tone = "default" }) {
  const s = STAT_TONES[tone] || STAT_TONES.default;
  return (
    <div className="group relative overflow-hidden bg-surface-container-lowest rounded-2xl border border-surface-container-high p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ambient-sm">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/[0.03] to-transparent`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${s.chip} flex items-center justify-center shadow-sm`}>
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">{label}</span>
        </div>
        <p className={`text-2xl font-extrabold tabular-nums tracking-tight ${s.value}`}>{value}</p>
      </div>
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

function SectionEmpty({ icon, message, t }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-container/60 flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">{icon}</span>
      </div>
      <p className="text-sm text-on-surface-variant font-medium max-w-sm">{message || t("finance.noData")}</p>
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
    setFilters((f) => ({ ...f, start_date: `${s}T00:00:00Z`, end_date: `${e}T23:59:59Z` }));
  };

  const applyRange = () => {
    setTopMeds(null);
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

  return (
    <main className="relative p-4 sm:p-6 md:p-8 space-y-6 animate-fade-in">
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/[0.03] to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">savings</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t("finance.title")}</h1>
              <p className="text-sm text-on-surface-variant/80 mt-0.5">{t("finance.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => loadTopMeds()}
            disabled={topMedsLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {topMedsLoading ? (
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">leaderboard</span>
            )}
            {topMedsLoading ? t("finance.loading") : t("finance.mostRequested")}
          </button>
        </header>

        {/* Filter bar */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-ambient-sm p-4 sm:p-5 flex flex-wrap items-end gap-4">
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

        {/* Financial summary */}
        <SectionCard icon="monitoring" title={t("finance.summary")} subtitle={summary?.period ? `${fmtDate(summary.period.start_date)} — ${fmtDate(summary.period.end_date)}` : undefined}>
          {summaryError ? (
            <SectionError onRetry={fetchAll} t={t} />
          ) : loading && !summary ? (
            <SectionLoading t={t} />
          ) : !summary ? (
            <SectionEmpty icon="monitoring" t={t} />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard label={t("finance.grossSales")} value={fmtMoney(summary.gross_sales)} icon="point_of_sale" />
                <StatCard label={t("finance.netRevenue")} value={fmtMoney(summary.net_revenue)} icon="payments" />
                <StatCard label={t("finance.cogs")} value={fmtMoney(summary.cogs)} icon="inventory_2" />
                <StatCard label={t("finance.grossProfit")} value={fmtMoney(summary.gross_profit)} icon="trending_up" tone="green" />
                <StatCard label={t("finance.returns")} value={fmtMoney(summary.returns)} icon="replay" tone="orange" />
                <StatCard label={t("finance.operationalLosses")} value={fmtMoney(totalOperationalLosses)} icon="receipt_long" tone="red" />
                <StatCard label={t("finance.expiredOnHandLoss")} value={fmtMoney(summary.expired_on_hand_loss)} icon="history_toggle_off" tone="red" />
                <StatCard label={t("finance.netProfit")} value={fmtMoney(summary.net_profit)} icon="savings" tone="green" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-3">{t("finance.expenseBreakdown")}</h3>
                  {breakdownData.length ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={breakdownData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-container-high)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(v) => fmtMoney(v)} cursor={{ fill: "var(--surface-container-high)" }} />
                          <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <SectionEmpty icon="bar_chart" t={t} />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-3">{t("finance.operationalLosses")}</h3>
                  {operationalLosses.length ? (
                    <div className="space-y-2">
                      {operationalLosses.map((l) => (
                        <div key={l.name} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container/40">
                          <span className="text-sm text-on-surface-variant">{l.name}</span>
                          <span className="font-bold text-rose-500 tabular-nums">{fmtMoney(l.value)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50">
                        <span className="text-sm font-bold text-rose-600">{t("finance.total")}</span>
                        <span className="font-bold text-rose-600 tabular-nums">{fmtMoney(totalOperationalLosses)}</span>
                      </div>
                    </div>
                  ) : (
                    <SectionEmpty icon="list_alt" t={t} />
                  )}
                </div>
              </div>
            </>
          )}
        </SectionCard>

        {/* Most requested medications */}
        <SectionCard
          icon="leaderboard"
          title={t("finance.mostRequested")}
          subtitle={t("finance.topMedicationsSubtitle")}
          actions={
            <div className="flex items-center gap-2">
              <label className="text-[11px] uppercase tracking-[0.05em] text-on-surface-variant font-bold">{t("finance.limit")}</label>
              <select
                className={selectCls}
                value={filters.topMedsLimit}
                onChange={(e) => {
                  const l = Number(e.target.value);
                  setFilter({ topMedsLimit: l });
                  if (topMeds) loadTopMeds(l);
                }}
              >
                {TOP_MEDS_LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          }
        >
          {topMedsLoading ? (
            <SectionLoading t={t} />
          ) : topMedsError ? (
            <SectionError onRetry={() => loadTopMeds()} t={t} />
          ) : !topMeds ? (
            <SectionEmpty icon="leaderboard" message={t("finance.topMedsPrompt")} t={t} />
          ) : (
            <DataTable
              t={t}
              headers={[
                { label: t("finance.rank") },
                { label: t("finance.medication") },
                { label: t("finance.qtySold"), align: "end" },
                { label: t("finance.unitPrice"), align: "end" },
                { label: t("finance.unitCost"), align: "end" },
                { label: t("finance.profit"), align: "end" },
              ]}
              rows={topMedsRows}
            />
          )}
        </SectionCard>

        {/* Demand */}
        <SectionCard
          icon="public"
          title={t("finance.demand")}
          subtitle={t("finance.demandSubtitle")}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[11px] uppercase tracking-[0.05em] text-on-surface-variant font-bold">{t("finance.groupBy")}</label>
                <select className={selectCls} value={filters.groupBy} onChange={(e) => setFilter({ groupBy: e.target.value })}>
                  {GROUP_BY_OPTIONS.map((g) => <option key={g} value={g}>{t(`finance.${g}`)}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] uppercase tracking-[0.05em] text-on-surface-variant font-bold">{t("finance.radius")}</label>
                <select className={selectCls} value={filters.radius} onChange={(e) => setFilter({ radius: Number(e.target.value) })}>
                  {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} km</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] uppercase tracking-[0.05em] text-on-surface-variant font-bold">{t("finance.limit")}</label>
                <select className={selectCls} value={filters.demandLimit} onChange={(e) => setFilter({ demandLimit: Number(e.target.value) })}>
                  {DEMAND_LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          }
        >
          {demandError ? (
            <SectionError onRetry={fetchAll} t={t} />
          ) : loading && !demand.length ? (
            <SectionLoading t={t} />
          ) : (
            <DataTable
              t={t}
              headers={[
                { label: t("finance.rank") },
                { label: t("finance.groupKey") },
                { label: t("finance.groupType") },
                { label: t("finance.searchCount"), align: "end" },
                { label: t("finance.radiusKm"), align: "end" },
              ]}
              rows={demandRows}
            />
          )}
        </SectionCard>

        {/* Expiring inventory */}
        <SectionCard
          icon="update"
          title={t("finance.expiringInventory")}
          subtitle={expiring ? `${t("finance.totalExpiredLoss")}: ${fmtMoney(expiring.total_expired_loss)} · ${t("finance.totalNearingExpiryValue")}: ${fmtMoney(expiring.total_nearing_expiry_value)}` : undefined}
          actions={
            <div className="flex items-center gap-2">
              <label className="text-[11px] uppercase tracking-[0.05em] text-on-surface-variant font-bold">{t("finance.alertWindow")}</label>
              <select className={selectCls} value={filters.days} onChange={(e) => setFilter({ days: Number(e.target.value) })}>
                {[7, 15, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} {t("finance.days")}</option>)}
              </select>
            </div>
          }
        >
          {expiringError ? (
            <SectionError onRetry={fetchAll} t={t} />
          ) : loading && !expiring ? (
            <SectionLoading t={t} />
          ) : !expiring ? (
            <SectionEmpty icon="update" t={t} />
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-3">{t("finance.expiredBatches")}</h3>
                <DataTable
                  t={t}
                  headers={[
                    { label: t("finance.batch") },
                    { label: t("finance.medication") },
                    { label: t("finance.expirationDate"), align: "end" },
                    { label: t("finance.quantity"), align: "end" },
                    { label: t("finance.lossValue"), align: "end" },
                  ]}
                  rows={expiredRows}
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-3">{t("finance.nearingExpiry")}</h3>
                <DataTable
                  t={t}
                  headers={[
                    { label: t("finance.batch") },
                    { label: t("finance.medication") },
                    { label: t("finance.expirationDate"), align: "end" },
                    { label: t("finance.daysUntilExpiry"), align: "end" },
                    { label: t("finance.quantity"), align: "end" },
                    { label: t("finance.stockValue"), align: "end" },
                  ]}
                  rows={nearingRows}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* Slow moving */}
        <SectionCard icon="hourglass_bottom" title={t("finance.slowMoving")} subtitle={t("finance.slowMovingSubtitle")}>
          {slowMovingError ? (
            <SectionError onRetry={fetchAll} t={t} />
          ) : loading && !slowMoving.length ? (
            <SectionLoading t={t} />
          ) : (
            <DataTable
              t={t}
              headers={[
                { label: t("finance.inventoryItem") },
                { label: t("finance.medication") },
                { label: t("finance.batch") },
                { label: t("finance.stockQuantity"), align: "end" },
                { label: t("finance.lastSaleDate"), align: "end" },
                { label: t("finance.daysWithoutSale"), align: "end" },
                { label: t("finance.stockValue"), align: "end" },
              ]}
              rows={slowMovingRows}
            />
          )}
        </SectionCard>

        {/* Staff performance */}
        <SectionCard icon="group" title={t("finance.staffPerformance")} subtitle={t("finance.staffPerformanceSubtitle")}>
          {staffError ? (
            <SectionError onRetry={fetchAll} t={t} />
          ) : loading && !staff.length ? (
            <SectionLoading t={t} />
          ) : (
            <DataTable
              t={t}
              headers={[
                { label: t("finance.pharmacist") },
                { label: t("finance.totalOrders"), align: "end" },
                { label: t("finance.totalSalesVolume"), align: "end" },
                { label: t("finance.avgOrderValue"), align: "end" },
                { label: t("finance.returnsCount"), align: "end" },
                { label: t("finance.returnRate"), align: "end" },
              ]}
              rows={staffRows}
            />
          )}
        </SectionCard>
      </div>
    </main>
  );
}
