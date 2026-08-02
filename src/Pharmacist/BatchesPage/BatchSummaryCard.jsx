export default function BatchSummaryCard({ batches, t }) {
  const expiringSoonCount = batches.filter(b => {
    if (!b.expiration_date) return false;
    const diff = new Date(b.expiration_date) - new Date();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const totalBatchStock = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

  return (
    <div className="bg-surface-container/40 rounded-3xl border border-surface-container-high p-7">
      <div className="flex items-center gap-3 pb-5 border-b border-surface-container-high">
        <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-on-surface">{t("batches.summary")}</h3>
          <p className="text-xs text-on-surface-variant">{t("batches.summaryDesc")}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high">
          <div className="text-2xl font-bold text-on-surface tabular-nums">{batches.length}</div>
          <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">{t("batches.totalBatches")}</div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high">
          <div className="text-2xl font-bold text-primary tabular-nums">{totalBatchStock}</div>
          <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">{t("batches.totalStock")}</div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high">
          <div className={`text-2xl font-bold tabular-nums ${expiringSoonCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{expiringSoonCount}</div>
          <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">{t("batches.expiringSoon")}</div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high">
          <div className="text-2xl font-bold text-on-surface tabular-nums">{batches.filter(b => b.quantity <= 0).length}</div>
          <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">{t("batches.emptyBatches")}</div>
        </div>
      </div>
    </div>
  );
}
