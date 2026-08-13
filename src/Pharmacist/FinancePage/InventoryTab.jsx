import { fmtMoney, fmtDate, selectCls, labelCls } from "./utils";
import { SectionCard, SectionLoading, SectionError, SectionEmpty, DataTable } from "./ui";

export default function InventoryTab({
  t, expiring, expiringError, slowMoving, slowMovingError, loading,
  filters, onSetFilter, onRetry,
}) {
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

  return (
    <>
      <SectionCard
        icon="inventory_2"
        title={t("Reports.expiringInventory")}
        subtitle={expiring ? `${t("Reports.totalExpiredLoss")}: ${fmtMoney(expiring.expired?.total_loss_value ?? expiring.total_expired_loss)} · ${t("Reports.totalNearingExpiryValue")}: ${fmtMoney(expiring.nearing_expiry?.total_stock_value ?? expiring.total_nearing_expiry_value)}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <span className={labelCls}>{t("Reports.alertWindow")}</span>
            <select className={selectCls} value={filters.days} onChange={(e) => onSetFilter({ days: Number(e.target.value) })}>
              {[7, 15, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} {t("Reports.days")}</option>)}
            </select>
          </div>
        }
      >
        {expiringError ? (
          <SectionError onRetry={onRetry} t={t} />
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
          <SectionError onRetry={onRetry} t={t} />
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
  );
}
