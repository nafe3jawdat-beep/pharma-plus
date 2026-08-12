import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { reportsApi, employeeService } from "../../services/pharmacist";
import { useAuth } from "../../contexts/AuthContext";

const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const PRESETS = [7, 30, 90];
const TOP_MEDS_LIMITS = [5, 10];

const TABS = [
  { key: "overview", labelKey: "Reports.tabOverview", icon: "monitoring" },
  { key: "medications", labelKey: "Reports.tabMedications", icon: "pill" },
  { key: "inventory", labelKey: "Reports.tabInventory", icon: "inventory_2" },
  { key: "staff", labelKey: "Reports.tabStaff", icon: "group" },
  { key: "ai", labelKey: "Reports.tabAiInsights", icon: "auto_awesome" },
];

const fmtMoney = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (v) => (v == null ? "-" : `${(Number(v) * 100).toFixed(1)}%`);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString() : "-";

const EXPENSE_COLORS = [
  "var(--color-primary)",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#10b981",
  "#ef4444",
  "#06b6d4",
];

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
    { label: t("Reports.grossSales"), value: fmtMoney(summary?.gross_sales), icon: "point_of_sale", tile: "bg-surface-container/70 text-on-surface-variant", valueColor: "text-on-surface" },
    { label: t("Reports.netRevenue"), value: fmtMoney(summary?.net_revenue), icon: "payments", tile: "bg-surface-container/70 text-on-surface-variant", valueColor: "text-on-surface" },
    { label: t("Reports.grossProfit"), value: fmtMoney(summary?.gross_profit), icon: "trending_up", tile: "bg-emerald-50 text-emerald-600", valueColor: "text-emerald-600" },
    { label: t("Reports.netProfit"), value: fmtMoney(summary?.net_profit), icon: "savings", tile: "bg-emerald-50 text-emerald-600", valueColor: "text-emerald-600" },
  ];

  if (error && !summary) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest py-8 text-center shadow-ambient-sm">
        <span className="material-symbols-outlined text-3xl text-rose-400">error</span>
        <p className="text-sm font-medium text-on-surface-variant">{t("Reports.error")}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          {t("Reports.retry")}
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
      <p className="mb-3 text-sm font-medium text-on-surface-variant">{t("Reports.error")}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
      >
        <span className="material-symbols-outlined text-lg">refresh</span>
        {t("Reports.retry")}
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
      <p className="max-w-sm text-sm font-medium text-on-surface-variant">{message || t("Reports.noData")}</p>
      {children}
    </div>
  );
}

