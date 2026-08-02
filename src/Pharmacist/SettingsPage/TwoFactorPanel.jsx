import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { twoFactorService } from "../../services/twoFactor.service";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import TwoFactorRecoveryModal from "./TwoFactorRecoveryModal";
import TwoFactorDisableModal from "./TwoFactorDisableModal";

export default function TwoFactorPanel({ role }) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  useEffect(() => {
    twoFactorService.getStatus(role).then((res) => {
      setEnabled(res?.data?.enabled ?? false);
    }).catch(() => {});
  }, [role]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await twoFactorService.enable(role);
      setQrUrl(res.data.qr_code_url);
      setSecret(res.data.secret);
      setStep("scan");
    } catch (err) {
      toast.error(err.response?.data?.message || t("twoFactor.enableFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await twoFactorService.confirm(role, code);
      setRecoveryCodes(res.data.recovery_codes);
      setStep(null);
      setCode("");
      setEnabled(true);
      setShowRecoveryModal(true);
      toast.success(t("twoFactor.enabled"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("twoFactor.invalidCode"));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (password, totpCode) => {
    setLoading(true);
    try {
      await twoFactorService.disable(role, password, totpCode);
      setEnabled(false);
      setShowDisableModal(false);
      toast.success(t("twoFactor.disabled"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("twoFactor.disableFailed"));
    } finally {
      setLoading(false);
    }
  };

  const cancelEnable = () => {
    setStep(null);
    setQrUrl("");
    setSecret("");
    setCode("");
  };

  return (
    <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl shadow-ambient-sm border border-surface-container-high flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        <h2 className="text-xl font-bold text-on-surface">{t("twoFactor.sectionTitle")}</h2>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {enabled ? t("twoFactor.enabled") : t("twoFactor.disabled")}
        </span>
      </div>

      <p className="text-sm text-on-surface-variant">{t("twoFactor.sectionDescription")}</p>

      {!enabled && step !== "scan" && (
        <div className="flex justify-end">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-on-primary text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60"
          >
            {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
            {t("twoFactor.enable")}
          </button>
        </div>
      )}

      {step === "scan" && (
        <div className="flex flex-col items-center gap-5 py-4">
          <p className="text-sm text-on-surface-variant text-center max-w-sm">
            {t("twoFactor.scanInstructions")}
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-ambient-sm">
            <QRCodeSVG value={qrUrl} size={200} />
          </div>
          <div className="w-full max-w-sm">
            <p className="text-xs text-on-surface-variant text-center mb-2">{t("twoFactor.manualEntry")}</p>
            <div className="bg-surface-container-high rounded-xl px-4 py-3 text-center">
              <code className="text-sm font-mono font-bold text-on-surface tracking-widest">{secret}</code>
            </div>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-3">
            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold text-center">
              {t("twoFactor.enterConfirmCode")}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-surface-container-high text-center text-lg font-mono tracking-[0.5em] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <div className="flex gap-3">
              <button
                onClick={cancelEnable}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors"
              >
                {t("app.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={code.length !== 6 || loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-on-primary text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                {t("twoFactor.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {enabled && step !== "scan" && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowDisableModal(true)}
            className="px-6 py-2.5 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 text-sm font-bold transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">lock_open</span>
            {t("twoFactor.disable")}
          </button>
        </div>
      )}

      {showRecoveryModal && (
        <TwoFactorRecoveryModal
          codes={recoveryCodes}
          onClose={() => setShowRecoveryModal(false)}
        />
      )}

      {showDisableModal && (
        <TwoFactorDisableModal
          loading={loading}
          onDisable={handleDisable}
          onClose={() => setShowDisableModal(false)}
        />
      )}
    </div>
  );
}
