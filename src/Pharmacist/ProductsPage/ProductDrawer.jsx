import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { productApi } from "../../services/pharmacist";

const TYPE_OPTIONS = [
  { value: "cosmetic", label: "Cosmetic" },
  { value: "medical_device", label: "Medical Device" },
  { value: "supplement", label: "Supplement" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-transparent focus:border-surface-container-high focus:bg-surface-container-lowest outline-none text-sm transition-all";
const labelClass =
  "text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1 block";

function FieldTile({ label, children }) {
  return (
    <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5">
      <p className={labelClass}>{label}</p>
      {children}
    </div>
  );
}

export default function ProductDrawer({ pharmacyId, editingProduct, onClose, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", barcode: "", type: "cosmetic" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name || "",
        barcode: editingProduct.barcode || "",
        type: editingProduct.type || "cosmetic",
      });
    } else {
      setForm({ name: "", barcode: "", type: "cosmetic" });
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("products.nameRequired"));
      return;
    }
    if (!editingProduct && !form.barcode.trim()) {
      toast.error(t("products.barcodeRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        barcode: form.barcode.trim(),
        type: form.type,
      };
      if (editingProduct) {
        await productApi.update(pharmacyId, editingProduct.id, payload);
        toast.success(t("products.updated"));
      } else {
        await productApi.create(pharmacyId, payload);
        toast.success(t("products.created"));
      }
      onSaved();
    } catch {
      toast.error(editingProduct ? t("products.updateFailed") : t("products.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease_both]" onClick={onClose} />
      <aside className="absolute inset-y-0 end-0 w-full max-w-md bg-surface-container-lowest shadow-2xl animate-[fadeIn_0.2s_ease_both] flex flex-col">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-surface-container-high">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="material-symbols-outlined text-primary">{editingProduct ? "edit" : "inventory_2"}</span>
              <h2 className="text-lg font-extrabold tracking-tight truncate">
                {editingProduct ? t("products.editProduct") : t("products.newProduct")}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <FieldTile label={t("products.name")}>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
                placeholder={t("products.namePlaceholder")}
              />
            </FieldTile>

            <FieldTile label={t("products.barcode")}>
              <input
                type="text"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                className={inputClass}
                placeholder={t("products.barcodePlaceholder")}
                disabled={!!editingProduct}
              />
            </FieldTile>

            <FieldTile label={t("products.type")}>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={inputClass}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FieldTile>
          </div>

          <div className="p-5 border-t border-surface-container-high flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container-highest transition-all"
            >
              {t("app.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              {submitting ? (
                <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-sm">check</span>
              )}
              {submitting ? t("app.loading") : (editingProduct ? t("products.saveChanges") : t("products.addProduct"))}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
