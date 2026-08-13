import { fmtMoney } from "./utils";

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

export {
  SectionCard,
  StatCard,
  KpiStrip,
  SectionError,
  SectionEmpty,
  SectionLoading,
  Th,
  Td,
  DataTable,
};
