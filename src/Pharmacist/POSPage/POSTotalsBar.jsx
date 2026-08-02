import { useTranslation } from 'react-i18next';

export default function POSTotalsBar({ mode, totalItems, totalPrice, isSubmitting, onSubmit, submittingLabel, submitIcon }) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 bg-gradient-to-br from-surface-container-lowest to-surface-container/50 rounded-2xl border border-surface-container-high p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
      <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto">
        {mode === 'sale' && (
          <>
            <div>
              <p className="text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant mb-1">{t('pos.total')}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-on-surface tabular-nums">{totalPrice.toFixed(2)} <span className="text-base sm:text-lg text-on-surface-variant font-normal">{t('pos.currency')}</span></p>
            </div>
            <div className="h-10 w-px bg-surface-container-high hidden sm:block" />
          </>
        )}
        <div className={mode !== 'sale' ? 'w-full' : ''}>
          <p className="text-[11px] tracking-[0.05em] uppercase font-bold text-on-surface-variant mb-1">{t('pos.items')}</p>
          <p className="text-xl sm:text-2xl font-extrabold text-on-surface tabular-nums">{totalItems}</p>
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isSubmitting ? (
          <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">{submitIcon}</span>
        )}
        {isSubmitting ? t('pos.processing') : submittingLabel}
      </button>
    </div>
  );
}
