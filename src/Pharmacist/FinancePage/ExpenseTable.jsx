export default function ExpenseTable({ expenses, onEdit, onDelete, t }) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-surface-container/50 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/40" style={{ fontVariationSettings: "'wght' 300" }}>receipt_long</span>
        </div>
        <p className="text-on-surface-variant font-medium mb-1">{t("finance.noExpenses")}</p>
        <p className="text-on-surface-variant/60 text-sm">{t("finance.noExpensesHint")}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container/60 border-b border-surface-container-high">
              <th className="px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("finance.title")}</th>
              <th className="px-5 py-3.5 text-end text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("finance.amount")}</th>
              <th className="px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("finance.category")}</th>
              <th className="px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("finance.paymentMethod")}</th>
              <th className="px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("finance.date")}</th>
              <th className="px-5 py-3.5 text-start text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant">{t("finance.notes")}</th>
              <th className="px-5 py-3.5 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-surface-container/30 transition-colors">
                <td className="px-5 py-4">
                  <span className="font-bold text-on-surface">{exp.title}</span>
                </td>
                <td className="px-5 py-4 text-end">
                  <span className="font-bold text-on-surface tabular-nums">{Number(exp.amount).toFixed(2)}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface-variant">{exp.category}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs font-medium text-on-surface-variant capitalize">{exp.payment_method?.replace("_", " ")}</span>
                </td>
                <td className="px-5 py-4 text-on-surface-variant text-xs">
                  {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : "-"}
                </td>
                <td className="px-5 py-4 text-on-surface-variant text-xs max-w-[200px] truncate">{exp.notes || "-"}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {exp.attachment_path && (
                      <span className="material-symbols-outlined text-on-surface-variant/40 text-lg" title={t("finance.hasAttachment")}>attach_file</span>
                    )}
                    <button onClick={() => onEdit(exp)} className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all" title={t("app.edit")}>
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => onDelete(exp)} className="p-1.5 rounded-lg hover:bg-rose-50 text-on-surface-variant hover:text-rose-500 transition-all" title={t("app.delete")}>
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
  );
}
