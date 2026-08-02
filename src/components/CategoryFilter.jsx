import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { medicationApi } from "../services/pharmacist";

export default function CategoryFilter({ onFilterChange }) {
  const { t } = useTranslation();

  const [categories, setCategories] = useState([]);
  const [titles, setTitles] = useState([]);
  const [usages, setUsages] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [selectedUsage, setSelectedUsage] = useState(null);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [loadingUsages, setLoadingUsages] = useState(false);

  useEffect(() => {
    medicationApi
      .getCategories()
      .then((res) => setCategories(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setTitles([]);
      setUsages([]);
      setSelectedTitle(null);
      setSelectedUsage(null);
      return;
    }

    setLoadingTitles(true);
    setTitles([]);
    setSelectedTitle(null);
    setUsages([]);
    setSelectedUsage(null);

    medicationApi
      .getTitlesForCategory(selectedCategory.id)
      .then((res) => setTitles(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingTitles(false));
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedTitle) {
      setUsages([]);
      setSelectedUsage(null);
      return;
    }

    setLoadingUsages(true);
    setUsages([]);
    setSelectedUsage(null);

    medicationApi
      .getUsagesForTitle(selectedTitle.id)
      .then((res) => setUsages(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingUsages(false));
  }, [selectedTitle]);

  useEffect(() => {
    onFilterChange?.({
      category: selectedCategory?.name ?? "",
      title: selectedTitle?.name ?? "",
      usage: selectedUsage?.name ?? "",
    });
  }, [selectedCategory, selectedTitle, selectedUsage, onFilterChange]);

  const selectClass =
    "bg-surface-container/50 px-3 py-1.5 rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all border border-surface-container-high/50 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-2.5">
      <select
        value={selectedCategory?.id ?? ""}
        onChange={(e) => {
          const cat = categories.find((c) => c.id === e.target.value);
          setSelectedCategory(cat || null);
        }}
        disabled={loadingCategories}
        className={`${selectClass} max-w-[160px]`}
      >
        <option value="">{t("filters.allCategories")}</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        value={selectedTitle?.id ?? ""}
        onChange={(e) => {
          const title = titles.find((t) => t.id === e.target.value);
          setSelectedTitle(title || null);
        }}
        disabled={!selectedCategory || loadingTitles}
        className={`${selectClass} max-w-[160px]`}
      >
        <option value="">{t("filters.allTitles")}</option>
        {titles.map((title) => (
          <option key={title.id} value={title.id}>
            {title.name}
          </option>
        ))}
      </select>

      <select
        value={selectedUsage?.id ?? ""}
        onChange={(e) => {
          const usage = usages.find((u) => u.id === e.target.value);
          setSelectedUsage(usage || null);
        }}
        disabled={!selectedTitle || loadingUsages}
        className={`${selectClass} max-w-[160px]`}
      >
        <option value="">{t("filters.allUsages")}</option>
        {usages.map((usage) => (
          <option key={usage.id} value={usage.id}>
            {usage.name}
          </option>
        ))}
      </select>
    </div>
  );
}
