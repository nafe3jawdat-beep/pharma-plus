import { useCallback, useRef } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { useStockManagement } from './useStockManagement';
import { useTranslation } from 'react-i18next';
import { useNotificationCount } from '../contexts/NotificationContext';
import CategoryFilter from '../components/CategoryFilter';

const StockManagement = () => {
  const { t } = useTranslation();
  const { unreadCount } = useNotificationCount();
  const { selectedPharmacy } = useOutletContext();
  const { state: navState } = useLocation();
  const observerRef = useRef(null);
  const {
    isLoadingMeds, isLoadingMore, hasMore, loadMore,
    searchQuery, setSearchQuery,
    statusMessage,
    fileInputRef,
    groupedMedications,
    medications,
    handleCheckboxChange,
    handlePriceChange,
    selectedMedication,
    globalMinStock, setGlobalMinStock,
    updating,
    handleUpdateSelected,
    handleFileChange,
    dbOnlyResults,
    isSearchingDb,
    addingItemId,
    addToInventory,
    setCategoryFilter,
    setTitleFilter,
    setUsageFilter,
  } = useStockManagement(selectedPharmacy?.id, navState?.lowStock === true);

  const sentinelRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingMeds) {
        loadMore();
      }
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
  }, [loadMore, hasMore, isLoadingMore, isLoadingMeds]);

  const handleFilterChange = useCallback((filters) => {
    setCategoryFilter(filters.category);
    setTitleFilter(filters.title);
    setUsageFilter(filters.usage);
  }, [setCategoryFilter, setTitleFilter, setUsageFilter]);

  return (
    <div className="h-full overflow-y-auto bg-surface flex flex-col">
      <header className="bg-surface/80 backdrop-blur-2xl sticky top-0 border-b border-surface-container-high flex justify-between items-center w-full px-8 py-3 z-50">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-md group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-lg">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border-none py-2 pl-10 pr-4 rounded-full text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 shadow-sm transition-all outline-none"
              placeholder={t("stock.searchDb")}
            />
          </div>
          <CategoryFilter onFilterChange={handleFilterChange} />
        </div>
        <Link
          to="/Dashboard/Notifications"
          className="relative p-2 hover:bg-primary-container/20 transition-all rounded-full ml-4"
        >
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </Link>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-10 pb-32">
        {statusMessage.text && (
          <div className={`mb-8 px-5 py-4 rounded-2xl font-semibold text-sm flex items-center gap-3 border ${
            statusMessage.type === 'success' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' :
            statusMessage.type === 'error' ? 'bg-rose-50/80 border-rose-200 text-rose-800' : 'bg-blue-50/80 border-blue-200 text-blue-800'
          }`}>
            <span className="material-symbols-outlined text-lg">{statusMessage.type === 'success' ? 'check_circle' : statusMessage.type === 'error' ? 'error' : 'info'}</span>
            {statusMessage.text}
          </div>
        )}

        <div className="flex items-start justify-between mb-10">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/30 text-primary text-[11px] tracking-[0.05em] uppercase font-bold mb-4">
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              {selectedPharmacy?.name || t("stock.title")}
              {navState?.lowStock === true && (
                <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  {t("stock.lowStock")}
                </span>
              )}
            </span>
            <h1 className="text-[3.25rem] leading-[1.1] tracking-[-0.02em] text-on-surface font-light mb-3">{t("stock.title")}</h1>
            <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">{t("stock.description")}</p>
          </div>
          <button
            onClick={handleUpdateSelected}
            disabled={updating}
            className="px-7 py-3.5 rounded-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2.5 flex-shrink-0 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {updating ? (
              <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>update</span>
            )}
            {updating ? t("app.loading") : t("stock.updateSelected")}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 bg-surface-container/40 rounded-3xl border border-surface-container-high overflow-hidden flex flex-col">
            <div className="flex-1">
              {isLoadingMeds && medications.length === 0 ? (
                <div className="flex items-center justify-center py-24">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                    <p className="text-sm text-on-surface-variant">Loading medications...</p>
                  </div>
                </div>
              ) : Object.keys(groupedMedications).length > 0 ? (
                <div className="divide-y divide-surface-container-high">
                  {Object.keys(groupedMedications).map(() => (
                      <div>
                      <div className="divide-y divide-surface-container-high/50">
                        {groupedMedications.All.map((med) => {
                          const stockVal = med.stock || 0;
                          const minStockVal = med.min_stock || 0;
                          const isLow = med.is_low_stock ?? (stockVal <= minStockVal && stockVal > 0);
                          return (
                          <div key={med.id} className="flex items-center gap-4 px-7 py-4 hover:bg-surface-container/30 transition-colors group">
                            <label className="flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={med.checked}
                                onChange={() => handleCheckboxChange(med.id)}
                                className="w-4 h-4 rounded border-surface-container-high text-primary focus:ring-primary/30 bg-surface"
                              />
                            </label>
                            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-primary text-xl">medication</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-on-surface truncate">{med.medication?.trade_name || "Unknown"}</span>
                                {isLow && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex-shrink-0">Low</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-on-surface-variant/60">{med.medication?.form || ''}</span>
                                {med.medication?.barcode && <span className="text-[10px] text-on-surface-variant/30">Code: {med.medication.barcode}</span>}
                              </div>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`text-sm font-bold tabular-nums ${isLow ? 'text-rose-500' : 'text-primary'}`}>{stockVal}</span>
                                <span className="text-[11px] text-on-surface-variant/50">/ {minStockVal}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-20">
                                <div className="text-[10px] text-on-surface-variant/50 mb-1 uppercase tracking-wide">{t("stock.priceLabel")}</div>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={med.editPrice}
                                  onChange={(e) => handlePriceChange(med.id, e.target.value)}
                                  className="w-full bg-surface-container-lowest border border-surface-container-high rounded-xl px-2.5 py-2 text-sm text-on-surface text-end focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>

                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {hasMore && (
                    <div ref={sentinelRef} className="flex justify-center py-6">
                      {isLoadingMore && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                          Loading more...
                        </div>
                      )}
                    </div>
                  )}
                  {!hasMore && medications.length > 0 && (
                    <div className="flex justify-center py-5">
                      <p className="text-xs text-on-surface-variant/50 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {t("stock.allLoaded")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="w-16 h-16 rounded-full bg-surface-container/50 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/40" style={{ fontVariationSettings: "'wght' 300" }}>pill</span>
                  </div>
                  <p className="text-on-surface-variant font-medium mb-1">{t("stock.noMedications")}</p>
                  <p className="text-on-surface-variant/60 text-sm">Try adjusting your search or filter.</p>
                </div>
              )}

              {searchQuery.trim() && (isSearchingDb || dbOnlyResults.length > 0) && (
                <div className="border-t border-surface-container-high">
                  <div className="px-7 py-4 bg-surface-container/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">database_search</span>
                    <p className="text-sm font-semibold text-on-surface">{t("stock.dbResults")}</p>
                    {isSearchingDb && (
                      <span className="material-symbols-outlined text-sm text-on-surface-variant animate-spin ml-1">refresh</span>
                    )}
                  </div>
                  <div className="divide-y divide-surface-container-high/50">
                    {dbOnlyResults.map((med) => (
                      <div key={med.id} className="flex items-center gap-4 px-7 py-4 hover:bg-surface-container/30 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-xl">medication</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-on-surface truncate">{med.trade_name || "Unknown"}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">{t("stock.newLabel")}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {med.manufacture?.name && (
                              <span className="text-xs text-on-surface-variant/70">{med.manufacture.name}</span>
                            )}
                            {med.form && (
                              <span className="text-xs text-on-surface-variant/50">{med.form}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => addToInventory(med)}
                          disabled={addingItemId === med.id}
                          className="px-5 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {addingItemId === med.id ? (
                            <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">add</span>
                          )}
                          {addingItemId === med.id ? t("app.adding") : t("stock.addToInventory")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container/40 rounded-3xl border border-surface-container-high p-7">
              <div className="flex items-center gap-3 pb-5 border-b border-surface-container-high">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">{t("stock.importExcel")}</h2>
                  <p className="text-xs text-on-surface-variant">Bulk update stock via spreadsheet</p>
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
              <div
                onClick={() => fileInputRef.current.click()}
                className="mt-6 bg-surface-container/30 hover:bg-surface-container/60 transition-all rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed border-surface-container-high group"
              >
                <div className="w-14 h-14 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-primary">description</span>
                </div>
                <h3 className="font-bold text-on-surface text-sm mb-1">{t("stock.clickToUploadExcel")}</h3>
                <p className="text-xs text-on-surface-variant/60">.xlsx or .xls files</p>
              </div>
            </div>

            <div className="bg-surface-container/40 rounded-3xl border border-surface-container-high p-7 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600">bar_chart</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Summary</h3>
                  <p className="text-xs text-on-surface-variant">Quick inventory overview</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high">
                  <div className={`text-2xl font-bold text-on-surface tabular-nums`}>{medications.length}</div>
                  <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">{t("stock.totalItems")}</div>
                </div>
                {selectedMedication ? (
                  <div className="bg-surface-container-lowest rounded-xl p-4 border border-primary/30">
                    <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">{t("stock.lowStock")}</div>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        placeholder="10"
                        value={globalMinStock}
                        onChange={(e) => setGlobalMinStock(e.target.value)}
                        className="w-full bg-surface-container border border-surface-container-high rounded-lg px-2.5 py-1.5 text-2xl font-bold text-rose-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high">
                    <div className={`text-2xl font-bold text-rose-600 tabular-nums`}>{medications.filter(m => (m.is_low_stock ?? ((m.stock || 0) <= (m.min_stock || 0) && (m.stock || 0) > 0))).length}</div>
                    <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">{t("stock.lowStock")}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant/60 pt-2 border-t border-surface-container-high">
                <span>{t("stock.selected")}: {medications.filter(m => m.checked).length}</span>
                <span>{t("stock.pendingLabel")}: {medications.filter(m => parseInt(m.addedQty) > 0).length}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default StockManagement;
