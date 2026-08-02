import { useState, useEffect } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotificationCount } from "../../contexts/NotificationContext";
import MedicationSearchBar from "../../components/MedicationSearchBar";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { proposalsApi, pharmacyMedicationApi } from "../../services/pharmacist";
import DrugSearchResults from "./DrugSearchResults";
import ProposalForm from "./ProposalForm";
import QuickAddForm from "./QuickAddForm";

export default function AddDrugPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const { unreadCount } = useNotificationCount();
  const location = useLocation();

  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchingMore, setSearchingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentIngredient, setCurrentIngredient] = useState("");

  const [activeOption, setActiveOption] = useState(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const prefill = location.state?.prefill;
    if (prefill) {
      setActiveOption("quick");
      window.history.replaceState({}, "");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const search = async (name, company, ingredient, p, append = false) => {
    if (!name.trim() && !company.trim() && !ingredient.trim()) return;
    setSearched(true);
    setActiveOption(null);
    if (append) { setSearchingMore(true); } else { setSearching(true); setResults([]); }
    try {
      const params = { page: p };
      if (name.trim()) params.name = name.trim();
      if (company.trim()) params.company = company.trim();
      if (ingredient.trim()) params.active_ingredient = ingredient.trim();
      const json = await api("GET", "/api/v1/medications", { params });
      const items = json?.data ?? [];
      if (append) { setResults(prev => [...prev, ...items]); } else { setResults(items); }
      const meta = json?.meta;
      if (meta) { setHasMore(meta.current_page < meta.last_page); } else { setHasMore(items.length === 15); }
    } catch {
      toast.error(t("drugs.searchFailed"));
    } finally { setSearching(false); setSearchingMore(false); }
  };

  const handleSearch = (name, company, ingredient) => { setCurrentName(name); setCurrentCompany(company); setCurrentIngredient(ingredient); setPage(1); search(name, company, ingredient, 1); };
  const loadMore = () => { const next = page + 1; setPage(next); search(currentName, currentCompany, currentIngredient, next, true); };

  const handleProposalSubmit = async (formData) => {
    await proposalsApi.create(formData);
    toast.success(t("drugs.proposalSubmitted"));
    setActiveOption(null);
  };

  const handleQuickSubmit = async (data) => {
    if (!selectedPharmacy?.id) { toast.error(t("errors.noPharmacySelected")); return; }
    await pharmacyMedicationApi.create(selectedPharmacy.id, data);
    toast.success(t("drugs.quickAddSuccess"));
  };

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <header className="bg-surface/80 backdrop-blur-2xl sticky top-0 border-b border-surface-container-high flex items-center w-full px-8 py-2.5 z-50 gap-3">
        <MedicationSearchBar onSearch={handleSearch} searching={searching} />
        <Link to="/Dashboard/Notifications" className="relative p-2 hover:bg-primary-container/20 transition-all rounded-full shrink-0">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />}
        </Link>
      </header>

      <div className="max-w-6xl mx-auto w-full px-8 py-10 pb-32">
        <div className="mb-12 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/30 text-primary text-[11px] tracking-[0.05em] uppercase font-bold mb-4">
            <span className="material-symbols-outlined text-sm">database</span>
            {t("drugs.centralDbEntry")}
          </span>
          <h1 className="text-[3.25rem] leading-[1.1] tracking-[-0.02em] text-on-surface font-light mb-3">
            {t("drugs.globalDrugSubmission")}
          </h1>
          <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
            {t("drugs.searchDescription")}
          </p>
        </div>

        {!activeOption && (
          <DrugSearchResults
            results={results}
            searching={searching}
            searched={searched}
            searchingMore={searchingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            setActiveOption={setActiveOption}
            t={t}
          />
        )}

        {activeOption === "proposal" && (
          <ProposalForm
            onSubmit={handleProposalSubmit}
            onCancel={() => setActiveOption(null)}
          />
        )}

        {activeOption === "quick" && (
          <QuickAddForm
            selectedPharmacy={selectedPharmacy}
            onSubmit={handleQuickSubmit}
            onCancel={() => setActiveOption(null)}
          />
        )}
      </div>
    </div>
  );
}
