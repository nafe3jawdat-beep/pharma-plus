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

const scoreLabel = (s) => {
  const v = String(s ?? "").toLowerCase();
  if (/(high|مرتفع|عال)/.test(v)) return "green";
  if (/(low|منخفض|ضعيف)/.test(v)) return "red";
  return "amber";
};

const AI_TONES = {
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-500",
  amber: "bg-amber-50 text-amber-500",
};

function AiBlock({ t, ai, insights, onGenerate, onRefresh }) {
  const keyFindings = Array.isArray(insights.key_findings) ? insights.key_findings : [];
  const recommendations = Array.isArray(insights.actionable_recommendations) ? insights.actionable_recommendations : [];
  const riskAlerts = Array.isArray(insights.inventory_risk_alerts) ? insights.inventory_risk_alerts : [];

  const generateBtn = (
    <button onClick={onGenerate} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
      <span className="material-symbols-outlined text-lg">auto_awesome</span>
      {t("finance.generateAiReport")}
    </button>
  );
  const refreshBtn = (
    <button onClick={onRefresh} className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container transition-all flex items-center gap-2">
      <span className="material-symbols-outlined text-lg">refresh</span>
      {t("finance.refresh")}
    </button>
  );

  if (ai.status === "loading") {
    return (
      <SectionCard title={t("finance.aiInsights")}>
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-on-surface-variant">{t("finance.generating")}</span>
        </div>
      </SectionCard>
    );
  }

  if (ai.status === "pending") {
    return (
      <SectionCard title={t("finance.aiInsights")} actions={refreshBtn}>
        <SectionEmpty icon="hourglass_top" message={t("finance.generationPending")} t={t}>
          <div className="mt-4">{refreshBtn}</div>
        </SectionEmpty>
      </SectionCard>
    );
  }

  if (ai.status === "error") {
    return (
      <SectionCard title={t("finance.aiInsights")}>
        <SectionError onRetry={onRefresh} t={t} />
      </SectionCard>
    );
  }

  if (ai.status !== "ready") {
    return (
      <SectionCard title={t("finance.aiInsights")} subtitle={t("finance.aiInsightsPrompt")}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center mb-4 shadow-md shadow-primary/15">
            <span className="material-symbols-outlined text-on-primary text-3xl">auto_awesome</span>
          </div>
          <p className="text-sm text-on-surface-variant max-w-sm mb-5">{t("finance.aiInsightsPrompt")}</p>
          {generateBtn}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={t("finance.aiInsights")} actions={generateBtn}>
      <div className="space-y-6">
        {insights.financial_health_score != null && insights.financial_health_score !== "" && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-dim/5 border border-primary/15">
            <p className="text-sm font-bold text-on-surface">{t("finance.financialHealthScore")}</p>
            <span className={`px-3.5 py-1.5 rounded-xl text-sm font-bold tabular-nums ${AI_TONES[scoreLabel(insights.financial_health_score)]}`}>
              {insights.financial_health_score}
            </span>
          </div>
        )}

        {insights.executive_summary && (
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">summarize</span>
              {t("finance.executiveSummary")}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{insights.executive_summary}</p>
          </div>
        )}

        {keyFindings.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">lightbulb</span>
              {t("finance.keyFindings")}
            </h3>
            <ul className="space-y-2">
              {keyFindings.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary mt-0.5">check_circle</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">thumb_up</span>
              {t("finance.recommendations")}
            </h3>
            <ul className="space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary mt-0.5">arrow_forward</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {riskAlerts.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-rose-400">warning</span>
              {t("finance.inventoryRiskAlerts")}
            </h3>
            <ul className="space-y-2">
              {riskAlerts.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-rose-400 mt-0.5">error_outline</span>
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

  const topMedsRows = (topMeds ?? []).map((m, i) => ({
    key: `${m.medication_id ?? i}-${i}`,
    cells: [
      { content: <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface-variant">{m.rank ?? i + 1}</span> },
      { content: <span className="font-bold text-on-surface">{m.name ?? m.medication_name}</span> },
      { content: <span className="tabular-nums">{Number(m.units_sold ?? m.total_quantity_sold ?? 0).toLocaleString()}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(m.revenue ?? m.unit_price)}</span>, align: "end" },
      { content: <span className="tabular-nums">{fmtMoney(m.cost ?? m.unit_cost)}</span>, align: "end" },
      { content: <span className="font-bold text-emerald-600 tabular-nums">{fmtMoney(m.net_profit)}</span>, align: "end" },
    ],
  }));

  const demandGrouped = demand.length > 0 && demand[0].group_key != null;
  const demandRows = demand.map((d, i) => {
    const rank = <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface-variant">{d.rank ?? i + 1}</span>;
    return demandGrouped
      ? {
          key: `${d.group_key}-${d.group_type}-${i}`,
          cells: [
            { content: rank },
            { content: <span className="font-bold text-on-surface">{d.group_key}</span> },
            { content: <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-container/40 text-primary capitalize">{t(`finance.${d.group_type}`)}</span> },
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
      { content: <span className="font-bold text-rose-500 tabular-nums">{fmtMoney(b.value ?? b.loss_value)}</span>, align: "end" },
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
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums ${daysLeft <= 15 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
            {daysLeft} {t("finance.days")}
          </span>
        ) : <span className="text-on-surface-variant">-</span>, align: "end" },
        { content: <span className="tabular-nums">{Number(b.quantity).toLocaleString()}</span>, align: "end" },
        { content: <span className="font-bold text-on-surface tabular-nums">{fmtMoney(b.value ?? b.stock_value)}</span>, align: "end" },
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
        <span className="text-rose-500 font-semibold">{t("finance.neverSold")}</span>
      ) : (
        <span className="tabular-nums">{it.last_sold_at != null ? fmtDate(it.last_sold_at) : it.last_sale_date ? fmtDate(it.last_sale_date) : "-"}</span>
      ), align: "end" },
      { content: <span className="tabular-nums">{it.days_since_last_sale != null ? `${it.days_since_last_sale} ${t("finance.days")}` : it.days_without_sale != null ? `${it.days_without_sale} ${t("finance.days")}` : "-"}</span>, align: "end" },
      { content: <span className="font-bold text-on-surface tabular-nums">{fmtMoney(it.stock_value)}</span>, align: "end" },
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
      { content: <span className="font-bold text-on-surface tabular-nums">{fmtPct(p.return_rate)}</span>, align: "end" },
    ],
  }));

  const insights = ai.data?.ai_insights ?? {};

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
          {activeTab === "overview" && (
            <SectionCard title={t("finance.summary")} subtitle={summary?.period ? `${fmtDate(summary.period.start_date)} — ${fmtDate(summary.period.end_date)}` : undefined}>
              {summaryError ? (
                <SectionError onRetry={() => fetchAll()} t={t} />
              ) : loading && !summary ? (
                <SectionLoading t={t} />
              ) : !summary ? (
                <SectionEmpty icon="monitoring" t={t} />
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard label={t("finance.grossSales")} value={fmtMoney(summary.gross_sales)} icon="point_of_sale" />
                    <StatCard label={t("finance.netRevenue")} value={fmtMoney(summary.net_revenue)} icon="payments" />
                    <StatCard label={t("finance.cogs")} value={fmtMoney(summary.net_cogs ?? summary.cogs)} icon="inventory_2" />
                    <StatCard label={t("finance.grossProfit")} value={fmtMoney(summary.gross_profit)} icon="trending_up" tone="green" />
                    <StatCard label={t("finance.returns")} value={fmtMoney(summary.returns_amount ?? summary.returns)} icon="replay" tone="orange" />
                    <StatCard label={t("finance.operationalLosses")} value={fmtMoney(totalOperationalLosses)} icon="receipt_long" tone="red" />
                    <StatCard label={t("finance.expiredOnHandLoss")} value={fmtMoney(summary.expired_inventory_loss?.value ?? summary.expired_on_hand_loss)} icon="history_toggle_off" tone="red" />
                    <StatCard label={t("finance.netProfit")} value={fmtMoney(summary.net_profit)} icon="savings" tone="green" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
          )}

          {activeTab === "medications" && (
            <>
              <SectionCard
                title={t("finance.mostRequested")}
                subtitle={topMeds ? undefined : t("finance.topMedsPrompt")}
                actions={
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] uppercase tracking-[0.05em] text-on-surface-variant font-bold">{t("finance.limit")}</label>
                      <select className={selectCls} value={filters.topMedsLimit} onChange={(e) => { setFilter({ topMedsLimit: Number(e.target.value) }); setTopMeds(null); }}>
                        {TOP_MEDS_LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => loadTopMeds()}
                      disabled={topMedsLoading}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
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
                title={t("finance.expiringInventory")}
                subtitle={expiring ? `${t("finance.totalExpiredLoss")}: ${fmtMoney(expiring.expired?.total_loss_value ?? expiring.total_expired_loss)} · ${t("finance.totalNearingExpiryValue")}: ${fmtMoney(expiring.nearing_expiry?.total_stock_value ?? expiring.total_nearing_expiry_value)}` : undefined}
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
                  <SectionError onRetry={() => fetchAll()} t={t} />
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

              <SectionCard title={t("finance.slowMoving")} subtitle={t("finance.slowMovingSubtitle")}>
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
            <SectionCard title={t("finance.staffPerformance")} subtitle={t("finance.staffPerformanceSubtitle")}>
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
