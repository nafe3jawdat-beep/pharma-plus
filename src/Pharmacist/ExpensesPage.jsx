import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { expenseService } from "../services/pharmacist";
import { BaseUrl } from "../services/api";

const CATEGORY_OPTIONS = [
  { value: "rent", labelKey: "Reports.expense_rent" },
  { value: "utilities", labelKey: "Reports.expense_utilities" },
  { value: "insurance", labelKey: "Reports.expense_insurance" },
  { value: "marketing", labelKey: "Reports.expense_marketing" },
  { value: "miscellaneous", labelKey: "Reports.expense_miscellaneous" },
  { value: "maintenance", labelKey: "Reports.expense_maintenance" },
  { value: "other", labelKey: "Reports.expense_other" },
];

const PAYMENT_OPTIONS = [
  { value: "cash", labelKey: "expenses.methodCash" },
  { value: "card", labelKey: "expenses.methodCard" },
  { value: "bank_transfer", labelKey: "expenses.methodBank" },
  { value: "wallet", labelKey: "expenses.methodWallet" },
  { value: "other", labelKey: "expenses.methodOther" },
];

const CATEGORY_BADGE = {
  rent: "bg-primary-container/60 text-primary-dim",
  utilities: "bg-sky-100 text-sky-700",
  insurance: "bg-purple-100 text-purple-700",
  marketing: "bg-rose-100 text-rose-700",
  miscellaneous: "bg-amber-100 text-amber-700",
  maintenance: "bg-emerald-100 text-emerald-700",
  other: "bg-surface-container-high text-on-surface-variant",
};

const inputClass =
  "w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-transparent focus:border-surface-container-high focus:bg-surface-container-lowest outline-none text-sm transition-all";
const labelClass =
  "text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1 block";

const emptyForm = {
  title: "",
  amount: "",
  category: "",
  payment_method: "cash",
  expense_date: new Date().toISOString().split("T")[0],
  notes: "",
};

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d) ? String(value) : d.toLocaleDateString();
}

function FieldTile({ label, children }) {
  return (
    <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5">
      <p className={labelClass}>{label}</p>
      {children}
    </div>
  );
}

