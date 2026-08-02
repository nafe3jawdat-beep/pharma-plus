import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function TwoFactorRecoveryModal({ codes, onClose }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-amber-500 text-3xl">warning</span>
          <h3 className="text-lg font-extrabold text-on-surface">{t("twoFactor.recoveryTitle")}</h3>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">{t("twoFactor.recoveryWarning")}</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {codes.map((code, i) => (
            <div key={i} className="bg-surface-container-high rounded-lg px-3 py-2 text-center">
              <code className="text-sm font-mono font-bold text-on-surface">{code}</code>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(codes.join("\n"));
            toast.success(t("twoFactor.copied"));
          }}
          className="w-full mb-3 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">content_copy</span>
          {t("twoFactor.copyAll")}
        </button>
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-on-primary text-sm font-bold transition-all shadow-md"
        >
          {t("twoFactor.savedRecoveryCodes")}
        </button>
      </div>
    </div>
  );
}
