import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { salaryService } from "../services/pharmacist";
import { useTranslation } from "react-i18next";

const emptyForm = {
  recipient_name: "",
  base_amount: "",
  bonus: "",
  deductions: "",
  salary_period: "",
  paid_at: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function SalariesPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const netAmount = useMemo(() => {
    const base = Number(formData.base_amount) || 0;
    const bonus = Number(formData.bonus) || 0;
    const deductions = Number(formData.deductions) || 0;
    return base + bonus - deductions;
  }, [formData.base_amount, formData.bonus, formData.deductions]);

  const stats = useMemo(() => {
    if (!salaries.length) return null;
    const total = salaries.reduce((sum, s) => sum + (Number(s.net_amount) || 0), 0);
    const avg = total / salaries.length;
    const totalBonus = salaries.reduce((sum, s) => sum + (Number(s.bonus) || 0), 0);
    const totalDeductions = salaries.reduce((sum, s) => sum + (Number(s.deductions) || 0), 0);
    return { total, avg, totalBonus, totalDeductions, count: salaries.length };
  }, [salaries]);

  const fetchSalaries = () => {
    if (!selectedPharmacy?.id) return;
    setLoading(true);
    salaryService
      .getAll(selectedPharmacy.id)
      .then((res) => {
        const list = res?.data ?? [];
        setSalaries(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setSalaries([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSalaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingId(record.id);
    setFormData({
      recipient_name: record.recipient_name || "",
      base_amount: record.base_amount ?? "",
      bonus: record.bonus ?? "",
      deductions: record.deductions ?? "",
      salary_period: record.salary_period || "",
      paid_at: record.paid_at || emptyForm.paid_at,
      notes: record.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPharmacy?.id) return;
    if (!formData.recipient_name.trim()) {
      toast.error(t("salaries.recipientRequired"));
      return;
    }
    if (!formData.salary_period) {
      toast.error(t("salaries.periodRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        user_id: null,
        recipient_name: formData.recipient_name,
        base_amount: Number(formData.base_amount) || 0,
        bonus: Number(formData.bonus) || 0,
        deductions: Number(formData.deductions) || 0,
        net_amount: netAmount,
        salary_period: formData.salary_period,
        paid_at: formData.paid_at,
        payment_method: "apps",
        notes: formData.notes,
      };

      if (editingId) {
        await salaryService.update(selectedPharmacy.id, editingId, payload);
        toast.success(t("salaries.updated"));
      } else {
        await salaryService.create(selectedPharmacy.id, payload);
        toast.success(t("salaries.created"));
      }
      setFormData(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchSalaries();
    } catch {
      toast.error(editingId ? t("salaries.updateFailed") : t("salaries.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(t("salaries.confirmDelete", { name: record.recipient_name }))) return;
    try {
      await salaryService.remove(selectedPharmacy.id, record.id);
      toast.success(t("salaries.deleted"));
      fetchSalaries();
    } catch {
      toast.error(t("salaries.deleteFailed"));
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const inputClass =
    "w-full bg-surface-container/50 text-on-surface px-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm";

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">{t("salaries.title")}</h1>
            <p className="text-base text-on-surface-variant">{t("salaries.description")}</p>
          </div>
          <button
            onClick={showForm && !editingId ? () => { setShowForm(false); setEditingId(null); } : openAddForm}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">{showForm && !editingId ? "close" : "add"}</span>
            {showForm && !editingId ? t("app.cancel") : t("salaries.recordPayment")}
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("salaries.totalPayroll")}</span>
              </div>
              <p className="text-2xl font-extrabold text-on-surface">{formatCurrency(stats.total)}</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("salaries.avgSalary")}</span>
              </div>
              <p className="text-2xl font-extrabold text-on-surface">{formatCurrency(stats.avg)}</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary-container/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("salaries.totalBonuses")}</span>
              </div>
              <p className="text-2xl font-extrabold text-on-surface">{formatCurrency(stats.totalBonus)}</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-error-container/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>remove_circle</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("salaries.totalDeductions")}</span>
              </div>
              <p className="text-2xl font-extrabold text-on-surface">{formatCurrency(stats.totalDeductions)}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl shadow-sm border border-surface-container-high flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {editingId ? "edit" : "receipt_long"}
              </span>
              <h2 className="text-xl font-bold">
                {editingId ? t("salaries.editRecord") : t("salaries.newRecord")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  {t("salaries.recipientName")}
                </label>
                <input
                  type="text"
                  name="recipient_name"
                  value={formData.recipient_name}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder={t("salaries.recipientPlaceholder")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  {t("salaries.baseAmount")}
                </label>
                <input
                  type="number"
                  name="base_amount"
                  value={formData.base_amount}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  {t("salaries.bonus")}
                </label>
                <input
                  type="number"
                  name="bonus"
                  value={formData.bonus}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  {t("salaries.deductions")}
                </label>
                <input
                  type="number"
                  name="deductions"
                  value={formData.deductions}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  {t("salaries.netAmount")}
                </label>
                <div className="w-full bg-surface-container/30 text-on-surface-variant px-4 py-3 rounded-xl text-sm font-bold border border-surface-container-high">
                  {formatCurrency(netAmount)}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  {t("salaries.salaryPeriod")}
                </label>
                <input
                  type="date"
                  name="salary_period"
                  value={formData.salary_period}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  {t("salaries.paidAt")}
                </label>
                <input
                  type="date"
                  name="paid_at"
                  value={formData.paid_at}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                {t("salaries.notes")}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder={t("salaries.notesPlaceholder")}
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); }}
                className="px-6 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all"
              >
                {t("app.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60"
              >
                {submitting ? (
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">check</span>
                )}
                {submitting ? t("salaries.saving") : (editingId ? t("salaries.saveChanges") : t("salaries.recordPayment"))}
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center text-on-surface-variant text-sm py-12">
            <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
            {t("salaries.loading")}
          </div>
        ) : salaries.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 rounded-2xl shadow-sm border border-surface-container-high text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-on-surface font-bold text-lg">{t("salaries.noRecords")}</p>
                <p className="text-on-surface-variant text-sm mt-1">{t("salaries.noRecordsHint")}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface border-b border-surface-container-high">
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      {t("salaries.recipientName")}
                    </th>
                    <th className="text-end px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      {t("salaries.baseAmount")}
                    </th>
                    <th className="text-end px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      {t("salaries.bonus")}
                    </th>
                    <th className="text-end px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      {t("salaries.deductions")}
                    </th>
                    <th className="text-end px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      <div className="flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        {t("salaries.netAmount")}
                      </div>
                    </th>
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      {t("salaries.period")}
                    </th>
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      {t("salaries.method")}
                    </th>
                    <th className="text-end px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      {t("app.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {salaries.map((record) => (
                    <tr key={record.id} className="hover:bg-surface transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-container/30 text-primary text-xs font-bold flex items-center justify-center">
                            {record.recipient_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-on-surface block">{record.recipient_name}</span>
                            {record.notes && (
                              <span className="text-xs text-on-surface-variant truncate max-w-[200px] block">{record.notes}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant text-end tabular-nums">
                        {formatCurrency(record.base_amount)}
                      </td>
                      <td className="px-6 py-4 text-end">
                        <span className="text-sm tabular-nums text-tertiary font-medium">
                          +{formatCurrency(record.bonus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <span className="text-sm tabular-nums text-error font-medium">
                          -{formatCurrency(record.deductions)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <span className="text-sm font-extrabold tabular-nums text-on-surface bg-primary-container/20 px-3 py-1 rounded-lg">
                          {formatCurrency(record.net_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container/50 text-on-secondary-container">
                          {record.salary_period}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-tertiary-container/40 text-on-tertiary-container capitalize">
                          {record.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditForm(record)}
                            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all"
                            title={t("app.edit")}
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(record)}
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
          </div>
        )}
      </main>
    </div>
  );
}
