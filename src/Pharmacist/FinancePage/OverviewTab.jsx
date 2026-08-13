import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { fmtMoney, fmtPct, fmtDate, EXPENSE_COLORS } from "./utils";
import { StatCard, SectionCard, SectionError, SectionLoading, SectionEmpty } from "./ui";

const LOSS_KEY_MAP = { damaged_cost: "damages", expenses: "expenses", salaries: "salaries" };

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

export default function OverviewTab({ t, summary, summaryError, loading, onRetry }) {
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

  const operationalLosses = Object.entries(summary?.operational_losses ?? {}).map(([k, v]) => ({
    name: t(`Reports.loss_${LOSS_KEY_MAP[k] ?? k}`, { defaultValue: k }),
    value: Number(v ?? 0),
  }));

  const totalOperationalLosses = operationalLosses.reduce((a, b) => a + b.value, 0);
  const maxLoss = Math.max(...operationalLosses.map((l) => l.value), 1);

  return (
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
          <SectionError onRetry={onRetry} t={t} />
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
  );
}
