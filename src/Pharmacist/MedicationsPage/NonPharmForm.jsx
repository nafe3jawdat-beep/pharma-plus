import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { productApi } from "../../services/pharmacist";

export default function NonPharmForm({ selectedPharmacy, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", barcode: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = t("nonPharm.nameRequired");
    if (!form.barcode.trim()) errs.barcode = t("nonPharm.barcodeRequired");
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!selectedPharmacy?.id) { toast.error(t("errors.noPharmacySelected")); return; }
    setSubmitting(true);
    try {
      await productApi.create(selectedPharmacy.id, {
        name: form.name.trim(),
        barcode: form.barcode.trim(),
        type: "cosmetic",
      });
      toast.success(t("nonPharm.success"));
      setForm({ name: "", barcode: "" });
      onSuccess();
    } catch {
      toast.error(t("nonPharm.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-b border-surface-container-high bg-surface-container/30">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <form onSubmit={handleSubmit} className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[11px] tracking-[0.05em] uppercase text-on-surface-variant font-bold">{t("nonPharm.name")}</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t("nonPharm.namePlaceholder")}
              className={`w-full bg-surface-container-lowest text-on-surface text-sm px-4 py-2.5 rounded-xl border-b-[3px] focus:outline-none focus:ring-0 transition-all placeholder:text-outline-variant ${
                errors.name ? "border-b-rose-400" : "border-transparent focus:border-primary"
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-1.5 w-48">
            <label className="text-[11px] tracking-[0.05em] uppercase text-on-surface-variant font-bold">{t("nonPharm.barcode")}</label>
            <input
              type="text"
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
              placeholder={t("nonPharm.barcodePlaceholder")}
              className={`w-full bg-surface-container-lowest text-on-surface text-sm px-4 py-2.5 rounded-xl border-b-[3px] focus:outline-none focus:ring-0 transition-all placeholder:text-outline-variant ${
                errors.barcode ? "border-b-rose-400" : "border-transparent focus:border-primary"
              }`}
            />
            {errors.barcode && <p className="text-xs text-rose-500 font-medium">{errors.barcode}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
            <span className="material-symbols-outlined text-sm">add</span>
            {submitting ? t("app.loading") : t("nonPharm.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
