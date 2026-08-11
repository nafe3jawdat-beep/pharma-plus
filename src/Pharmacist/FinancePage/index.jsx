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
  "w-full rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-container/60";

const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant ms-1";

function SectionCard({ icon, title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-ambient-sm ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container/40 text-primary">
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </span>
          )}
          <div>
            <h2 className="font-bold text-on-surface">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>}
          </div>
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
    <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-ambient-sm">
      <div className="flex items-center justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones.icon}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </span>
        <span className="text-end text-[11px] font-bold uppercase leading-tight tracking-[0.08em] text-on-surface-variant">{label}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${tones.value}`}>{value}</p>
    </div>
  );
}

function KpiStrip({ t, summary, loading, error, onRetry }) {
  const metrics = [
    { label: t("finance.grossSales"), value: fmtMoney(summary?.gross_sales), icon: "point_of_sale", tile: "bg-surface-container/70 text-on-surface-variant", valueColor: "text-on-surface" },
    { label: t("finance.netRevenue"), value: fmtMoney(summary?.net_revenue), icon: "payments", tile: "bg-surface-container/70 text-on-surface-variant", valueColor: "text-on-surface" },
    { label: t("finance.grossProfit"), value: fmtMoney(summary?.gross_profit), icon: "trending_up", tile: "bg-emerald-50 text-emerald-600", valueColor: "text-emerald-600" },
    { label: t("finance.netProfit"), value: fmtMoney(summary?.net_profit), icon: "savings", tile: "bg-emerald-50 text-emerald-600", valueColor: "text-emerald-600" },
  ];

  if (error && !summary) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest py-8 text-center shadow-ambient-sm">
        <span className="material-symbols-outlined text-3xl text-rose-400">error</span>
        <p className="text-sm font-medium text-on-surface-variant">{t("finance.error")}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          {t("finance.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 divide-y divide-surface-container-high overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-ambient-sm lg:grid-cols-4 lg:divide-x lg:divide-y-0">
      {metrics.map((m, i) => (
        <div key={m.label} className="relative p-5 sm:p-6">
          {loading && !summary ? (
            <div className="animate-pulse">
              <div className="mb-3 h-9 w-9 rounded-xl bg-surface-container-high" />
              <div className="h-4 w-20 rounded-md bg-surface-container-high" />
              <div className="mt-2 h-7 w-28 rounded-md bg-surface-container" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.tile}`}>
                  <span className="material-symbols-outlined text-lg">{m.icon}</span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">{m.label}</span>
              </div>
              <p className={`mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${m.valueColor}`}>{m.value}</p>
            </>
          )}
          {i < metrics.length - 1 && <span className="sr-only">{i}</span>}
        </div>
      ))}
    </div>
  );
}

function SectionError({ onRetry, t }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
        <span className="material-symbols-outlined text-3xl text-rose-400">error</span>
      </div>
      <p className="mb-3 text-sm font-medium text-on-surface-variant">{t("finance.error")}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
      >
        <span className="material-symbols-outlined text-lg">refresh</span>
        {t("finance.retry")}
      </button>
    </div>
  );
}

function SectionEmpty({ icon, message, t, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container/60">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">{icon}</span>
      </div>
      <p className="max-w-sm text-sm font-medium text-on-surface-variant">{message || t("finance.noData")}</p>
      {children}
    </div>
  );
}

function SectionLoading({ t }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="ml-3 text-sm text-on-surface-variant">{t("finance.loading")}</span>
    </div>
  );
}

function Th({ children, align = "start" }) {
  return (
    <th className={`whitespace-nowrap px-5 py-3.5 text-${align} text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant`}>
      {children}
    </th>
  );
}

function Td({ children, align = "start", className = "" }) {
  return (
    <td className={`px-5 py-4 align-middle text-${align} ${className}`}>{children}</td>
  );
}

