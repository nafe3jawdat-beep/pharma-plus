import { Link } from "react-router-dom";

export default function DrugSearchResults({ results, searching, searched, searchingMore, hasMore, onLoadMore, setActiveOption, t }) {
  if (!searched && !searching) {
    return (
      <div className="bg-surface-container/40 rounded-3xl border border-surface-container-high overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-primary/60" style={{ fontVariationSettings: "'wght' 300" }}>database_search</span>
          </div>
          <p className="text-on-surface-variant text-lg font-medium mb-1">{t("drugs.searchEmptyTitle")}</p>
          <p className="text-on-surface-variant/60 text-sm max-w-md text-center">
            {t("drugs.searchEmptyHint")}
          </p>
        </div>
      </div>
    );
  }

  if (searching) {
    return (
      <div className="bg-surface-container/40 rounded-3xl border border-surface-container-high overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
            <p className="text-sm text-on-surface-variant">{t("drugs.searching")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-surface-container/40 rounded-3xl border border-surface-container-high overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6 border border-amber-200">
            <span className="material-symbols-outlined text-4xl text-amber-400" style={{ fontVariationSettings: "'wght' 300" }}>pill_off</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">{t("drugs.notFoundTitle")}</h3>
          <p className="text-on-surface-variant text-sm max-w-md text-center mb-8">
            {t("drugs.notFoundHint")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => setActiveOption("proposal")}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">how_to_reg</span>
              {t("drugs.submitForReview")}
            </button>
            <button onClick={() => setActiveOption("quick")}
              className="px-8 py-3.5 rounded-full bg-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-higher transition-all flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">bolt</span>
              {t("drugs.quickAdd")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container/40 rounded-3xl border border-surface-container-high overflow-hidden">
      <div className="px-8 py-4 bg-surface-container/20 border-b border-surface-container-high flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">checklist</span>
          <p className="text-sm font-medium text-on-surface">
            {t("drugs.matchCount", { count: results.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveOption("proposal")}
            className="text-xs font-bold text-primary hover:text-primary-dim transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">how_to_reg</span>
            {t("drugs.submitForReview")}
          </button>
          <span className="text-outline-variant/30">|</span>
          <button onClick={() => setActiveOption("quick")}
            className="text-xs font-bold text-primary hover:text-primary-dim transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">bolt</span>
            {t("drugs.quickAdd")}
          </button>
        </div>
      </div>

      <div className="divide-y divide-surface-container-high">
        {results.map((med) => (
          <div key={med.id} className="flex items-center gap-5 px-8 py-5 hover:bg-surface-container/20 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl text-primary">medication</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <p className="font-bold text-on-surface truncate">{med.trade_name}</p>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{t("drugs.exists")}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {med.manufacture?.name && (
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">domain</span>
                    {med.manufacture.name}
                  </span>
                )}
                {med.form && (
                  <span className="text-xs text-on-surface-variant/60">{med.form}</span>
                )}
              </div>
              {med.active_ingredients?.length > 0 && (
                <p className="text-xs text-on-surface-variant/50 mt-1 truncate">
                  {med.active_ingredients.map(a => a.ingredient_name_en).join(", ")}
                </p>
              )}
            </div>
            <Link to="/Dashboard/StockManagement"
              className="px-5 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              {t("drugs.addToInventory")}
            </Link>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-5 border-t border-surface-container-high">
          <button onClick={onLoadMore} disabled={searchingMore}
            className="px-8 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-all disabled:opacity-50 flex items-center gap-2">
            {searchingMore && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
            {searchingMore ? t("app.loading") : t("drugs.loadMore")}
          </button>
        </div>
      )}

      {!hasMore && results.length > 0 && (
        <div className="flex justify-center py-4 border-t border-surface-container-high">
          <p className="text-xs text-on-surface-variant/60 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {t("drugs.allLoaded")}
          </p>
        </div>
      )}
    </div>
  );
}
