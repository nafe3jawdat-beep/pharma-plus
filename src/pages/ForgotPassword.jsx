import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/pharmacist';
import { useTranslation } from "react-i18next";

const validate = (t) => (data) => {
  const errors = {};
  if (!data.email.trim()) {
    errors.email = t("validation.emailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t("validation.validEmail");
  }
  return errors;
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({ email: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(t)({ email });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      await authApi.forgotPassword({ email });
      navigate("/reset-password", { state: { email } });
    } catch (error) {
      const message = error.response?.data?.message;
      setServerError(message || t("auth.forgotPasswordFailed"));
    } finally {
      setLoading(false);
    }
  };

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
              {t("auth.forgotPassword")}
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              {t("auth.forgotPasswordDescription")}
            </p>
          </div>

          <div className="mt-12 flex justify-start relative">
            <div className="w-48 h-48 rounded-2xl bg-surface-container-high/50 border border-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-primary/30">lock_reset</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-12 lg:p-16 bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-3">{t("auth.sendResetCode")}</h2>
            <p className="text-on-surface-variant">
              {t("auth.forgotPasswordDescription")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">

            {serverError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700 font-medium">
                {serverError}
              </div>
            )}

            <div className="flex flex-col space-y-1.5">
              <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.email")}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl bg-surface-container-high border text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
                    : 'border-surface-container-high focus:ring-primary/30 focus:border-primary'
                }`}
              />
              {errors.email && <p className="text-xs text-rose-500 font-medium ml-1">{errors.email}</p>}
            </div>

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {loading ? t("auth.sendingResetCode") : t("auth.sendResetCode")}
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

export default ForgotPassword;
