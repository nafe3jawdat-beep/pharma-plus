export default function MedicationList({ medications, selectedIds, toggleSelect, selectAll, loadingMore, hasMore, onLoadMore, t }) {
  return (
    <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high overflow-hidden">
      <div className="px-6 py-3.5 bg-surface-container/60 border-b border-surface-container-high flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center justify-center w-5 h-5 cursor-pointer">
            <input type="checkbox"
              checked={selectedIds.length === medications.length}
              onChange={selectAll}
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 focus:ring-offset-0 transition-all cursor-pointer" />
          </label>
          <span className="text-xs font-medium text-on-surface-variant">{t("medications.selectAll")}</span>
        </div>
        {selectedIds.length > 0 && (
          <span className="text-xs font-bold text-primary bg-primary-container/30 px-3 py-1 rounded-full">
            {t("medications.nSelected", { count: selectedIds.length })}
          </span>
        )}
      </div>

      <div className="divide-y divide-surface-container-high">
        {medications.map((med) => {
          const isSelected = selectedIds.includes(med.id);
          return (
            <div key={med.id}
              onClick={() => toggleSelect(med.id)}
              className={`flex items-start gap-4 px-6 py-4.5 transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-primary-container/[0.06]"
                  : "hover:bg-surface-container/30"
              }`}
            >
              <label className="flex items-center justify-center w-5 h-5 mt-1 cursor-pointer flex-shrink-0"
                onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(med.id)}
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 focus:ring-offset-0 transition-all cursor-pointer" />
              </label>

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/[0.07] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl text-primary/70">medication</span>
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="font-semibold text-sm text-on-surface truncate max-w-[280px]">{med.trade_name}</p>
                  {med.form && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container-high text-on-surface-variant/70 uppercase tracking-wide">
                      {med.form}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {med.manufacture?.name && (
                    <span className="text-[11px] text-on-surface-variant/60 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">domain</span>
                      {med.manufacture.name}
                    </span>
                  )}
                </div>
                {med.active_ingredients?.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="material-symbols-outlined text-[12px] text-on-surface-variant/30">science</span>
                    {med.active_ingredients.map((a, i) => (
                      <span key={i}
                        className="text-[11px] text-on-surface-variant/50 bg-surface-container-high/50 px-2 py-0.5 rounded-md">
                        {a.ingredient_name_en}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center py-5 border-t border-surface-container-high bg-surface-container/20">
          <button onClick={onLoadMore} disabled={loadingMore}
            className="px-8 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold text-xs hover:bg-surface-container-higher transition-all disabled:opacity-40 flex items-center gap-2.5">
            {loadingMore && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
            {loadingMore ? t("app.loading") : (
              <>
                {t("medications.loadMore")}
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </>
            )}
          </button>
        </div>
      )}

      {!hasMore && medications.length > 0 && (
        <div className="flex justify-center py-4 border-t border-surface-container-high bg-surface-container/20">
          <p className="text-[11px] text-on-surface-variant/40 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {t("medications.allLoaded")}
          </p>
        </div>
      )}
    </div>
  );
}
