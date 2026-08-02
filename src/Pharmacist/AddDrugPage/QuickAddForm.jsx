import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import DosageFormPicker from "./DosageFormPicker";

const emptyQuickAddForm = { tradeName: "", barcode: "", form: "Tablet", arabicForm: "" };

export default function QuickAddForm({ selectedPharmacy, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyQuickAddForm);
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
    if (!form.tradeName.trim()) errs.tradeName = t("drugs.tradeNameRequired");
    if (!form.barcode.trim()) errs.barcode = t("drugs.barcodeRequired");
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!selectedPharmacy?.id) { toast.error(t("errors.noPharmacySelected")); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        trade_name: form.tradeName.trim(),
        barcode: form.barcode.trim(),
        form: form.form,
        arabic_form: form.arabicForm.trim(),
      });
      setForm(emptyQuickAddForm);
      navigate("/Dashboard/StockManagement");
    } catch (err) {
      toast.error(err.response?.data?.message || t("drugs.quickAddFailed"));
    } finally { setSubmitting(false); }
  };

  const inputCls = (field) =>
    `w-full bg-surface-container-lowest text-on-surface text-base px-5 py-3.5 rounded-xl border-b-[3px] focus:outline-none focus:ring-0 transition-all shadow-sm placeholder:text-outline-variant ${
      errors[field] ? "border-b-rose-400" : "border-transparent focus:border-primary"
    }`;

  const labelCls = "text-[11px] tracking-[0.05em] uppercase text-on-surface-variant font-bold ml-1";

  return (
    <div>
      <button onClick={onCancel}
        className="mb-6 flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        {t("drugs.backToOptions")}
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-on-primary text-lg">bolt</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">{t("drugs.quickAdd")}</h2>
          <p className="text-sm text-on-surface-variant">{t("drugs.quickAddDescription")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-7 bg-surface-container/40 rounded-3xl border border-surface-container-high p-10 flex flex-col gap-7">
          <div>
            <h3 className="text-xl font-bold text-on-surface mb-1">{t("drugs.drugInfoTitle")}</h3>
            <p className="text-sm text-on-surface-variant">{t("drugs.quickAddFormHint")}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t("drugs.tradeName")}</label>
            <div className="relative">
              <input type="text" name="tradeName" value={form.tradeName} onChange={handleChange}
                className={`${inputCls("tradeName")} pl-12`} placeholder={t("placeholders.tradeNamePlaceholder")} />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/60 pointer-events-none text-lg">badge</span>
            </div>
            {errors.tradeName && <p className="text-xs text-rose-500 font-medium ml-1">{errors.tradeName}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t("drugs.barcode")}</label>
            <div className="relative">
              <input type="text" name="barcode" value={form.barcode} onChange={handleChange}
                className={`${inputCls("barcode")} pl-12`} placeholder={t("placeholders.barcodePlaceholder")} />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/60 pointer-events-none text-lg">barcode</span>
            </div>
            {errors.barcode && <p className="text-xs text-rose-500 font-medium ml-1">{errors.barcode}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t("drugs.arabicForm")}</label>
            <div className="relative">
              <input type="text" name="arabicForm" value={form.arabicForm} onChange={handleChange}
                className={`${inputCls("arabicForm")} pl-12`} placeholder={t("placeholders.arabicFormPlaceholder")} />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/60 pointer-events-none text-lg">translate</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 bg-surface-container-lowest rounded-3xl p-10 shadow-ambient flex flex-col gap-7 xl:-mt-8 relative z-10 border border-surface-container-high">
          <div className="flex items-center gap-3 pb-5 border-b border-surface-container-high">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">{t("drugs.dosageForm")}</h3>
              <p className="text-xs text-on-surface-variant">{t("drugs.pharmacokineticsHint")}</p>
            </div>
          </div>

          <DosageFormPicker selectedForm={form.form} onSelect={(f) => setForm(p => ({ ...p, form: f }))} />
        </div>

        <div className="xl:col-span-12 flex justify-end items-center gap-4 pt-6 border-t border-surface-container-high">
          <button type="button" onClick={onCancel}
            className="px-7 py-3.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all">
            {t("app.cancel")}
          </button>
          <button type="submit" disabled={submitting}
            className="px-10 py-3.5 bg-gradient-to-r from-primary to-primary-dim text-on-primary rounded-full font-bold text-base shadow-ambient hover:shadow-[0px_15px_40px_-10px_rgba(11,106,106,0.5)] transition-all hover:-translate-y-0.5 flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting && <span className="material-symbols-outlined text-lg animate-spin">refresh</span>}
            {submitting ? t("app.loading") : t("drugs.submitDossier")}
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 700" }}>arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
