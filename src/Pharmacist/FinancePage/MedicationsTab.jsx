import { fmtMoney, TOP_MEDS_LIMITS, selectCls, labelCls } from "./utils";
import { SectionCard, SectionLoading, SectionError, SectionEmpty, DataTable } from "./ui";

const rankBadge = (rank) => (
  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${rank <= 3 ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant"}`}>
    {rank}
  </span>
);

export default function MedicationsTab({
  t, topMeds, topMedsLoading, topMedsError,
  demand, demandError, loading, filters,
  onLoadTopMeds, onSetFilter, onResetTopMeds, onRetry,
}) {
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

  return (
    <>
      <SectionCard
        icon="pill"
        title={t("Reports.mostRequested")}
        subtitle={topMeds ? undefined : t("Reports.topMedsPrompt")}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={labelCls}>{t("Reports.limit")}</span>
              <select className={selectCls} value={filters.topMedsLimit} onChange={(e) => { onSetFilter({ topMedsLimit: Number(e.target.value) }); onResetTopMeds(); }}>
                {TOP_MEDS_LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button
              onClick={() => onLoadTopMeds()}
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
          <SectionError onRetry={() => onLoadTopMeds()} t={t} />
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
          <SectionError onRetry={onRetry} t={t} />
        ) : loading && !demand.length ? (
          <SectionLoading t={t} />
        ) : (
          <DataTable t={t} headers={demandHeaders} rows={demandRows} />
        )}
      </SectionCard>
    </>
  );
}
