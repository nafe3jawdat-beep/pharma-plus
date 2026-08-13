export default function InventoryList({
  selectedItem, setSelectedItem, setBatches,
  filteredInventory, isLoading, isLoadingMore, hasMore, sentinelRef,
  batches, isLoadingBatches, batchMeta,
  setShowCreateModal, setCreateForm, openEditModal,
  setDeleteConfirm, t,
}) {
  return (
    <div className="xl:col-span-8 bg-surface-container/40 rounded-3xl border border-surface-container-high overflow-hidden flex flex-col">
      <div className="px-7 py-5 border-b border-surface-container-high">
        <h3 className="text-sm font-bold text-on-surface">{selectedItem ? t("batches.batchesFor", { name: selectedItem.medication?.trade_name || '...' }) : t("batches.selectItem")}</h3>
      </div>

      {isLoading && filteredInventory.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
            <p className="text-sm text-on-surface-variant">{t("app.loading")}</p>
          </div>
        </div>
      ) : !selectedItem ? (
        <div className="divide-y divide-surface-container-high">
          {filteredInventory.map((item) => (
            <button
              key={item.id}
              onClick={() => { setSelectedItem(item); }}
              className="w-full flex items-center gap-4 px-7 py-4 hover:bg-surface-container/30 transition-colors text-start"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">medication</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-on-surface truncate block">{item.medication?.trade_name || "Unknown"}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-on-surface-variant/60">{item.medication?.form || ''}</span>
                  {item.medication?.barcode && <span className="text-[10px] text-on-surface-variant/30">Code: {item.medication.barcode}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tabular-nums ${(item.stock || 0) <= (item.min_stock || 0) && (item.stock || 0) > 0 ? 'text-rose-500' : 'text-primary'}`}>{item.stock || 0}</span>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">chevron_right</span>
              </div>
            </button>
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                  {t("app.loadingMore")}
                </div>
              )}
            </div>
          )}
          {filteredInventory.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 px-8">
              <div className="w-16 h-16 rounded-full bg-surface-container/50 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40" style={{ fontVariationSettings: "'wght' 300" }}>inventory_2</span>
              </div>
              <p className="text-on-surface-variant font-medium mb-1">{t("batches.noInventoryItems")}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="px-7 py-3 border-b border-surface-container-high flex items-center gap-3">
            <button onClick={() => { setSelectedItem(null); setBatches([]); }} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">arrow_back</span>
            </button>
            <span className="text-sm text-on-surface-variant">{selectedItem.medication?.trade_name}</span>
            <button onClick={() => { setShowCreateModal(true); setCreateForm({ quantity: '', wholesale_price: '', expiration_date: '' }); }} className="ml-auto px-5 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">add</span>
              {t("batches.createBatch")}
            </button>
          </div>

          {isLoadingBatches ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">refresh</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-14 h-14 rounded-full bg-surface-container/50 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant/40" style={{ fontVariationSettings: "'wght' 300" }}>science</span>
              </div>
              <p className="text-on-surface-variant font-medium mb-1">{t("batches.noBatches")}</p>
              <p className="text-on-surface-variant/60 text-sm">{t("batches.noBatchesHint")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container/60 border-b border-surface-container-high">
                    <th className="px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("batches.batchNumber")}</th>
                    <th className="px-5 py-3.5 text-end text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("batches.quantity")}</th>
                    <th className="px-5 py-3.5 text-end text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("batches.wholesalePrice")}</th>
                    <th className="px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("batches.expirationDate")}</th>
                    <th className="px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("batches.createdAt")}</th>
                    <th className="px-5 py-3.5 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {batches.map((batch) => {
                    const isExpired = batch.expiration_date && new Date(batch.expiration_date) < new Date();
                    const isExpiringSoon = batch.expiration_date && !isExpired && (new Date(batch.expiration_date) - new Date()) <= 30 * 24 * 60 * 60 * 1000;
                    return (
                      <tr key={batch.id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-on-surface">{batch.batch_number}</span>
                            {batch.pending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 whitespace-nowrap">
                                {t("batches.pending")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <span className={`font-bold tabular-nums ${batch.quantity <= 0 ? 'text-rose-500' : 'text-on-surface'}`}>{batch.quantity}</span>
                        </td>
                        <td className="px-5 py-4 text-end font-bold text-on-surface tabular-nums">{batch.wholesale_price}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-on-surface-variant'}`}>
                            {(isExpired || isExpiringSoon) && <span className="material-symbols-outlined text-sm">{isExpired ? 'error' : 'schedule'}</span>}
                            {batch.expiration_date}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant text-xs">
                          {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(batch)}
                              disabled={batch.pending}
                              className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              title={batch.pending ? t("batches.pending") : t("app.edit")}
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(batch)}
                              disabled={batch.pending || batch.quantity > 0}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-on-surface-variant hover:text-rose-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              title={batch.pending || batch.quantity > 0 ? t("batches.cannotDelete") : t("app.delete")}
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {batchMeta && batchMeta.last_page > 1 && (
                <div className="px-5 py-3 text-xs text-on-surface-variant/60 border-t border-surface-container-high text-center">
                  {t("batches.showingBatches", { total: batchMeta.total })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
