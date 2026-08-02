import { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { stockApi, batchApi } from '../../services/pharmacist';
import toast from 'react-hot-toast';
import BatchModal from './BatchModal';
import BatchSummaryCard from './BatchSummaryCard';
import InventoryList from './InventoryList';

export default function BatchesPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const pharmacyId = selectedPharmacy?.id;
  const observerRef = useRef(null);

  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedItem, setSelectedItem] = useState(null);
  const [batches, setBatches] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [batchMeta, setBatchMeta] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [createForm, setCreateForm] = useState({ quantity: '', wholesale_price: '', expiration_date: '' });
  const [editForm, setEditForm] = useState({ quantity: '', wholesale_price: '', expiration_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchInventory = useCallback(async (pageNum, append = false) => {
    if (!pharmacyId) return;
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    try {
      const res = await stockApi.fetchInventory(pharmacyId, pageNum);
      const items = res?.data ?? [];
      if (append) {
        setInventory(prev => [...prev, ...items]);
      } else {
        setInventory(items);
      }
      const meta = res?.meta;
      setHasMore(meta ? meta.current_page < meta.last_page : items.length === 50);
    } catch {
      if (!append) setInventory([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pharmacyId]);

  const fetchBatches = useCallback(async (itemId) => {
    if (!pharmacyId || !itemId) return;
    setIsLoadingBatches(true);
    try {
      const res = await batchApi.list(pharmacyId, itemId);
      setBatches(res?.data ?? []);
      setBatchMeta(res?.meta ?? null);
    } catch {
      setBatches([]);
    } finally {
      setIsLoadingBatches(false);
    }
  }, [pharmacyId]);

  useEffect(() => {
    setInventory([]); // eslint-disable-line react-hooks/set-state-in-effect
    setPage(1);
    setHasMore(true);
    setSelectedItem(null);
    setBatches([]);
    if (pharmacyId) fetchInventory(1, false);
  }, [pharmacyId, fetchInventory]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchInventory(nextPage, true);
  }, [page, hasMore, isLoadingMore, isLoading, fetchInventory]);

  const sentinelRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) loadMore();
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
  }, [loadMore, hasMore, isLoadingMore, isLoading]);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    if (!pharmacyId || !selectedItem) return;
    setSubmitting(true);
    try {
      await batchApi.create(pharmacyId, selectedItem.id, {
        quantity: parseInt(createForm.quantity, 10),
        wholesale_price: parseFloat(createForm.wholesale_price),
        expiration_date: createForm.expiration_date,
      });
      toast.success(t("batches.batchCreated"));
      setShowCreateModal(false);
      setCreateForm({ quantity: '', wholesale_price: '', expiration_date: '' });
      fetchBatches(selectedItem.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("batches.createFailed"));
    } finally {
      setSubmitting(false);
    }
  }, [pharmacyId, selectedItem, createForm, t, fetchBatches]);

  const handleEdit = useCallback(async (e) => {
    e.preventDefault();
    if (!pharmacyId || !selectedItem || !editingBatch) return;
    setSubmitting(true);
    try {
      await batchApi.update(pharmacyId, selectedItem.id, editingBatch.id, {
        quantity: parseInt(editForm.quantity, 10),
        wholesale_price: parseFloat(editForm.wholesale_price),
        expiration_date: editForm.expiration_date,
      });
      toast.success(t("batches.batchUpdated"));
      setShowEditModal(false);
      setEditingBatch(null);
      setEditForm({ quantity: '', wholesale_price: '', expiration_date: '' });
      fetchBatches(selectedItem.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("batches.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  }, [pharmacyId, selectedItem, editingBatch, editForm, t, fetchBatches]);

  const handleDelete = useCallback(async (batch) => {
    if (!pharmacyId || !selectedItem) return;
    try {
      await batchApi.delete(pharmacyId, selectedItem.id, batch.id);
      toast.success(t("batches.batchDeleted"));
      setDeleteConfirm(null);
      fetchBatches(selectedItem.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("batches.deleteFailed"));
    }
  }, [pharmacyId, selectedItem, t, fetchBatches]);

  const openEditModal = useCallback((batch) => {
    setEditingBatch(batch);
    setEditForm({
      quantity: String(batch.quantity ?? ''),
      wholesale_price: String(batch.wholesale_price ?? ''),
      expiration_date: batch.expiration_date ?? '',
    });
    setShowEditModal(true);
  }, []);

  const filteredInventory = inventory.filter(item => {
    const name = item.medication?.trade_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleItemSelect = useCallback((item) => {
    setSelectedItem(item);
    fetchBatches(item.id);
  }, [fetchBatches]);

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
              placeholder={t("batches.searchInventory")}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-10 pb-32">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/30 text-primary text-[11px] tracking-[0.05em] uppercase font-bold mb-4">
            <span className="material-symbols-outlined text-sm">science</span>
            {selectedPharmacy?.name || t("batches.title")}
          </span>
          <h1 className="text-[3.25rem] leading-[1.1] tracking-[-0.02em] text-on-surface font-light mb-3">{t("batches.title")}</h1>
          <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">{t("batches.description")}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <InventoryList
            selectedItem={selectedItem}
            setSelectedItem={handleItemSelect}
            setBatches={setBatches}
            filteredInventory={filteredInventory}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            sentinelRef={sentinelRef}
            batches={batches}
            isLoadingBatches={isLoadingBatches}
            batchMeta={batchMeta}
            setShowCreateModal={setShowCreateModal}
            setCreateForm={setCreateForm}
            openEditModal={openEditModal}
            setDeleteConfirm={setDeleteConfirm}
            handleDelete={handleDelete}
            t={t}
          />

          <div className="xl:col-span-4 flex flex-col gap-6">
            <BatchSummaryCard batches={batches} t={t} />
          </div>
        </div>
      </main>

      {showCreateModal && (
        <BatchModal
          isEdit={false}
          form={createForm}
          setForm={setCreateForm}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
          submitting={submitting}
          t={t}
        />
      )}

      {showEditModal && (
        <BatchModal
          isEdit={true}
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleEdit}
          onClose={() => { setShowEditModal(false); setEditingBatch(null); }}
          submitting={submitting}
          t={t}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high shadow-2xl w-full max-w-sm p-7" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-rose-500 text-xl">delete</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{t("batches.deleteConfirm")}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{deleteConfirm.batch_number}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-5 py-3 rounded-full border border-surface-container-high text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all">{t("app.cancel")}</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-5 py-3 rounded-full bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-all">{t("app.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
