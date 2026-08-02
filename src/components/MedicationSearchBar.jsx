import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function MedicationSearchBar({ onSearch, searching }) {
  const { t } = useTranslation();
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchIngredient, setSearchIngredient] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchName, searchCompany, searchIngredient);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2.5 flex-1">
      <input
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        placeholder={t("medications.searchName")}
        className="flex-1 max-w-[170px] bg-surface-container/50 px-3.5 py-1.5 rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant/50 border border-surface-container-high/50"
      />
      <input
        value={searchCompany}
        onChange={(e) => setSearchCompany(e.target.value)}
        placeholder={t("medications.searchCompany")}
        className="flex-1 max-w-[170px] bg-surface-container/50 px-3.5 py-1.5 rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant/50 border border-surface-container-high/50"
      />
      <input
        value={searchIngredient}
        onChange={(e) => setSearchIngredient(e.target.value)}
        placeholder={t("medications.searchActiveIngredient")}
        className="flex-1 max-w-[190px] bg-surface-container/50 px-3.5 py-1.5 rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant/50 border border-surface-container-high/50"
      />
      <button
        type="submit"
        disabled={searching}
        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-dim text-on-primary text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {searching ? (
          <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined text-sm">search</span>
        )}
        <span className="hidden sm:inline">{t("pharmacySearch.search")}</span>
      </button>
    </form>
  );
}