export default function ExpensesPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);

  const fetchExpenses = () => {
    if (!selectedPharmacy?.id) return;
    setLoading(true);
    setError(false);
    expenseService
      .getAll(selectedPharmacy.id)
      .then((res) => {
        const list = res?.data ?? [];
        setExpenses(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setExpenses([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy?.id]);

  const stats = useMemo(() => {
    if (!expenses.length) return null;
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const amounts = expenses.map((e) => Number(e.amount) || 0);
    const total = amounts.reduce((sum, a) => sum + a, 0);
    const thisMonth = expenses
      .filter((e) => String(e.expense_date || "").startsWith(monthPrefix))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { total, thisMonth, largest: amounts.length ? Math.max(...amounts) : 0, count: expenses.length };
  }, [expenses]);

  const q = search.trim().toLowerCase();
  const visibleExpenses = q
    ? expenses.filter((e) =>
        [e.title, e.category, e.payment_method, e.notes]
          .some((v) => v && String(v).toLowerCase().includes(q))
      )
    : expenses;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setAttachment(null);
    setDetailId(null);
    setFormOpen(true);
  };

  const openEditForm = (record) => {
    setEditingId(record.id);
    setFormData({
      title: record.title || "",
      amount: record.amount ?? "",
      category: record.category || "",
      payment_method: record.payment_method || "cash",
      expense_date: record.expense_date || emptyForm.expense_date,
      notes: record.notes || "",
    });
    setAttachment(null);
    setDetailId(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setAttachment(null);
  };

  const openDetail = async (expenseId) => {
    if (!selectedPharmacy?.id) return;
    setDetailId(expenseId);
    setDetail(null);
    setDetailLoading(true);
    setDetailError(false);
    try {
      const res = await expenseService.getOne(selectedPharmacy.id, expenseId);
      setDetail(res?.data ?? null);
    } catch {
      setDetailError(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPharmacy?.id) return;
    if (!formData.title.trim()) {
      toast.error(t("expenses.titleRequired"));
      return;
    }
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      toast.error(t("expenses.amountRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.title.trim());
      fd.append("amount", amount);
      if (formData.category) fd.append("category", formData.category);
      fd.append("payment_method", formData.payment_method);
      fd.append("expense_date", formData.expense_date);
      if (formData.notes.trim()) fd.append("notes", formData.notes.trim());
      if (attachment) fd.append("attachment", attachment);

      if (editingId) {
        await expenseService.update(selectedPharmacy.id, editingId, fd);
        toast.success(t("expenses.updated"));
      } else {
        await expenseService.create(selectedPharmacy.id, fd);
        toast.success(t("expenses.created"));
      }
      closeForm();
      fetchExpenses();
    } catch {
      toast.error(editingId ? t("expenses.updateFailed") : t("expenses.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(t("expenses.confirmDelete", { title: record.title }))) return;
    try {
      await expenseService.remove(selectedPharmacy.id, record.id);
      toast.success(t("expenses.deleted"));
      if (detailId === record.id) setDetailId(null);
      fetchExpenses();
    } catch {
      toast.error(t("expenses.deleteFailed"));
    }
  };

  const statCards = [
    { key: "total", label: t("expenses.statTotal"), value: formatCurrency(stats?.total), icon: "receipt_long", iconClass: "bg-primary-container/60 text-primary-dim" },
    { key: "month", label: t("expenses.statThisMonth"), value: formatCurrency(stats?.thisMonth), icon: "calendar_month", iconClass: "bg-sky-100 text-sky-700" },
    { key: "count", label: t("expenses.statCount"), value: String(stats?.count ?? 0), icon: "format_list_bulleted", iconClass: "bg-amber-100 text-amber-700" },
    { key: "largest", label: t("expenses.statLargest"), value: formatCurrency(stats?.largest), icon: "trending_up", iconClass: "bg-rose-100 text-rose-700" },
  ];

  const attachmentUrl = detail?.attachment_path
    ? detail.attachment_path.startsWith("http")
      ? detail.attachment_path
      : `${BaseUrl.replace(/\/+$/, "")}/${detail.attachment_path}`
    : null;

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{t("expenses.title")}</h1>
            <p className="text-base text-on-surface-variant">{t("expenses.description")}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchExpenses()}
              title={t("app.refresh")}
              className="w-10 h-10 rounded-full bg-surface-container-lowest border border-surface-container-high text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
            <button
              onClick={openAddForm}
              className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t("expenses.addExpense")}
            </button>
          </div>
        </div>

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

        <div className="relative flex-1 lg:max-w-md">
          <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("expenses.searchPlaceholder")}
            className="w-full bg-surface-container-lowest text-on-surface ps-10 pe-9 py-2.5 rounded-xl border border-surface-container-high focus:ring-2 focus:ring-primary outline-none text-sm transition-all placeholder:text-on-surface-variant/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
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
            <div className="p-10 text-center text-rose-600">{t("expenses.loadError")}</div>
          ) : visibleExpenses.length === 0 ? (
            <div className="p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-surface-container-high mb-4">
                <span className="material-symbols-outlined text-on-surface-variant/60 text-3xl">{q ? "search_off" : "receipt_long"}</span>
              </div>
              <p className="text-on-surface font-semibold">{q ? t("expenses.noSearchResults") : t("expenses.noRecords")}</p>
              {!q && <p className="text-on-surface-variant text-sm mt-1">{t("expenses.noRecordsHint")}</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container-high text-[11px] uppercase tracking-widest text-on-surface-variant/60 font-bold">
                    <th className="px-4 py-3.5 text-start">{t("expenses.expenseDate")}</th>
                    <th className="px-4 py-3.5 text-start">{t("expenses.titleField")}</th>
                    <th className="px-4 py-3.5 text-start">{t("expenses.category")}</th>
                    <th className="px-4 py-3.5 text-start">{t("expenses.paymentMethod")}</th>
                    <th className="px-4 py-3.5 text-end">{t("expenses.amount")}</th>
                    <th className="px-4 py-3.5 text-end">{t("app.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {visibleExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      onClick={() => openDetail(expense.id)}
                      className={`cursor-pointer transition-colors hover:bg-surface-container-low/70 ${detailId === expense.id ? "bg-surface-container-low" : ""}`}
                    >
                      <td className="px-4 py-3.5 text-sm text-on-surface-variant whitespace-nowrap">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium">{expense.title || "—"}</span>
                        {expense.notes && (
                          <p className="text-xs text-on-surface-variant truncate max-w-[220px]">{expense.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {expense.category ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${CATEGORY_BADGE[expense.category] || "bg-surface-container-high text-on-surface-variant"}`}>
                            {t(`Reports.expense_${expense.category}`, expense.category)}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/40 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-secondary-container/70 text-on-secondary-container">
                          <span className="material-symbols-outlined text-xs">payments</span>
                          {t(`expenses.method_${expense.payment_method}`, expense.payment_method)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-end text-sm font-extrabold tabular-nums whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-end">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditForm(expense); }}
                            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all"
                            title={t("app.edit")}
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(expense); }}
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
        </div>
      </main>

      {/* Add / Edit form drawer (order-details design) */}
      {formOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease_both]" onClick={closeForm} />
          <aside className="absolute inset-y-0 end-0 w-full max-w-md bg-surface-container-lowest shadow-2xl animate-[fadeIn_0.2s_ease_both] flex flex-col">
            <div className="flex items-start justify-between gap-4 p-5 border-b border-surface-container-high">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="material-symbols-outlined text-primary">{editingId ? "edit" : "receipt_long"}</span>
                  <h2 className="text-lg font-extrabold tracking-tight truncate">
                    {editingId ? t("expenses.editExpense") : t("expenses.newExpense")}
                  </h2>
                </div>
                <p className="text-sm text-on-surface-variant truncate">{selectedPharmacy?.name || ""}</p>
              </div>
              <button
                onClick={closeForm}
                className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                <FieldTile label={t("expenses.titleField")}>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder={t("expenses.titlePlaceholder")}
                  />
                </FieldTile>

                <div className="grid grid-cols-2 gap-3">
                  <FieldTile label={t("expenses.amount")}>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </FieldTile>
                  <FieldTile label={t("expenses.expenseDate")}>
                    <input
                      type="date"
                      name="expense_date"
                      value={formData.expense_date}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </FieldTile>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldTile label={t("expenses.category")}>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      <option value="">{t("expenses.categoryPlaceholder")}</option>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                      ))}
                    </select>
                  </FieldTile>
                  <FieldTile label={t("expenses.paymentMethod")}>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      {PAYMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                      ))}
                    </select>
                  </FieldTile>
                </div>

                <FieldTile label={t("expenses.notes")}>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder={t("expenses.notesPlaceholder")}
                  />
                </FieldTile>

                {!editingId && (
                  <FieldTile label={t("expenses.attachment")}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      className="w-full text-sm text-on-surface-variant file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold file:cursor-pointer"
                    />
                    <p className="text-[11px] text-on-surface-variant/60 mt-1.5">{t("expenses.attachmentHint")}</p>
                    {attachment && (
                      <p className="text-xs font-medium text-primary mt-1.5 truncate">{attachment.name}</p>
                    )}
                  </FieldTile>
                )}
              </div>

              <div className="p-5 border-t border-surface-container-high flex gap-3">
                <button
                  type="button"
                  onClick={closeForm}
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
                  {submitting ? t("expenses.saving") : (editingId ? t("expenses.saveChanges") : t("expenses.addExpense"))}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* Detail drawer (order-details design) */}
      {detailId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease_both]" onClick={() => setDetailId(null)} />
          <aside className="absolute inset-y-0 end-0 w-full max-w-md bg-surface-container-lowest shadow-2xl animate-[fadeIn_0.2s_ease_both] flex flex-col">
            <div className="flex items-start justify-between gap-4 p-5 border-b border-surface-container-high">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                  <h2 className="text-lg font-extrabold tracking-tight truncate">{t("expenses.details")}</h2>
                </div>
                <p className="text-sm text-on-surface-variant truncate">{detail?.title || "—"}</p>
              </div>
              <button
                onClick={() => setDetailId(null)}
                className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {detailLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-surface-container-low animate-pulse" />
                  ))}
                </div>
              ) : detailError ? (
                <div className="p-8 text-center text-rose-600">{t("expenses.loadError")}</div>
              ) : detail ? (
                <>
                  <FieldTile label={t("expenses.titleField")}>
                    <span className="font-medium">{detail.title || "—"}</span>
                  </FieldTile>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldTile label={t("expenses.amount")}>
                      <span className="text-lg font-extrabold tabular-nums">{formatCurrency(detail.amount)}</span>
                    </FieldTile>
                    <FieldTile label={t("expenses.expenseDate")}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-on-surface-variant">calendar_today</span>
                        {formatDate(detail.expense_date)}
                      </span>
                    </FieldTile>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldTile label={t("expenses.category")}>
                      {detail.category ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${CATEGORY_BADGE[detail.category] || "bg-surface-container-high text-on-surface-variant"}`}>
                          {t(`Reports.expense_${detail.category}`, detail.category)}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/40">—</span>
                      )}
                    </FieldTile>
                    <FieldTile label={t("expenses.paymentMethod")}>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-secondary-container/70 text-on-secondary-container">
                        {t(`expenses.method_${detail.payment_method}`, detail.payment_method)}
                      </span>
                    </FieldTile>
                  </div>

                  {detail.notes && (
                    <FieldTile label={t("expenses.notes")}>
                      <p className="whitespace-pre-wrap">{detail.notes}</p>
                    </FieldTile>
                  )}

                  {attachmentUrl && (
                    <FieldTile label={t("expenses.attachment")}>
                      <a
                        href={attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                      >
                        <span className="material-symbols-outlined text-base">attach_file</span>
                        {detail.attachment_path.split("/").pop()}
                      </a>
                    </FieldTile>
                  )}

                  <div className="mt-auto rounded-xl bg-surface-container-low p-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-on-surface-variant">{t("expenses.total")}</p>
                    <p className="text-2xl font-extrabold tabular-nums">{formatCurrency(detail.amount)}</p>
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-5 border-t border-surface-container-high flex gap-3">
              <button
                onClick={() => detail && openEditForm(detail)}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                {t("expenses.editExpense")}
              </button>
              <button
                onClick={() => detail && handleDelete(detail)}
                className="w-14 py-3 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 text-sm font-bold hover:bg-rose-100 transition-all flex items-center justify-center"
                title={t("app.delete")}
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
