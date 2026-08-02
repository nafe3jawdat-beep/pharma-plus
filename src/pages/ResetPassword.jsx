import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authApi } from '../services/pharmacist';
import { useTranslation } from "react-i18next";

const validate = (t) => (data) => {
  const errors = {};
  if (!data.token.trim()) {
    errors.token = t("validation.codeRequired");
  } else if (!/^\d{6}$/.test(data.token)) {
    errors.token = t("validation.codeLength");
  }
  if (!data.password) {
    errors.password = t("validation.passwordRequired");
  } else if (data.password.length < 8) {
    errors.password = t("validation.passwordLength");
  }
  if (!data.password_confirmation) {
    errors.password_confirmation = t("validation.confirmPasswordRequired");
  } else if (data.password !== data.password_confirmation) {
    errors.password_confirmation = t("validation.passwordsDoNotMatch");
  }
  return errors;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ token: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(t)(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      await authApi.resetPassword({
        email,
        token: formData.token,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      navigate('/login', { state: { passwordReset: true } });
    } catch (error) {
      const message = error.response?.data?.message;
      setServerError(message || t("auth.resetPasswordFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">error</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">{t("auth.invalidResetLink")}</h2>
          <p className="text-on-surface-variant mb-6">{t("auth.invalidResetLinkDescription")}</p>
          <Link
            to="/forgot-password"
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dim transition-all inline-block"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 antialiased relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-6xl bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden flex flex-col lg:flex-row relative z-10">

        <div className="w-full lg:w-5/12 bg-surface-container-low p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-16">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">spa</span>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-primary">{t("brand")}</span>
            </div>

            <h1 className="text-[2.5rem] leading-[1.1] font-extrabold text-on-surface mb-6">
              {t("auth.resetPassword")}
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              {t("auth.resetPasswordDescription")}
            </p>
          </div>

          <div className="mt-12 flex justify-start relative">
            <div className="w-48 h-48 rounded-2xl bg-surface-container-high/50 border border-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-primary/30">lock</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-12 lg:p-16 bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-3">{t("auth.enterNewPassword")}</h2>
            <p className="text-on-surface-variant">
              {t("auth.resetPasswordDescription")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">

            {serverError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700 font-medium">
                {serverError}
              </div>
            )}

            <div className="flex flex-col space-y-1.5">
              <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.enterCode")}</label>
              <input
                id="token"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={formData.token}
                onChange={handleChange}
                placeholder="000000"
                className={`w-full px-4 py-3 rounded-xl bg-surface-container-high border text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 transition-all tracking-[0.5em] text-center font-mono ${
                  errors.token
                    ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
                    : 'border-surface-container-high focus:ring-primary/30 focus:border-primary'
                }`}
              />
              {errors.token && <p className="text-xs text-rose-500 font-medium ml-1">{errors.token}</p>}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.newPassword")}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl bg-surface-container-high border text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 transition-all pr-12 ${
                    errors.password
                      ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
                      : 'border-surface-container-high focus:ring-primary/30 focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 font-medium ml-1">{errors.password}</p>}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.confirmPassword")}</label>
              <input
                id="password_confirmation"
                type={showPassword ? "text" : "password"}
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl bg-surface-container-high border text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 transition-all ${
                  errors.password_confirmation
                    ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
                    : 'border-surface-container-high focus:ring-primary/30 focus:border-primary'
                }`}
              />
              {errors.password_confirmation && <p className="text-xs text-rose-500 font-medium ml-1">{errors.password_confirmation}</p>}
            </div>

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {loading ? t("auth.resettingPassword") : t("auth.resetPassword")}
            </button>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              {t("auth.rememberPassword")}{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                {t("auth.signIn")}
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
