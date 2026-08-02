import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-hot-toast";
import { expenseService } from "../../services/pharmacist";
import ExpenseTable from "./ExpenseTable";
import ExpenseForm from "./ExpenseForm";

export default function FinancePage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const pharmacyId = selectedPharmacy?.id;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchExpenses = useCallback(async () => {
    if (!pharmacyId) return;
    try {
      setLoading(true);
      const res = await expenseService.getAll(pharmacyId);
      setExpenses(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error(t("app.error"));
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, t]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleCreate = async (formData) => {
    try {
      await expenseService.create(pharmacyId, formData);
      toast.success(t("app.created"));
      setFormOpen(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || t("app.error"));
      throw err;
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await expenseService.update(pharmacyId, editingExpense.id, formData);
      toast.success(t("app.updated"));
      setEditingExpense(null);
      setFormOpen(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || t("app.error"));
      throw err;
    }
  };

  const handleDelete = async (exp) => {
    if (!confirm(t("app.confirmDelete"))) return;
    try {
      await expenseService.remove(pharmacyId, exp.id);
      toast.success(t("app.deleted"));
      fetchExpenses();
    } catch {
      toast.error(t("app.error"));
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t("finance.title")}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{t("finance.subtitle")}</p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setFormOpen(true); }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t("finance.addExpense")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ExpenseTable
          expenses={expenses}
          onEdit={(exp) => { setEditingExpense(exp); setFormOpen(true); }}
          onDelete={handleDelete}
          t={t}
        />
      )}

      {formOpen && (
        <ExpenseForm
          expense={editingExpense}
          onSubmit={editingExpense ? handleUpdate : handleCreate}
          onClose={() => { setFormOpen(false); setEditingExpense(null); }}
        />
      )}
    </div>
  );
}
