import { useTranslation } from "react-i18next";

export default function BulkActionBar({ count, submitting, onBulkAdd, onClear }) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-surface-container-high px-5 py-3.5 flex items-center gap-4 backdrop-blur-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-primary">checklist</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface leading-tight">{count}</p>
            <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-wide font-medium">{t("medications.selected")}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-outline-variant/20" />
        <button onClick={onBulkAdd} disabled={submitting}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-dim transition-all flex items-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
          <span className="material-symbols-outlined text-sm">inventory_2</span>
          {submitting ? t("app.loading") : t("medications.bulkAdd")}
        </button>
        <button onClick={onClear}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all">
          {t("app.cancel")}
        </button>
      </div>
    </div>
  );
}
