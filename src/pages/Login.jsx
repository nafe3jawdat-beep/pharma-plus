import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authApi } from '../services/pharmacist';
import { companyAuthApi } from '../services/company';
import { adminApi } from '../services/admin';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';

const validate = (t) => (data) => {
  const errors = {};
  if (!data.email.trim()) {
    errors.email = t("validation.emailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t("validation.validEmail");
  }
  if (!data.password) {
    errors.password = t("validation.passwordRequired");
  } else if (data.password.length < 8) {
    errors.password = t("validation.passwordLength");
  }
  return errors;
};

const ROLES = [
  { key: 'pharmacist', icon: 'person', labelKey: 'auth.pharmacistTab' },
  { key: 'company', icon: 'business', labelKey: 'auth.companyTab' },
  { key: 'admin', icon: 'shield', labelKey: 'auth.adminTab' },
];

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin, requireTwoFactor } = useAuth();
  const { t, i18n } = useTranslation();
  const [role, setRole] = useState('pharmacist');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeError, setAdminCodeError] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.passwordReset) {
      toast.success(t("auth.resetSuccess"));
      window.history.replaceState({}, document.title);
    }
  }, [location.state, t]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAdminCodeSubmit = () => {
    if (adminCode === import.meta.env.VITE_ADMIN_ACCESS_CODE) {
      setIsAdminMode(true);
      setShowAdminModal(false);
      setAdminCode('');
      setAdminCodeError('');
    } else {
      setAdminCodeError(t("auth.invalidCode"));
    }
  };

  useEffect(() => {
    if (!isAdminMode && role === 'admin') {
      setRole('pharmacist');
      setServerError('');
    }
  }, [isAdminMode, role]);

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
      const loginFn = role === 'company' ? companyAuthApi.login : role === 'admin' ? adminApi.login : authApi.login;
      const res = await loginFn(formData);

      if (res.two_factor) {
        requireTwoFactor(res.two_factor_token, role);
        navigate('/verify-2fa');
        return;
      }

      const payload = res.data || res;
      const authToken = payload.token;
      const userData = payload.user || payload.doctor || payload.company || payload.pharmacist || {};
      authLogin(userData, authToken, role);
      navigate(role === 'company' ? '/Company/Dashboard' : role === 'admin' ? '/Admin/Dashboard' : '/Dashboard');
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 401) {
        setServerError(t("auth.invalidCredentials"));
      } else if (status === 403 && message?.toLowerCase().includes("not verified")) {
        navigate("/verify-email", { state: { email: formData.email } });
      } else if (status === 403) {
        const errorKey = role === 'company' ? "auth.unauthorizedCompany" : "auth.unauthorized";
        setServerError(t(errorKey));
      } else {
        setServerError(message || t("auth.loginFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 antialiased relative overflow-hidden">
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowAdminModal(false); setAdminCode(''); setAdminCodeError(''); }} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-surface-container-high">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
              </div>
              <h3 className="text-base font-extrabold text-on-surface">{t("auth.adminAccess")}</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">{t("auth.adminAccessDesc")}</p>
            <input
              type="password"
              value={adminCode}
              onChange={(e) => { setAdminCode(e.target.value); setAdminCodeError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdminCodeSubmit(); }}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-high border text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              autoFocus
            />
            {adminCodeError && <p className="text-xs text-rose-500 font-medium mt-2">{adminCodeError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAdminModal(false); setAdminCode(''); setAdminCodeError(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-container transition-colors">
                {t("app.cancel")}
              </button>
              <button onClick={handleAdminCodeSubmit}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-primary hover:bg-primary-dim transition-colors">
                {t("auth.verify")}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-6xl bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden flex flex-col lg:flex-row relative z-10">

        <div className="w-full lg:w-5/12 bg-surface-container-low p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">spa</span>
                </div>
                <span className="font-extrabold text-xl tracking-tight text-primary">{t("brand")}</span>
              </div>
              <button
                type="button"
                onClick={() => i18n.changeLanguage(i18n.language === "en" ? "ar" : "en")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">public</span>
                {i18n.language === "en" ? "عربي" : "EN"}
              </button>
            </div>

            <h1 className="text-[2.5rem] leading-[1.1] font-extrabold text-on-surface mb-6">
              {t("auth.welcomeBack")}
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              {role === 'company' ? t("auth.welcomeCompanyDescription") : t("auth.welcomeDescription")}
            </p>
          </div>

          <div className="mt-12 flex justify-start relative">
            <img
              src="/images/register.png"
              alt="Pharma Plus"
              className="w-48 h-48 rounded-2xl object-cover"
            />
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-12 lg:p-16 bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-3">{t("auth.signIn")}</h2>
            <p className="text-on-surface-variant">
              {role === 'company' ? t("auth.signInCompanyDescription") : t("auth.signInDescription")}
            </p>
          </div>

          <div className="flex bg-surface-container-high rounded-xl p-1 mb-8 max-w-md">
            {ROLES.filter((r) => isAdminMode || r.key !== 'admin').map((r) => {
              const isActive = role === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => { setRole(r.key); setServerError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{r.icon}</span>
                  {t(r.labelKey)}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">

            {serverError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700 font-medium">
                {serverError}
              </div>
            )}

            <InputField id="email" label={t("auth.email")} type="email" value={formData.email} onChange={handleChange} error={errors.email} />
            <InputField id="password" label={t("auth.password")} type="password" value={formData.password} onChange={handleChange} error={errors.password} />

            <div className="flex justify-end -mt-2">
              <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </button>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              {t("auth.dontHaveAccount")}{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                {t("auth.register")}
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

const InputField = ({ id, label, type = "text", value, onChange, error }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{label}</label>
    <input
      id={id} type={type} value={value} onChange={onChange}
      className={`w-full px-4 py-3 rounded-xl bg-surface-container-high border text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 transition-all ${
        error
          ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
          : 'border-surface-container-high focus:ring-primary/30 focus:border-primary'
      }`}
    />
    {error && <p className="text-xs text-rose-500 font-medium ml-1">{error}</p>}
  </div>
);

export default Login;