function DataTable({ headers, rows, t }) {
  if (!rows || rows.length === 0) return <SectionEmpty icon="table_rows" message={t("finance.noData")} t={t} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-container-high">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-container-high bg-surface-container/60">
            {headers.map((h, i) => <Th key={i} align={h.align || "start"}>{h.label}</Th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-high">
          {rows.map((r, i) => (
            <tr key={r.key ?? i} className="transition-colors hover:bg-surface-container/40">
              {r.cells.map((c, j) => <Td key={j} align={(headers[j] || {}).align || "start"} className={c.className || ""}>{c.content}</Td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const scoreLabel = (s) => {
  const v = String(s ?? "").toLowerCase();
  if (/(high|ممتاز|مرتفع|عال)/.test(v)) return "green";
  if (/(low|منخفض|ضعيف)/.test(v)) return "red";
  return "amber";
};

const AI_TONES = {
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-500",
  amber: "bg-amber-50 text-amber-600",
};

function AiBlock({ t, ai, insights, onGenerate, onRefresh }) {
  const keyFindings = Array.isArray(insights.key_findings) ? insights.key_findings : [];
  const recommendations = Array.isArray(insights.actionable_recommendations) ? insights.actionable_recommendations : [];
  const riskAlerts = Array.isArray(insights.inventory_risk_alerts) ? insights.inventory_risk_alerts : [];

  const generateBtn = (
    <button
      onClick={onGenerate}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dim px-6 py-2.5 text-sm font-bold text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className="material-symbols-outlined text-lg">auto_awesome</span>
      {t("finance.generateAiReport")}
    </button>
  );
  const refreshBtn = (
    <button
      onClick={onRefresh}
      className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
    >
      <span className="material-symbols-outlined text-lg">refresh</span>
      {t("finance.refresh")}
    </button>
  );

  if (ai.status === "loading") {
    return (
      <SectionCard icon="auto_awesome" title={t("finance.aiInsights")}>
        <div className="flex items-center justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-on-surface-variant">{t("finance.generating")}</span>
        </div>
      </SectionCard>
    );
  }

  if (ai.status === "pending") {
    return (
      <SectionCard icon="auto_awesome" title={t("finance.aiInsights")} actions={refreshBtn}>
        <SectionEmpty icon="hourglass_top" message={t("finance.generationPending")} t={t}>
          <div className="mt-4">{refreshBtn}</div>
        </SectionEmpty>
      </SectionCard>
    );
  }

  if (ai.status === "error") {
    return (
      <SectionCard icon="auto_awesome" title={t("finance.aiInsights")}>
        <SectionError onRetry={onRefresh} t={t} />
      </SectionCard>
    );
  }

  if (ai.status !== "ready") {
    return (
      <SectionCard icon="auto_awesome" title={t("finance.aiInsights")}>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dim shadow-md shadow-primary/15">
            <span className="material-symbols-outlined text-on-primary text-3xl">auto_awesome</span>
          </div>
          <p className="mb-5 max-w-md text-sm text-on-surface-variant">{t("finance.aiInsightsPrompt")}</p>
          {generateBtn}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon="auto_awesome" title={t("finance.aiInsights")} actions={generateBtn}>
      <div className="space-y-6">
        {insights.financial_health_score != null && insights.financial_health_score !== "" && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-primary-dim/5 p-4 sm:flex-row sm:items-center">
            <p className="text-sm font-bold text-on-surface">{t("finance.financialHealthScore")}</p>
            <span className={`w-fit rounded-xl px-3.5 py-1.5 text-sm font-bold tabular-nums ${AI_TONES[scoreLabel(insights.financial_health_score)]}`}>
              {insights.financial_health_score}
            </span>
          </div>
        )}

        {insights.executive_summary && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-primary">summarize</span>
              {t("finance.executiveSummary")}
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{insights.executive_summary}</p>
          </div>
        )}

        {keyFindings.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-primary">lightbulb</span>
              {t("finance.keyFindings")}
            </h3>
            <ul className="space-y-2">
              {keyFindings.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-surface-container-high bg-surface-container/30 p-3.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">check_circle</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-primary">thumb_up</span>
              {t("finance.recommendations")}
            </h3>
            <ul className="space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-surface-container-high bg-surface-container/30 p-3.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">arrow_forward</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {riskAlerts.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-rose-400">warning</span>
              {t("finance.inventoryRiskAlerts")}
            </h3>
            <ul className="space-y-2">
              {riskAlerts.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-sm text-rose-700">
                  <span className="material-symbols-outlined mt-0.5 text-base text-rose-400">error_outline</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest px-3.5 py-2.5 shadow-ambient">
      <p className="mb-1 text-xs font-bold text-on-surface">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold tabular-nums text-primary">{formatter ? formatter(p.value) : p.value}</p>
      ))}
    </div>
  );
}

const rankBadge = (rank) => (
  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${rank <= 3 ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant"}`}>
    {rank}
  </span>
);

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
      ["demand", reportsApi.demand(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["expiring", reportsApi.expiringInventory(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date, days: filters.days })],
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

  const breakdownData = Array.isArray(summary?.expense_breakdown)
    ? summary.expense_breakdown.map((e) => ({
        name: t(`finance.expense_${e.category}`, { defaultValue: e.category }),
        value: Number(e.total ?? 0),
      }))
    : Object.entries(summary?.expense_breakdown ?? {}).map(([k, v]) => ({
        name: t(`finance.expense_${k}`, { defaultValue: k }),
        value: Number(v ?? 0),
      }));

  const LOSS_KEY_MAP = { damaged_cost: "damages", expenses: "expenses", salaries: "salaries" };
  const operationalLosses = Object.entries(summary?.operational_losses ?? {}).map(([k, v]) => ({
    name: t(`finance.loss_${LOSS_KEY_MAP[k] ?? k}`, { defaultValue: k }),
    value: Number(v ?? 0),
  }));

  const totalOperationalLosses = operationalLosses.reduce((a, b) => a + b.value, 0);
  const maxLoss = Math.max(...operationalLosses.map((l) => l.value), 1);

  const topMedsRows = (topMeds ?? []).map((m, i) => ({
    key: `${m.medication_id ?? i}-${i}`,
    cells: [
      { content: rankBadge(m.rank ?? i + 1) },
      { content: <span className="font-bold text-on-surface">{m.name ?? m.medication_name}</span> },
      { content: <span className="tabular-nums">{Number(m.units_sold ?? m.total_quantity_sold ?? 0).toLocaleString()}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(m.revenue ?? m.unit_price)}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(m.cost ?? m.unit_cost)}</span>, align: "end" },
      { content: <span className="font-bold tabular-nums text-emerald-600">{fmtMoney(m.net_profit)}</span>, align: "end" },
    ],
  }));

  const demandGrouped = demand.length > 0 && demand[0].group_key != null;
  const demandRows = demand.map((d, i) => {
    const rank = rankBadge(d.rank ?? i + 1);
    return demandGrouped
      ? {
          key: `${d.group_key}-${d.group_type}-${i}`,
          cells: [
            { content: rank },
            { content: <span className="font-bold text-on-surface">{d.group_key}</span> },
            { content: <span className="rounded-lg bg-primary-container/40 px-2.5 py-1 text-xs font-bold capitalize text-primary">{t(`finance.${d.group_type}`)}</span> },
            { content: <span className="tabular-nums">{Number(d.search_count).toLocaleString()}</span>, align: "end" },
            { content: <span className="tabular-nums">{d.radius_km}</span>, align: "end" },
          ],
        }
      : {
          key: `${d.medication}-${i}`,
          cells: [
            { content: rank },
            { content: <span className="font-bold text-on-surface">{d.medication}</span> },
            { content: <span className="text-on-surface-variant">{d.region || "-"}</span> },
            { content: <span className="tabular-nums">{Number(d.demand_count).toLocaleString()}</span>, align: "end" },
          ],
        };
  });
  const demandHeaders = demandGrouped
    ? [
        { label: t("finance.rank") },
        { label: t("finance.groupKey") },
        { label: t("finance.groupType") },
        { label: t("finance.searchCount"), align: "end" },
        { label: t("finance.radiusKm"), align: "end" },
      ]
    : [
        { label: t("finance.rank") },
        { label: t("finance.medication") },
        { label: t("finance.region") },
        { label: t("finance.searchCount"), align: "end" },
      ];

  const expiredRows = (expiring?.expired?.items ?? expiring?.expired_batches ?? []).map((b, i) => ({
    key: `${b.inventory_id ?? b.batch_id}-expired-${i}`,
    cells: [
      { content: <span className="font-mono text-xs text-on-surface-variant">{b.inventory_id ?? b.batch_id ?? "-"}</span> },
      { content: <span className="font-bold text-on-surface">{b.name ?? b.medication_name}</span> },
      { content: <span className="tabular-nums">{fmtDate(b.expiration_date)}</span>, align: "end" },
      { content: <span className="tabular-nums">{Number(b.quantity).toLocaleString()}</span>, align: "end" },
      { content: <span className="font-bold tabular-nums text-rose-500">{fmtMoney(b.value ?? b.loss_value)}</span>, align: "end" },
    ],
  }));

  const nearingRows = (expiring?.nearing_expiry?.items ?? expiring?.nearing_expiry_batches ?? []).map((b, i) => {
    const daysLeft = b.days_until_expiry ?? (b.expiration_date ? Math.ceil((new Date(b.expiration_date) - new Date()) / 86400000) : null);
    return {
      key: `${b.inventory_id ?? b.batch_id}-nearing-${i}`,
      cells: [
        { content: <span className="font-mono text-xs text-on-surface-variant">{b.inventory_id ?? b.batch_id ?? "-"}</span> },
        { content: <span className="font-bold text-on-surface">{b.name ?? b.medication_name}</span> },
        { content: <span className="tabular-nums">{fmtDate(b.expiration_date)}</span>, align: "end" },
        { content: daysLeft != null ? (
          <span className={`rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums ${daysLeft <= 15 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
            {daysLeft} {t("finance.days")}
          </span>
        ) : <span className="text-on-surface-variant">-</span>, align: "end" },
        { content: <span className="tabular-nums">{Number(b.quantity).toLocaleString()}</span>, align: "end" },
        { content: <span className="font-bold tabular-nums text-on-surface">{fmtMoney(b.value ?? b.stock_value)}</span>, align: "end" },
      ],
    };
  });

  const slowMovingRows = slowMoving.map((it, i) => ({
    key: `${it.inventory_id ?? it.inventory_item_id}-${i}`,
    cells: [
      { content: <span className="font-mono text-xs text-on-surface-variant">{it.inventory_id ?? it.inventory_item_id ?? "-"}</span> },
      { content: <span className="font-bold text-on-surface">{it.name ?? it.medication_name}</span> },
      { content: <span className="font-mono text-xs text-on-surface-variant">{it.batch_id || "-"}</span> },
      { content: <span className="tabular-nums">{Number(it.stock ?? it.stock_quantity).toLocaleString()}</span>, align: "end" },
      { content: it.never_sold ? (
        <span className="font-semibold text-rose-500">{t("finance.neverSold")}</span>
      ) : (
        <span className="tabular-nums">{it.last_sold_at != null ? fmtDate(it.last_sold_at) : it.last_sale_date ? fmtDate(it.last_sale_date) : "-"}</span>
      ), align: "end" },
      { content: <span className="tabular-nums">{it.days_since_last_sale != null ? `${it.days_since_last_sale} ${t("finance.days")}` : it.days_without_sale != null ? `${it.days_without_sale} ${t("finance.days")}` : "-"}</span>, align: "end" },
      { content: <span className="font-bold tabular-nums text-on-surface">{fmtMoney(it.stock_value)}</span>, align: "end" },
    ],
  }));

  const staffRows = staff.map((p, i) => ({
    key: `${p.pharmacist_id}-${i}`,
    cells: [
      { content: <span className="font-bold text-on-surface">{p.name ?? p.pharmacist_name}</span> },
      { content: <span className="tabular-nums">{Number(p.total_orders ?? p.total_orders_handled).toLocaleString()}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(p.total_sales_volume)}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(p.avg_order_value ?? p.average_order_value)}</span>, align: "end" },
      { content: <span className="tabular-nums">{Number(p.total_returns ?? p.returns_count).toLocaleString()}</span>, align: "end" },
      { content: <span className="font-bold tabular-nums text-on-surface">{fmtPct(p.return_rate)}</span>, align: "end" },
    ],
  }));

  const insights = ai.data?.ai_insights ?? {};

  return (
    <main className="relative h-full overflow-y-auto bg-surface p-4 sm:p-6 md:p-8">
      <div className="pointer-events-none absolute top-0 right-0 h-[460px] w-[460px] rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-secondary-container/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dim shadow-md shadow-primary/15">
              <span className="material-symbols-outlined text-on-primary text-2xl">savings</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">{t("finance.title")}</h1>
              <p className="mt-0.5 text-sm text-on-surface-variant">{t("finance.subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedPharmacy && (
              <span className="inline-flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-lowest px-3.5 py-1.5 text-sm font-bold text-on-surface shadow-ambient-sm">
                <span className="material-symbols-outlined text-base text-primary">store</span>
                <span className="max-w-44 truncate">{selectedPharmacy.name}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-surface-container-high bg-surface-container-lowest px-3.5 py-1.5 text-xs font-bold text-on-surface-variant shadow-ambient-sm">
              <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
              {fmtDate(startDate)} — {fmtDate(endDate)}
            </span>
          </div>
        </header>

        <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 shadow-ambient-sm sm:p-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="flex flex-col gap-2">
              <span className={labelCls}>{t("finance.period")}</span>
              <div className="flex gap-1 rounded-xl bg-surface-container/70 p-1">
                {PRESETS.map((d) => (
                  <button
                    key={d}
                    onClick={() => applyPreset(d)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-all ${preset === d ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                  >
                    {t(`finance.last${d}Days`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={labelCls}>{t("finance.startDate")}</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">calendar_today</span>
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPreset(null); }} className={`${selectCls} ps-10`} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={labelCls}>{t("finance.endDate")}</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">calendar_today</span>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPreset(null); }} className={`${selectCls} ps-10`} />
              </div>
            </div>
            <button
              onClick={applyRange}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dim px-5 py-2.5 text-sm font-bold text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              {t("finance.apply")}
            </button>
          </div>
        </div>

        <KpiStrip t={t} summary={summary} loading={loading} error={summaryError} onRetry={() => fetchAll()} />

        <div className="flex w-fit max-w-full flex-wrap gap-1.5 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-1.5 shadow-ambient-sm">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  active
                    ? "bg-gradient-to-r from-primary to-primary-dim text-on-primary shadow-md"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        <div key={activeTab} className="animate-fade-in space-y-6">
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label={t("finance.cogs")} value={fmtMoney(summary?.net_cogs ?? summary?.cogs)} icon="inventory_2" />
                <StatCard label={t("finance.returns")} value={fmtMoney(summary?.returns_amount ?? summary?.returns)} icon="replay" tone="orange" />
                <StatCard label={t("finance.operationalLosses")} value={fmtMoney(totalOperationalLosses)} icon="receipt_long" tone="red" />
                <StatCard label={t("finance.expiredOnHandLoss")} value={fmtMoney(summary?.expired_inventory_loss?.value ?? summary?.expired_on_hand_loss)} icon="history_toggle_off" tone="red" />
              </div>

              <SectionCard
                icon="monitoring"
                title={t("finance.summary")}
                subtitle={summary?.period ? `${fmtDate(summary.period.start_date)} — ${fmtDate(summary.period.end_date)}` : undefined}
              >
                {summaryError && !summary ? (
                  <SectionError onRetry={() => fetchAll()} t={t} />
                ) : loading && !summary ? (
                  <SectionLoading t={t} />
                ) : !summary ? (
                  <SectionEmpty icon="monitoring" t={t} />
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-bold text-on-surface">{t("finance.expenseBreakdown")}</h3>
                      {breakdownData.length ? (
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={breakdownData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                              <defs>
                                <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                                  <stop offset="100%" stopColor="var(--primary-dim)" stopOpacity={0.75} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-container-high)" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} tickLine={false} axisLine={false} />
                              <Tooltip content={<ChartTooltip formatter={fmtMoney} />} cursor={{ fill: "var(--surface-container-high)" }} />
                              <Bar dataKey="value" fill="url(#expenseBar)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <SectionEmpty icon="bar_chart" t={t} />
                      )}
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-bold text-on-surface">{t("finance.operationalLosses")}</h3>
                      {operationalLosses.length ? (
                        <div className="space-y-4">
                          {operationalLosses.map((l) => (
                            <div key={l.name}>
                              <div className="mb-1.5 flex items-center justify-between text-sm">
                                <span className="text-on-surface-variant">{l.name}</span>
                                <span className="font-bold tabular-nums text-rose-500">{fmtMoney(l.value)}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-rose-100">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700"
                                  style={{ width: `${Math.min((l.value / maxLoss) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                            <span className="text-sm font-bold text-rose-600">{t("finance.total")}</span>
                            <span className="font-bold tabular-nums text-rose-600">{fmtMoney(totalOperationalLosses)}</span>
                          </div>
                        </div>
                      ) : (
                        <SectionEmpty icon="list_alt" t={t} />
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {activeTab === "medications" && (
            <>
              <SectionCard
                icon="pill"
                title={t("finance.mostRequested")}
                subtitle={topMeds ? undefined : t("finance.topMedsPrompt")}
                actions={
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={labelCls}>{t("finance.limit")}</span>
                      <select className={selectCls} value={filters.topMedsLimit} onChange={(e) => { setFilter({ topMedsLimit: Number(e.target.value) }); setTopMeds(null); }}>
                        {TOP_MEDS_LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => loadTopMeds()}
                      disabled={topMedsLoading}
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">{topMedsLoading ? "hourglass_top" : "trending_up"}</span>
                      {t("finance.mostRequested")}
                    </button>
                  </div>
                }
              >
                {topMedsLoading ? (
                  <SectionLoading t={t} />
                ) : topMedsError ? (
                  <SectionError onRetry={() => loadTopMeds()} t={t} />
                ) : !topMeds ? (
                  <SectionEmpty icon="table_rows" message={t("finance.topMedsPrompt")} t={t} />
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

              <SectionCard icon="radar" title={t("finance.demand")} subtitle={t("finance.demandSubtitle")}>
                {demandError ? (
                  <SectionError onRetry={() => fetchAll()} t={t} />
                ) : loading && !demand.length ? (
                  <SectionLoading t={t} />
                ) : (
                  <DataTable t={t} headers={demandHeaders} rows={demandRows} />
                )}
              </SectionCard>
            </>
          )}

          {activeTab === "inventory" && (
            <>
              <SectionCard
                icon="inventory_2"
                title={t("finance.expiringInventory")}
                subtitle={expiring ? `${t("finance.totalExpiredLoss")}: ${fmtMoney(expiring.expired?.total_loss_value ?? expiring.total_expired_loss)} · ${t("finance.totalNearingExpiryValue")}: ${fmtMoney(expiring.nearing_expiry?.total_stock_value ?? expiring.total_nearing_expiry_value)}` : undefined}
                actions={
                  <div className="flex items-center gap-2">
                    <span className={labelCls}>{t("finance.alertWindow")}</span>
                    <select className={selectCls} value={filters.days} onChange={(e) => setFilter({ days: Number(e.target.value) })}>
                      {[7, 15, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} {t("finance.days")}</option>)}
                    </select>
                  </div>
                }
              >
                {expiringError ? (
                  <SectionError onRetry={() => fetchAll()} t={t} />
                ) : loading && !expiring ? (
                  <SectionLoading t={t} />
                ) : !expiring ? (
                  <SectionEmpty icon="update" t={t} />
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
                        <span className="material-symbols-outlined text-lg text-rose-400">close</span>
                        {t("finance.expiredBatches")}
                      </h3>
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
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
                        <span className="material-symbols-outlined text-lg text-amber-500">schedule</span>
                        {t("finance.nearingExpiry")}
                      </h3>
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

              <SectionCard icon="hourglass_bottom" title={t("finance.slowMoving")} subtitle={t("finance.slowMovingSubtitle")}>
                {slowMovingError ? (
                  <SectionError onRetry={() => fetchAll()} t={t} />
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
            </>
          )}

          {activeTab === "staff" && (
            <SectionCard icon="group" title={t("finance.staffPerformance")} subtitle={t("finance.staffPerformanceSubtitle")}>
              {staffError ? (
                <SectionError onRetry={() => fetchAll()} t={t} />
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
          )}

          {activeTab === "ai" && (
            <AiBlock t={t} ai={ai} insights={insights} onGenerate={generateAiReport} onRefresh={fetchAiReport} />
          )}
        </div>
      </div>
    </main>
  );
}
