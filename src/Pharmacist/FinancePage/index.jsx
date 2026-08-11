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
  "bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all";

function SectionCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <div className={`bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-surface-container-high">
        <div>
          <h2 className="font-bold text-on-surface">{title}</h2>
          {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatCard({ label, value, icon, tone = "default" }) {
  const toneCls = {
    default: "text-on-surface",
    green: "text-emerald-600",
    red: "text-rose-500",
    orange: "text-amber-500",
  }[tone];
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-4">
      <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 400" }}>{icon}</span>
        <span className="font-semibold uppercase tracking-[0.05em]">{label}</span>
      </div>
      <p className={`text-xl font-extrabold tabular-nums ${toneCls}`}>{value}</p>
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
      <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-2">{icon}</span>
      <p className="text-sm text-on-surface-variant font-medium">{message || t("finance.noData")}</p>
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

  const fetchAll = useCallback(async () => {
    if (!pharmacyId) return;
    setLoading(true);
    const requests = [
      ["summary", reportsApi.financialSummary(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["topMeds", reportsApi.topMedications(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date, limit: filters.topMedsLimit })],
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

  useEffect(() => { fetchAll(); /* eslint-disable-line react-hooks/set-state-in-effect */ }, [fetchAll]);

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 86400000);
    const s = toDateStr(start);
    const e = toDateStr(end);
    setStartDate(s);
    setEndDate(e);
    setPreset(days);
    setFilters((f) => ({ ...f, start_date: `${s}T00:00:00Z`, end_date: `${e}T23:59:59Z` }));
  };

  const applyRange = () => {
    setFilters((f) => ({ ...f, start_date: `${startDate}T00:00:00Z`, end_date: `${endDate}T23:59:59Z` }));
  };

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const summary = data.summary;
  const summaryError = errors.summary;
  const topMeds = data.topMeds ?? [];
  const topMedsError = errors.topMeds;
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

  const topMedsRows = topMeds.map((m, i) => ({
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
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">{t("finance.title")}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{t("finance.subtitle")}</p>
      </div>

      {/* Filter bar */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-4 flex flex-wrap items-end gap-3">
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
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          {t("finance.apply")}
        </button>
      </div>

      {/* Financial summary */}
      <SectionCard title={t("finance.summary")} subtitle={summary?.period ? `${fmtDate(summary.period.start_date)} — ${fmtDate(summary.period.end_date)}` : undefined}>
        {summaryError ? (
          <SectionError onRetry={fetchAll} t={t} />
        ) : loading && !summary ? (
          <SectionLoading t={t} />
        ) : !summary ? (
          <SectionEmpty icon="monitoring" t={t} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
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

      {/* Top medications */}
      <SectionCard
        title={t("finance.topMedications")}
        subtitle={t("finance.topMedicationsSubtitle")}
        actions={
          <div className="flex items-center gap-2">
            <label className="text-[11px] uppercase tracking-[0.05em] text-on-surface-variant font-bold">{t("finance.limit")}</label>
            <select className={selectCls} value={filters.topMedsLimit} onChange={(e) => setFilter({ topMedsLimit: Number(e.target.value) })}>
              {TOP_MEDS_LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        }
      >
        {topMedsError ? (
          <SectionError onRetry={fetchAll} t={t} />
        ) : loading && !topMeds.length ? (
          <SectionLoading t={t} />
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
      <SectionCard title={t("finance.slowMoving")} subtitle={t("finance.slowMovingSubtitle")}>
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
      <SectionCard title={t("finance.staffPerformance")} subtitle={t("finance.staffPerformanceSubtitle")}>
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
  );
}
