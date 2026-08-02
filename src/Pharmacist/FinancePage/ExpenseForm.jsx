import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

const PAYMENT_METHODS = ["cash", "card", "bank_transfer"];

export default function ExpenseForm({ expense, onSubmit, onClose }) {
  const { t } = useTranslation();
  const isEdit = !!expense;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: expense?.title || "",
    amount: expense?.amount || "",
    category: expense?.category || "",
    payment_method: expense?.payment_method || "cash",
    expense_date: expense?.expense_date ? expense.expense_date.split("T")[0].replace(/-/g, "/") : "",
    notes: expense?.notes || "",
  });
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(
    expense?.attachment_path ? `/storage/${expense.attachment_path}` : null
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachment(file);
    setAttachmentPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = t("finance.titleRequired");
    if (!form.amount || Number(form.amount) <= 0) errs.amount = t("finance.amountRequired");
    if (!form.category.trim()) errs.category = t("finance.categoryRequired");
    if (!form.expense_date.trim()) errs.expense_date = t("finance.dateRequired");
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("amount", form.amount);
      fd.append("category", form.category.trim());
      fd.append("payment_method", form.payment_method);
      fd.append("expense_date", form.expense_date.trim());
      fd.append("notes", form.notes.trim());
      if (attachment) fd.append("attachment", attachment);
      await onSubmit(fd);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field) =>
    `w-full bg-surface-container-lowest text-on-surface text-sm px-4 py-3 rounded-xl border-b-[3px] focus:outline-none focus:ring-0 transition-all placeholder:text-outline-variant ${
      errors[field] ? "border-b-rose-400" : "border-transparent focus:border-primary"
    }`;

  const labelCls = "text-[11px] tracking-[0.05em] uppercase text-on-surface-variant font-bold ml-1";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high sticky top-0 bg-surface-container-lowest z-10">
          <h2 className="text-lg font-bold text-on-surface">{isEdit ? t("finance.editExpense") : t("finance.addExpense")}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t("finance.title")}</label>
            <input type="text" name="title" value={form.title} onChange={handleChange}
              className={inputCls("title")} placeholder={t("finance.titlePlaceholder")} />
            {errors.title && <p className="text-xs text-rose-500 font-medium ml-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>{t("finance.amount")}</label>
              <input type="number" name="amount" min="0" step="0.01" value={form.amount} onChange={handleChange}
                className={inputCls("amount")} placeholder="0.00" />
              {errors.amount && <p className="text-xs text-rose-500 font-medium ml-1">{errors.amount}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>{t("finance.date")}</label>
              <input type="date" name="expense_date" value={form.expense_date} onChange={handleChange}
                className={inputCls("expense_date")} />
              {errors.expense_date && <p className="text-xs text-rose-500 font-medium ml-1">{errors.expense_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>{t("finance.category")}</label>
              <input type="text" name="category" value={form.category} onChange={handleChange}
                className={inputCls("category")} placeholder={t("finance.categoryPlaceholder")} />
              {errors.category && <p className="text-xs text-rose-500 font-medium ml-1">{errors.category}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>{t("finance.paymentMethod")}</label>
              <select name="payment_method" value={form.payment_method} onChange={handleChange}
                className={inputCls("payment_method")}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{t(`finance.method_${m}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t("finance.notes")}</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={2} className={`${inputCls("notes")} resize-none`}
              placeholder={t("finance.notesPlaceholder")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{t("finance.attachment")}</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
            <div onClick={() => fileInputRef.current.click()}
              className="w-full h-24 bg-surface-container/30 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-container/50 border-2 border-dashed border-outline-variant transition-colors relative overflow-hidden">
              {attachmentPreview ? (
                <>
                  <img src={attachmentPreview} alt="Attachment" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">{t("app.clickToChange")}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-outline-variant">upload_file</span>
                  <span className="text-xs text-on-surface-variant">{t("finance.uploadHint")}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-5 py-3 rounded-xl border border-surface-container-high text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all">
              {t("app.cancel")}
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {submitting ? t("app.loading") : t("app.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
