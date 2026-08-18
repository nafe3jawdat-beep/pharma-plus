import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotificationCount } from "../../contexts/NotificationContext";
import toast from "react-hot-toast";
import { medicationApi, stockApi } from "../../services/pharmacist";
import MedicationSearchBar from "../../components/MedicationSearchBar";
import CategoryFilter from "../../components/CategoryFilter";
import MedicationList from "./MedicationList";
import BulkActionBar from "./BulkActionBar";

export default function MedicationsPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const { unreadCount } = useNotificationCount();
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentUsage, setCurrentUsage] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === medications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(medications.map(m => m.id));
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedPharmacy?.id) { toast.error(t("errors.noPharmacySelected")); return; }
    setSubmitting(true);
    const items = selectedIds.map((id) => ({
      medication_id: id,
      stock: 0,
      min_stock: 0,
      price: 0,
    }));
    try {
      const res = await stockApi.bulkAddItems(selectedPharmacy.id, items);
      const count = res?.data?.length ?? 0;
      const skipped = res?.skipped?.length ?? 0;
      setSubmitting(false);
      setSelectedIds([]);
      if (count > 0) {
        toast.success(t("medications.addedToInventory", { count }));
      }
      if (skipped > 0) {
        toast(t("medications.someSkipped", { count: skipped }), { icon: "⚠️" });
      }
      if (count === 0 && skipped === 0) {
        toast.error(t("medications.addFailed"));
      }
    } catch {
      setSubmitting(false);
      toast.error(t("medications.addFailed"));
    }
  };

  const fetchMedications = async (name, company, ingredient, category, title, usage, p, append = false) => {
    if (append) { setLoadingMore(true); } else { setLoading(true); }
    try {
      const params = { page: p };
      if (name.trim()) params.name = name.trim();
      if (company.trim()) params.company = company.trim();
      if (ingredient.trim()) params.active_ingredient = ingredient.trim();
      if (category) params.category = category;
      if (title) params.title = title;
      if (usage) params.usage = usage;
      const json = await medicationApi.fetchAll(params);
      const items = json?.data ?? [];
      if (append) { setMedications(prev => [...prev, ...items]); } else { setMedications(items); }
      const meta = json?.meta;
      if (meta) { setHasMore(meta.current_page < meta.last_page); } else { setHasMore(items.length === 15); }
      setLoaded(true);
    } catch {
      setMedications([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications("", "", "", "", "", "", 1); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const handleSearch = (name, company, ingredient) => {
    setCurrentName(name);
    setCurrentCompany(company);
    setCurrentIngredient(ingredient);
    setSearched(true);
    setPage(1);
    fetchMedications(name, company, ingredient, currentCategory, currentTitle, currentUsage, 1);
  };

  const handleFilterChange = useCallback((filters) => {
    setCurrentCategory(filters.category);
    setCurrentTitle(filters.title);
    setCurrentUsage(filters.usage);
    setPage(1);
    fetchMedications(currentName, currentCompany, currentIngredient, filters.category, filters.title, filters.usage, 1);
  }, [currentName, currentCompany, currentIngredient]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchMedications(currentName, currentCompany, currentIngredient, currentCategory, currentTitle, currentUsage, next, true);
  };

  const handleRegisterRedirect = () => {
    navigate("/Dashboard/AddDrugPage", {
      state: { prefill: { name: currentName, activeIngredient: currentIngredient, manufacturer: currentCompany } }
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10">
          <header className="sticky top-0 z-50 bg-surface/70 backdrop-blur-xl border-b border-surface-container-high">
            <div className="flex items-center justify-between px-8 py-3">
              <div className="flex-1 flex items-center gap-4">
                <MedicationSearchBar onSearch={handleSearch} searching={loading} />
              </div>
              <div className="flex items-center gap-1">
                <Link to="/Dashboard/Notifications" className="relative p-2.5 hover:bg-primary-container/20 transition-all rounded-xl">
                  <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-surface" />
                  )}
                </Link>
              </div>
            </div>
            <div className="px-8 pb-3">
              <CategoryFilter onFilterChange={handleFilterChange} />
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-8 py-10 pb-32">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-on-primary text-lg">medication</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t("medications.title")}</h1>
                  <p className="text-sm text-on-surface-variant">{t("medications.description")}</p>
                </div>
              </div>
              {loaded && medications.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-on-surface-variant/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {t("medications.count", { count: medications.length })}
                  </span>
                  {selectedIds.length > 0 && (
                    <>
                      <span className="w-0.5 h-3 bg-outline-variant/30 rounded-full" />
                      <span className="flex items-center gap-1.5 text-primary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {t("medications.nSelected", { count: selectedIds.length })}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {initialLoading && (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-primary/40 animate-spin">refresh</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant font-medium">{t("app.loading")}</p>
              </div>
            )}

            {!initialLoading && loaded && medications.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6 border border-amber-200 dark:border-amber-800/30">
                  <span className="material-symbols-outlined text-4xl text-amber-400" style={{ fontVariationSettings: "'wght' 300" }}>pill_off</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  {searched ? t("medications.notFoundTitle") : t("medications.emptyTitle")}
                </h3>
                <p className="text-on-surface-variant/70 text-sm max-w-md text-center mb-8">
                  {searched ? t("medications.notFoundHint") : t("medications.emptyHint")}
                </p>
                {searched && (
                  <button
                    onClick={handleRegisterRedirect}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                    {t("drugs.registerNew")}
                  </button>
                )}
              </div>
            )}

            {!initialLoading && loading && medications.length === 0 && (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                  <p className="text-sm text-on-surface-variant">{t("app.loading")}</p>
                </div>
              </div>
            )}

            {medications.length > 0 && (
              <MedicationList
                medications={medications}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                selectAll={selectAll}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                t={t}
              />
            )}
          </div>
        </div>

        {selectedPharmacy && selectedIds.length > 0 && (
          <BulkActionBar
            count={selectedIds.length}
            submitting={submitting}
            onBulkAdd={handleBulkAdd}
            onClear={() => setSelectedIds([])}
          />
        )}

      </div>
    </div>
  );
}
