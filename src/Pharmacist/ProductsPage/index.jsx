import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { productApi } from "../../services/pharmacist";
import ProductDrawer from "./ProductDrawer";

const TYPE_BADGE = {
  cosmetic: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  medical_device: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  supplement: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  other: "bg-surface-container-high text-on-surface-variant",
};

export default function ProductsPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async (p = 1, append = false) => {
    if (!selectedPharmacy?.id) return;
    if (append) { setLoadingMore(true); } else { setLoading(true); setError(false); }
    try {
      const params = { page: p };
      if (search.trim()) params.name = search.trim();
      const json = await productApi.list(selectedPharmacy.id, params);
      const items = json?.data ?? [];
      if (append) {
        setProducts((prev) => [...prev, ...items]);
      } else {
        setProducts(items);
      }
      const meta = json?.meta;
      if (meta) {
        setHasMore(meta.current_page < meta.last_page);
      } else {
        setHasMore(items.length === 15);
      }
    } catch {
      if (!append) { setProducts([]); setError(true); }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy?.id]);

  const stats = useMemo(() => {
    if (!products.length) return null;
    const types = {};
    products.forEach((p) => {
      const type = p.type || "other";
      types[type] = (types[type] || 0) + 1;
    });
    return { total: products.length, types };
  }, [products]);

  const q = search.trim().toLowerCase();
  const visibleProducts = q
    ? products.filter((p) =>
        [p.name, p.barcode, p.type].some(
          (v) => v && String(v).toLowerCase().includes(q)
        )
      )
    : products;

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setDrawerOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setDrawerOpen(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(t("products.confirmDelete", { name: product.name }))) return;
    try {
      await productApi.remove(selectedPharmacy.id, product.id);
      toast.success(t("products.deleted"));
      fetchProducts(1);
    } catch {
      toast.error(t("products.deleteFailed"));
    }
  };

  const handleSaved = () => {
    setDrawerOpen(false);
    setEditingProduct(null);
    fetchProducts(1);
  };

  const statCards = [
    {
      key: "total",
      label: t("products.statTotal"),
      value: String(stats?.total ?? 0),
      icon: "inventory_2",
      iconClass: "bg-primary-container/60 text-primary-dim",
    },
    {
      key: "cosmetic",
      label: t("products.statCosmetic"),
      value: String(stats?.types?.cosmetic ?? 0),
      icon: "face",
      iconClass: "bg-pink-100 text-pink-700",
    },
    {
      key: "medical_device",
      label: t("products.statMedicalDevice"),
      value: String(stats?.types?.medical_device ?? 0),
      icon: "medical_services",
      iconClass: "bg-sky-100 text-sky-700",
    },
    {
      key: "supplement",
      label: t("products.statSupplement"),
      value: String(stats?.types?.supplement ?? 0),
      icon: "spa",
      iconClass: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{t("products.title")}</h1>
            <p className="text-base text-on-surface-variant">{t("products.description")}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchProducts(1)}
              title={t("app.refresh")}
              className="w-10 h-10 rounded-full bg-surface-container-lowest border border-surface-container-high text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
            <button
              onClick={openAdd}
              className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t("products.addProduct")}
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.key} className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-4 flex items-center gap-3.5 shadow-ambient-sm">
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${stat.iconClass}`}>
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold truncate">{stat.label}</p>
                  <p className="text-2xl font-extrabold tabular-nums truncate">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex-1 lg:max-w-md">
          <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder={t("products.searchPlaceholder")}
            className="w-full bg-surface-container-lowest text-on-surface ps-10 pe-9 py-2.5 rounded-xl border border-surface-container-high focus:ring-2 focus:ring-primary outline-none text-sm transition-all placeholder:text-on-surface-variant/60"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-ambient-sm overflow-hidden">
          {loading ? (
            <div className="p-6 flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-rose-600">{t("products.loadError")}</div>
          ) : visibleProducts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-surface-container-high mb-4">
                <span className="material-symbols-outlined text-on-surface-variant/60 text-3xl">{q ? "search_off" : "inventory_2"}</span>
              </div>
              <p className="text-on-surface font-semibold">{q ? t("products.noSearchResults") : t("products.noProducts")}</p>
              {!q && <p className="text-on-surface-variant text-sm mt-1">{t("products.noProductsHint")}</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container-high text-[11px] uppercase tracking-widest text-on-surface-variant/60 font-bold">
                    <th className="px-4 py-3.5 text-start">{t("products.name")}</th>
                    <th className="px-4 py-3.5 text-start">{t("products.barcode")}</th>
                    <th className="px-4 py-3.5 text-start">{t("products.type")}</th>
                    <th className="px-4 py-3.5 text-end">{t("app.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {visibleProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-surface-container-low/70 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-medium">{product.name || "—"}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-on-surface-variant font-mono">
                        {product.barcode || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        {product.type ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${TYPE_BADGE[product.type] || TYPE_BADGE.other}`}>
                            {product.type.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/40 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-end">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all"
                            title={t("app.edit")}
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 rounded-xl hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-all"
                            title={t("app.delete")}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && hasMore && visibleProducts.length > 0 && (
            <div className="p-4 text-center border-t border-surface-container-high">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-5 py-2 rounded-full text-sm font-bold text-primary hover:bg-primary-container/30 transition-all disabled:opacity-50"
              >
                {loadingMore ? t("app.loading") : t("app.loadMore")}
              </button>
            </div>
          )}
        </div>
      </main>

      {drawerOpen && (
        <ProductDrawer
          pharmacyId={selectedPharmacy.id}
          editingProduct={editingProduct}
          onClose={() => { setDrawerOpen(false); setEditingProduct(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