function SectionLoading({ t }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="ml-3 text-sm text-on-surface-variant">{t("Reports.loading")}</span>
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
  if (!rows || rows.length === 0) return <SectionEmpty icon="table_rows" message={t("Reports.noData")} t={t} />;
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
      {t("Reports.generateAiReport")}
    </button>
  );
  const refreshBtn = (
    <button
      onClick={onRefresh}
      className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
    >
      <span className="material-symbols-outlined text-lg">refresh</span>
      {t("Reports.refresh")}
    </button>
  );

  if (ai.status === "loading") {
    return (
      <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")}>
        <div className="flex items-center justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-on-surface-variant">{t("Reports.generating")}</span>
        </div>
      </SectionCard>
    );
  }

  if (ai.status === "pending") {
    return (
      <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")} actions={refreshBtn}>
        <SectionEmpty icon="hourglass_top" message={t("Reports.generationPending")} t={t}>
          <div className="mt-4">{refreshBtn}</div>
        </SectionEmpty>
      </SectionCard>
    );
  }

  if (ai.status === "error") {
    return (
      <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")}>
        <SectionError onRetry={onRefresh} t={t} />
      </SectionCard>
    );
  }

  if (ai.status !== "ready") {
    return (
      <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")}>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dim shadow-md shadow-primary/15">
            <span className="material-symbols-outlined text-on-primary text-3xl">auto_awesome</span>
          </div>
          <p className="mb-5 max-w-md text-sm text-on-surface-variant">{t("Reports.aiInsightsPrompt")}</p>
          {generateBtn}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")} actions={generateBtn}>
      <div className="space-y-6">
        {insights.financial_health_score != null && insights.financial_health_score !== "" && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-primary-dim/5 p-4 sm:flex-row sm:items-center">
            <p className="text-sm font-bold text-on-surface">{t("Reports.financialHealthScore")}</p>
            <span className={`w-fit rounded-xl px-3.5 py-1.5 text-sm font-bold tabular-nums ${AI_TONES[scoreLabel(insights.financial_health_score)]}`}>
              {insights.financial_health_score}
            </span>
          </div>
        )}

        {insights.executive_summary && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-primary">summarize</span>
              {t("Reports.executiveSummary")}
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{insights.executive_summary}</p>
          </div>
        )}

        {keyFindings.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-primary">lightbulb</span>
              {t("Reports.keyFindings")}
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
              {t("Reports.recommendations")}
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
              {t("Reports.inventoryRiskAlerts")}
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

function ExpensePieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest px-3.5 py-2.5 shadow-ambient">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-on-surface">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.payload?.color }} />
        {p.name}
      </p>
      <p className="text-sm font-bold tabular-nums text-primary">{fmtMoney(p.value)}</p>
      {p.payload?.percent != null && (
        <p className="mt-0.5 text-xs text-on-surface-variant">{fmtPct(p.payload.percent)}</p>
      )}
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
  const { user } = useAuth();
  const { selectedPharmacy, isOwner } = useOutletContext();
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
  const [staffSearch, setStaffSearch] = useState("");

  const fetchAll = useCallback(async () => {
    if (!pharmacyId) return;
    setLoading(true);
    const requests = [
      ["summary", reportsApi.financialSummary(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["demand", reportsApi.demand(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["expiring", reportsApi.expiringInventory(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date, days: filters.days })],
      ["slowMoving", reportsApi.slowMoving(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["staff", reportsApi.staffPerformance(pharmacyId, { start_date: filters.start_date, end_date: filters.end_date })],
      ["employees", employeeService.getAll(pharmacyId)],
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

  const applyRange = (start, end) => {
    setTopMeds(null);
    setAi({ status: "idle", data: null, loading: false });
    setFilters((f) => ({ ...f, start_date: `${start}T00:00:00Z`, end_date: `${end}T23:59:59Z` }));
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
  const staff = useMemo(() => data.staff ?? [], [data.staff]);
  const staffError = errors.staff;
  const employees = data.employees ?? null;
  const employeesError = errors.employees;

  const breakdownData = Array.isArray(summary?.expense_breakdown)
    ? summary.expense_breakdown.map((e) => ({
        name: t(`Reports.expense_${e.category}`, { defaultValue: e.category }),
        value: Number(e.total ?? 0),
      }))
    : Object.entries(summary?.expense_breakdown ?? {}).map(([k, v]) => ({
        name: t(`Reports.expense_${k}`, { defaultValue: k }),
        value: Number(v ?? 0),
      }));

  const expenseTotal = breakdownData.reduce((a, b) => a + b.value, 0);
  const sortedBreakdown = [...breakdownData]
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((d, i) => ({
      ...d,
      color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
      percent: expenseTotal > 0 ? d.value / expenseTotal : 0,
    }));

  const LOSS_KEY_MAP = { damaged_cost: "damages", expenses: "expenses", salaries: "salaries" };
  const operationalLosses = Object.entries(summary?.operational_losses ?? {}).map(([k, v]) => ({
    name: t(`Reports.loss_${LOSS_KEY_MAP[k] ?? k}`, { defaultValue: k }),
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
            { content: <span className="rounded-lg bg-primary-container/40 px-2.5 py-1 text-xs font-bold capitalize text-primary">{t(`Reports.${d.group_type}`)}</span> },
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
        { label: t("Reports.rank") },
        { label: t("Reports.groupKey") },
        { label: t("Reports.groupType") },
        { label: t("Reports.searchCount"), align: "end" },
        { label: t("Reports.radiusKm"), align: "end" },
      ]
    : [
        { label: t("Reports.rank") },
        { label: t("Reports.medication") },
        { label: t("Reports.region") },
        { label: t("Reports.searchCount"), align: "end" },
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
            {daysLeft} {t("Reports.days")}
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
        <span className="font-semibold text-rose-500">{t("Reports.neverSold")}</span>
      ) : (
        <span className="tabular-nums">{it.last_sold_at != null ? fmtDate(it.last_sold_at) : it.last_sale_date ? fmtDate(it.last_sale_date) : "-"}</span>
      ), align: "end" },
      { content: <span className="tabular-nums">{it.days_since_last_sale != null ? `${it.days_since_last_sale} ${t("Reports.days")}` : it.days_without_sale != null ? `${it.days_without_sale} ${t("Reports.days")}` : "-"}</span>, align: "end" },
      { content: <span className="font-bold tabular-nums text-on-surface">{fmtMoney(it.stock_value)}</span>, align: "end" },
    ],
  }));

  const mergedEmployees = useMemo(() => {
    const byId = new Map(staff.map((p) => [p.pharmacist_id, p]));
    const byName = new Map(staff.map((p) => [(p.name ?? p.pharmacist_name ?? "").toLowerCase(), p]));
    const base = Array.isArray(employees) ? employees : staff.length > 0 ? staff : [];
    const list = base.map((emp) => {
      const perf = byId.get(emp.user_id) || byName.get(String(emp.name ?? "").toLowerCase()) || {};
      return { ...emp, ...perf, role: emp.role || "staff" };
    });
    const hasOwner = list.some((e) => e.role === "owner");
    if (isOwner && !hasOwner) {
      const ownerName = `${user?.f_name ?? ""} ${user?.l_name ?? ""}`.trim() || t("nav.owner");
      list.unshift({
        id: "owner",
        name: ownerName,
        email: user?.email || selectedPharmacy?.support_email || null,
        salary: null,
        role: "owner",
      });
    }
    return list;
  }, [staff, employees, isOwner, user, selectedPharmacy, t]);

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return mergedEmployees;
    return mergedEmployees.filter((e) => String(e.name ?? "").toLowerCase().includes(q));
  }, [mergedEmployees, staffSearch]);

  const staffRows = filteredStaff.map((p, i) => {
    const isOwnerRow = p.role === "owner";
    const orders = p.total_orders ?? p.total_orders_handled;
    const sales = p.total_sales_volume;
    const avg = p.avg_order_value ?? p.average_order_value;
    const returns = p.total_returns ?? p.returns_count;
    return {
      key: `${p.id ?? p.user_id ?? p.pharmacist_id}-${i}`,
      cells: [
        {
          content: (
            <span className="flex items-center gap-2">
              <span className="font-bold text-on-surface">{p.name ?? p.pharmacist_name}</span>
              {isOwnerRow ? (
                <span className="rounded-md bg-primary-container/40 px-2 py-0.5 text-[10px] font-bold text-primary">{t("nav.owner")}</span>
              ) : (
                <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">{t("nav.employees")}</span>
              )}
            </span>
          ),
        },
        { content: <span className="text-on-surface-variant">{p.email || "—"}</span> },
        { content: <span className="tabular-nums">{p.salary != null && p.salary !== "" ? Number(p.salary).toLocaleString() : "—"}</span>, align: "end" },
        { content: <span className="tabular-nums">{orders != null ? Number(orders).toLocaleString() : "—"}</span>, align: "end" },
        { content: <span className="tabular-nums">{sales != null ? fmtMoney(sales) : "—"}</span>, align: "end" },
        { content: <span className="tabular-nums">{avg != null ? fmtMoney(avg) : "—"}</span>, align: "end" },
        { content: <span className="tabular-nums">{returns != null ? Number(returns).toLocaleString() : "—"}</span>, align: "end" },
        { content: <span className="font-bold tabular-nums text-on-surface">{p.return_rate != null ? fmtPct(p.return_rate) : "—"}</span>, align: "end" },
      ],
    };
  });

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
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">{t("Reports.title")}</h1>
              <p className="mt-0.5 text-sm text-on-surface-variant">{t("Reports.subtitle")}</p>
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
              <span className={labelCls}>{t("Reports.period")}</span>
              <div className="flex gap-1 rounded-xl bg-surface-container/70 p-1">
                {PRESETS.map((d) => (
                  <button
                    key={d}
                    onClick={() => applyPreset(d)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-all ${preset === d ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                  >
                    {t(`Reports.last${d}Days`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={labelCls}>{t("Reports.startDate")}</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">calendar_today</span>
                <input type="date" value={startDate} onChange={(e) => { const v = e.target.value; setStartDate(v); setPreset(null); if (v && endDate) applyRange(v, endDate); }} className={`${selectCls} ps-10`} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={labelCls}>{t("Reports.endDate")}</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">calendar_today</span>
                <input type="date" value={endDate} onChange={(e) => { const v = e.target.value; setEndDate(v); setPreset(null); if (v && startDate) applyRange(startDate, v); }} className={`${selectCls} ps-10`} />
              </div>
            </div>
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
                <StatCard label={t("Reports.cogs")} value={fmtMoney(summary?.net_cogs ?? summary?.cogs)} icon="inventory_2" />
                <StatCard label={t("Reports.returns")} value={fmtMoney(summary?.returns_amount ?? summary?.returns)} icon="replay" tone="orange" />
                <StatCard label={t("Reports.operationalLosses")} value={fmtMoney(totalOperationalLosses)} icon="receipt_long" tone="red" />
                <StatCard label={t("Reports.expiredOnHandLoss")} value={fmtMoney(summary?.expired_inventory_loss?.value ?? summary?.expired_on_hand_loss)} icon="history_toggle_off" tone="red" />
              </div>

              <SectionCard
                icon="monitoring"
                title={t("Reports.summary")}
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
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-on-surface">{t("Reports.expenseBreakdown")}</h3>
                        {sortedBreakdown.length > 0 && (
                          <span className="rounded-lg bg-primary-container/40 px-2.5 py-1 text-xs font-bold tabular-nums text-primary">
                            {t("Reports.total")}: {fmtMoney(expenseTotal)}
                          </span>
                        )}
                      </div>
                      {sortedBreakdown.length ? (
                        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr]">
                          <div className="relative mx-auto h-52 w-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={sortedBreakdown}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius="68%"
                                  outerRadius="94%"
                                  paddingAngle={2}
                                  stroke="var(--color-surface-container-lowest)"
                                  strokeWidth={2}
                                >
                                  {sortedBreakdown.map((d) => (
                                    <Cell key={d.name} fill={d.color} />
                                  ))}
                                </Pie>
                                <Tooltip content={<ExpensePieTooltip />} wrapperStyle={{ zIndex: 50 }} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">{t("Reports.total")}</span>
                              <span className="mt-0.5 text-xl font-bold tabular-nums text-on-surface">{fmtMoney(expenseTotal)}</span>
                            </div>
                          </div>
                          <ul className="flex flex-col gap-1">
                            {sortedBreakdown.map((d) => (
                              <li key={d.name} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-surface-container/60">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                                <span className="flex-1 truncate text-sm text-on-surface-variant">{d.name}</span>
                                <span className="text-xs font-bold tabular-nums text-on-surface-variant/70">{fmtPct(d.percent)}</span>
                                <span className="w-24 text-end text-sm font-bold tabular-nums text-on-surface">{fmtMoney(d.value)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <SectionEmpty icon="pie_chart" t={t} />
                      )}
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-bold text-on-surface">{t("Reports.operationalLosses")}</h3>
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
                            <span className="text-sm font-bold text-rose-600">{t("Reports.total")}</span>
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
                title={t("Reports.mostRequested")}
                subtitle={topMeds ? undefined : t("Reports.topMedsPrompt")}
                actions={
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={labelCls}>{t("Reports.limit")}</span>
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
                      {t("Reports.mostRequested")}
                    </button>
                  </div>
                }
              >
                {topMedsLoading ? (
                  <SectionLoading t={t} />
                ) : topMedsError ? (
                  <SectionError onRetry={() => loadTopMeds()} t={t} />
                ) : !topMeds ? (
                  <SectionEmpty icon="table_rows" message={t("Reports.topMedsPrompt")} t={t} />
                ) : (
                  <DataTable
                    t={t}
                    headers={[
                      { label: t("Reports.rank") },
                      { label: t("Reports.medication") },
                      { label: t("Reports.qtySold"), align: "end" },
                      { label: t("Reports.unitPrice"), align: "end" },
                      { label: t("Reports.unitCost"), align: "end" },
                      { label: t("Reports.profit"), align: "end" },
                    ]}
                    rows={topMedsRows}
                  />
                )}
              </SectionCard>

              <SectionCard icon="radar" title={t("Reports.demand")} subtitle={t("Reports.demandSubtitle")}>
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
                title={t("Reports.expiringInventory")}
                subtitle={expiring ? `${t("Reports.totalExpiredLoss")}: ${fmtMoney(expiring.expired?.total_loss_value ?? expiring.total_expired_loss)} · ${t("Reports.totalNearingExpiryValue")}: ${fmtMoney(expiring.nearing_expiry?.total_stock_value ?? expiring.total_nearing_expiry_value)}` : undefined}
                actions={
                  <div className="flex items-center gap-2">
                    <span className={labelCls}>{t("Reports.alertWindow")}</span>
                    <select className={selectCls} value={filters.days} onChange={(e) => setFilter({ days: Number(e.target.value) })}>
                      {[7, 15, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} {t("Reports.days")}</option>)}
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
                        {t("Reports.expiredBatches")}
                      </h3>
                      <DataTable
                        t={t}
                        headers={[
                          { label: t("Reports.batch") },
                          { label: t("Reports.medication") },
                          { label: t("Reports.expirationDate"), align: "end" },
                          { label: t("Reports.quantity"), align: "end" },
                          { label: t("Reports.lossValue"), align: "end" },
                        ]}
                        rows={expiredRows}
                      />
                    </div>
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
                        <span className="material-symbols-outlined text-lg text-amber-500">schedule</span>
                        {t("Reports.nearingExpiry")}
                      </h3>
                      <DataTable
                        t={t}
                        headers={[
                          { label: t("Reports.batch") },
                          { label: t("Reports.medication") },
                          { label: t("Reports.expirationDate"), align: "end" },
                          { label: t("Reports.daysUntilExpiry"), align: "end" },
                          { label: t("Reports.quantity"), align: "end" },
                          { label: t("Reports.stockValue"), align: "end" },
                        ]}
                        rows={nearingRows}
                      />
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard icon="hourglass_bottom" title={t("Reports.slowMoving")} subtitle={t("Reports.slowMovingSubtitle")}>
                {slowMovingError ? (
                  <SectionError onRetry={() => fetchAll()} t={t} />
                ) : loading && !slowMoving.length ? (
                  <SectionLoading t={t} />
                ) : (
                  <DataTable
                    t={t}
                    headers={[
                      { label: t("Reports.inventoryItem") },
                      { label: t("Reports.medication") },
                      { label: t("Reports.batch") },
                      { label: t("Reports.stockQuantity"), align: "end" },
                      { label: t("Reports.lastSaleDate"), align: "end" },
                      { label: t("Reports.daysWithoutSale"), align: "end" },
                      { label: t("Reports.stockValue"), align: "end" },
                    ]}
                    rows={slowMovingRows}
                  />
                )}
              </SectionCard>
            </>
          )}

          {activeTab === "staff" && (
            <SectionCard
              icon="group"
              title={t("Reports.employeeList")}
              subtitle={t("Reports.staffPerformanceSubtitle")}
              actions={
                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">search</span>
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder={t("Reports.searchEmployeeName")}
                    className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest ps-10 pe-3 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary-container/60"
                  />
                </div>
              }
            >
              {staffError && !staff.length && employeesError && !employees ? (
                <SectionError onRetry={() => fetchAll()} t={t} />
              ) : loading && mergedEmployees.length === 0 ? (
                <SectionLoading t={t} />
              ) : mergedEmployees.length === 0 ? (
                <SectionEmpty icon="group" message={t("employees.noEmployees")} t={t} />
              ) : filteredStaff.length === 0 ? (
                <SectionEmpty icon="search_off" message={t("Reports.noEmployeesMatch")} t={t} />
              ) : (
                <DataTable
                  t={t}
                  headers={[
                    { label: t("employees.name") },
                    { label: t("employees.email") },
                    { label: t("employees.salary"), align: "end" },
                    { label: t("Reports.totalOrders"), align: "end" },
                    { label: t("Reports.totalSalesVolume"), align: "end" },
                    { label: t("Reports.avgOrderValue"), align: "end" },
                    { label: t("Reports.returnsCount"), align: "end" },
                    { label: t("Reports.returnRate"), align: "end" },
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
