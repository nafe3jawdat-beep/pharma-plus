import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function TwoFactorVerify() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pendingTwoFactor, completeTwoFactor, pendingRole, clearPendingTwoFactor } = useAuth();

  const [mode, setMode] = useState("totp");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!pendingTwoFactor && !verified) {
      navigate("/login", { replace: true });
    }
  }, [pendingTwoFactor, navigate, verified]);

  useEffect(() => {
    if (mode === "totp") {
      inputRefs.current[0]?.focus();
    }
  }, [mode]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newDigits.every((d) => d !== "")) {
      handleSubmit(newDigits.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => d === "");
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === 6) {
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (code) => {
    setLoading(true);
    setError("");
    try {
      await completeTwoFactor(code);
      setVerified(true);
      navigate(pendingRole === "company" ? "/Company/Dashboard" : pendingRole === "admin" ? "/Admin/Dashboard" : "/Dashboard");
    } catch (err) {
      const message = err.response?.data?.message || t("twoFactor.invalidCode");
      setError(message);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      await completeTwoFactor(recoveryCode.trim());
      setVerified(true);
      navigate(pendingRole === "company" ? "/Company/Dashboard" : pendingRole === "admin" ? "/Admin/Dashboard" : "/Dashboard");
    } catch (err) {
      const message = err.response?.data?.message || t("twoFactor.invalidRecoveryCode");
      setError(message);
      setRecoveryCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearPendingTwoFactor();
    navigate("/login", { replace: true });
  };

  if (!pendingTwoFactor) return null;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 antialiased relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-ambient p-8 lg:p-10 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">shield</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-on-surface">{t("twoFactor.title")}</h1>
            <p className="text-sm text-on-surface-variant">{t("twoFactor.description")}</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 font-medium mb-4">
            {error}
          </div>
        )}

        {mode === "totp" ? (
          <div className="space-y-5">
            <p className="text-sm text-on-surface-variant text-center">
              {t("twoFactor.enterCode")}
            </p>

            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-surface-container-high border border-surface-container-high text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                />
              ))}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                {t("twoFactor.verifying")}
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode("recovery"); setError(""); }}
                className="text-xs font-bold text-primary hover:underline"
              >
                {t("twoFactor.useRecoveryCode")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            <p className="text-sm text-on-surface-variant text-center">
              {t("twoFactor.enterRecoveryCode")}
            </p>

            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => { setRecoveryCode(e.target.value); setError(""); }}
                placeholder={t("twoFactor.recoveryCodePlaceholder")}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center font-mono tracking-wider disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !recoveryCode.trim()}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {loading ? t("twoFactor.verifying") : t("twoFactor.verify")}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode("totp"); setError(""); setDigits(["", "", "", "", "", ""]); }}
                className="text-xs font-bold text-primary hover:underline"
              >
                {t("twoFactor.useAuthenticator")}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-surface-container-high text-center">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {t("twoFactor.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
