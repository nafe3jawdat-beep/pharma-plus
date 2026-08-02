import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function TwoFactorDisableModal({ loading, onDisable, onClose }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const handleDisable = () => {
    if (!password || code.length !== 6) return;
    onDisable(password, code);
  };

  const handleClose = () => {
    setPassword("");
    setCode("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-rose-500 text-3xl">lock_open</span>
          <h3 className="text-lg font-extrabold text-on-surface">{t("twoFactor.disableTitle")}</h3>
        </div>
        <p className="text-sm text-on-surface-variant mb-5">{t("twoFactor.disableWarning")}</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("twoFactor.totpCode")}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-surface-container-high text-center text-lg font-mono tracking-[0.5em] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors"
            >
              {t("app.cancel")}
            </button>
            <button
              onClick={handleDisable}
              disabled={!password || code.length !== 6 || loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {t("twoFactor.confirmDisable")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
