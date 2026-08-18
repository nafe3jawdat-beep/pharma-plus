import { useTranslation } from "react-i18next";

export default function AddToInventoryToast({ onGo, onDismiss }) {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden flex items-center gap-3.5 bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-lg pl-5 pr-3 py-3.5 w-[360px] max-w-[calc(100vw-2rem)]">
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-500/20" />
      <span className="relative w-11 h-11 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 flex-shrink-0">
        <span className="material-symbols-outlined text-xl">inventory_2</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-on-surface leading-tight">{t("products.addToInventoryToast")}</span>
        <span className="block text-xs text-on-surface-variant/70 mt-0.5">{t("products.addToInventoryHint")}</span>
      </span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={onGo}
          className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold transition-all hover:bg-primary-dim shadow-sm"
        >
          {t("products.goToBatches")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
