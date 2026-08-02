import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { pharmacySearchApi } from "../services/pharmacist";
import { employeeService } from "../services/pharmacist";

export default function PharmacySearchPage() {
  const { refreshPharmacies } = useOutletContext();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestedIds, setRequestedIds] = useState(new Set());
  const [requestingId, setRequestingId] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());

  const handleSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await pharmacySearchApi.search(q);
      const data = res?.data?.data ?? res?.data ?? [];
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
      toast.error(t("pharmacySearch.error"));
    } finally {
      setSearching(false);
    }
  };

  const handleJoinRequest = async (pharmacyId) => {
    setRequestingId(pharmacyId);
    try {
      await employeeService.joinRequest(pharmacyId);
      setRequestedIds((prev) => new Set(prev).add(pharmacyId));
      toast.success(t("pharmacySearch.requestSuccess"));
      refreshPharmacies();
    } catch (err) {
      toast.error(err.response?.data?.message || t("pharmacySearch.requestFailed"));
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative min-h-full">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-8 py-10 pb-32">
          <div className="mb-10">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-lg">search</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t("pharmacySearch.title")}</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">{t("pharmacySearch.subtitle")}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex items-center gap-3 bg-surface-container-lowest border border-surface-container-high rounded-2xl px-4 py-1 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("pharmacySearch.searchPlaceholder")}
                className="flex-1 bg-transparent border-none outline-none py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/50"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); setResults(null); setSearched(false); }} className="p-1 rounded-full hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">close</span>
                </button>
              )}
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-dim transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {searching && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                {t("pharmacySearch.search")}
              </button>
            </div>
          </form>

          {searching && (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl mb-3">refresh</span>
              <p className="text-sm text-on-surface-variant">{t("pharmacySearch.searching")}</p>
            </div>
          )}

          {!searching && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">search_off</span>
              </div>
              <p className="text-base font-semibold text-on-surface mb-1">{t("pharmacySearch.noResults")}</p>
              <p className="text-sm text-on-surface-variant">{t("pharmacySearch.noResultsDesc")}</p>
            </div>
          )}

          {!searching && searched && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {results.map((pharmacy) => {
                const isRequested = requestedIds.has(pharmacy.id);
                const isLoading = requestingId === pharmacy.id;
                const imgFailed = failedImages.has(pharmacy.id);
                const imgSrc = !imgFailed ? (pharmacy.front_image || null) : null;
                return (
                  <div
                    key={pharmacy.id}
                    className="group bg-surface-container-lowest border border-surface-container-high rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {imgSrc && (
                      <div className="relative h-40 bg-surface-container-high overflow-hidden">
                        <img
                          src={imgSrc}
                          alt={pharmacy.name}
                          onError={() => setFailedImages(prev => new Set(prev).add(pharmacy.id))}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-lg font-bold text-white drop-shadow-sm">{pharmacy.name}</h3>
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      {!imgSrc && (
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">store</span>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-on-surface">{pharmacy.name}</h3>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2.5 mb-5">
                        {pharmacy.address && (
                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 mt-0.5 flex-shrink-0">location_on</span>
                            <p className="text-sm text-on-surface-variant leading-relaxed">{pharmacy.address}</p>
                          </div>
                        )}
                        {pharmacy.support_number && (
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 flex-shrink-0">call</span>
                            <p className="text-sm text-on-surface-variant" dir="ltr">{pharmacy.support_number}</p>
                          </div>
                        )}
                        {pharmacy.support_email && (
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 flex-shrink-0">mail</span>
                            <p className="text-sm text-on-surface-variant truncate">{pharmacy.support_email}</p>
                          </div>
                        )}
                        {pharmacy.staff_count !== undefined && (
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 flex-shrink-0">group</span>
                            <p className="text-sm text-on-surface-variant">{pharmacy.staff_count} staff</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleJoinRequest(pharmacy.id)}
                        disabled={isRequested || isLoading}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          isRequested
                            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 cursor-default"
                            : "bg-primary text-on-primary hover:bg-primary-dim active:scale-[0.97] disabled:opacity-50"
                        }`}
                      >
                        {isLoading ? (
                          <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                        ) : isRequested ? (
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">person_add</span>
                        )}
                        {isRequested ? t("pharmacySearch.requestSent") : t("pharmacySearch.sendRequest")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!searching && !searched && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">search</span>
              </div>
              <p className="text-sm text-on-surface-variant text-center max-w-sm">{t("pharmacySearch.searchPrompt")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
