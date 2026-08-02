export default function BatchModal({ isEdit, form, setForm, onSubmit, onClose, submitting, t }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-3xl border border-surface-container-high shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-surface-container-high">
          <h2 className="text-lg font-bold text-on-surface">{isEdit ? t("batches.editBatch") : t("batches.createBatch")}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-7 space-y-5">
          <div>
            <label className="block text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant mb-2">{t("batches.quantity")}</label>
            <input
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant mb-2">{t("batches.wholesalePrice")}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.wholesale_price}
              onChange={(e) => setForm(prev => ({ ...prev, wholesale_price: e.target.value }))}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant mb-2">{t("batches.expirationDate")}</label>
            <input
              type="date"
              required
              value={form.expiration_date}
              onChange={(e) => setForm(prev => ({ ...prev, expiration_date: e.target.value }))}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 rounded-full border border-surface-container-high text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all">{t("app.cancel")}</button>
            <button type="submit" disabled={submitting} className="flex-1 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <span className="material-symbols-outlined text-lg animate-spin">refresh</span> : <span className="material-symbols-outlined text-lg">check</span>}
              {submitting ? t("app.loading") : t("app.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
