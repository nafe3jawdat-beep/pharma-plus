import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/pharmacist';
import { useTranslation } from 'react-i18next';

const GENDERS = [
  { value: 'male' },
  { value: 'female' },
];

const ROLES = [
  { key: 'pharmacist', icon: 'person', labelKey: 'auth.pharmacistTab' },
  { key: 'company', icon: 'business', labelKey: 'auth.companyTab' },
];

const validateStep1 = (data, t) => {
  const errors = {};
  if (!data.f_name?.trim()) errors.f_name = t("validation.firstNameRequired");
  if (!data.l_name?.trim()) errors.l_name = t("validation.lastNameRequired");
  if (!data.email?.trim()) {
    errors.email = t("validation.emailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t("validation.validEmail");
  }
  if (!data.phone_number?.trim()) {
    errors.phone_number = t("validation.phoneRequired");
  } else if (!/^[\d\s\-+()]{7,20}$/.test(data.phone_number)) {
    errors.phone_number = t("validation.validPhone");
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
  if (!data.age) {
    errors.age = t("validation.ageRequired");
  } else {
    const ageNum = parseInt(data.age, 10);
    if (isNaN(ageNum) || ageNum < 20 || ageNum > 80) {
      errors.age = t("validation.ageRange");
    }
  }
  if (!data.gender) errors.gender = t("validation.genderRequired");
  return errors;
};

const validateStep2 = (data, t) => {
  const errors = {};
  if (!data.commercial_name?.trim()) errors.commercial_name = t("validation.commercialNameRequired");
  if (!data.commercial_registration?.trim()) errors.commercial_registration = t("validation.commercialRegistrationRequired");
  if (!data.company_address?.trim()) errors.company_address = t("validation.companyAddressRequired");
  if (!data.company_phone?.trim()) {
    errors.company_phone = t("validation.companyPhoneRequired");
  } else if (!/^[\d\s\-+()]{7,20}$/.test(data.company_phone)) {
    errors.company_phone = t("validation.validPhone");
  }
  if (!data.license_number?.trim()) errors.license_number = t("validation.licenseNumberRequired");
  if (!data.license_image) errors.license_image = t("validation.licenseImageRequired");
  return errors;
};

export default function Register() {
  const navigate = useNavigate();
  const licenseInputRef = useRef(null);
  const [role, setRole] = useState('pharmacist');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    f_name: '', l_name: '', email: '', phone_number: '',
    password: '', password_confirmation: '', age: '', gender: '',
    location: '',
    commercial_name: '', commercial_registration: '', company_address: '',
    company_phone: '', license_number: '', license_image: null,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const isCompany = role === 'company';
  // const totalSteps = isCompany ? 2 : 1;

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    if (id === 'license_image') {
      const file = files?.[0] || null;
      setFormData(prev => ({ ...prev, license_image: file }));
      if (errors.license_image) setErrors(prev => ({ ...prev, license_image: '' }));
      return;
    }
    const sanitized = id === 'phone_number' || id === 'company_phone' ? value.replace(/[^\d\s\-+()]/g, '') : value;
    setFormData(prev => ({ ...prev, [id]: sanitized }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const handleNext = () => {
    const stepErrors = validateStep1({ ...formData, role }, t);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    if (!isCompany) {
      handleSubmit();
    } else {
      setStep(2);
      setErrors({});
      setServerError('');
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
    setServerError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isCompany) {
      const stepErrors = validateStep2(formData, t);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) return;
    }

    setLoading(true);
    setServerError('');
    try {
      if (isCompany) {
        const fd = new FormData();
        fd.append("f_name", formData.f_name);
        fd.append("l_name", formData.l_name);
        fd.append("email", formData.email);
        fd.append("phone_number", formData.phone_number);
        fd.append("password", formData.password);
        fd.append("password_confirmation", formData.password_confirmation);
        fd.append("age", formData.age);
        fd.append("gender", formData.gender);
        if (formData.location) fd.append("location", formData.location);
        fd.append("commercial_name", formData.commercial_name);
        fd.append("commercial_registration", formData.commercial_registration);
        fd.append("address", formData.company_address);
        fd.append("phone", formData.company_phone);
        fd.append("license_number", formData.license_number);
        if (formData.license_image) fd.append("license_image", formData.license_image);
        await authApi.companyRegister(fd);
      } else {
        const fd = new FormData();
        fd.append("f_name", formData.f_name);
        fd.append("l_name", formData.l_name);
        fd.append("email", formData.email);
        fd.append("phone_number", formData.phone_number);
        fd.append("password", formData.password);
        fd.append("password_confirmation", formData.password_confirmation);
        fd.append("age", formData.age);
        fd.append("gender", formData.gender);
        if (formData.location) fd.append("location", formData.location);
        await authApi.register(fd);
      }
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      setServerError(error.response?.data?.message || error.message || t("auth.registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setStep(1);
    setErrors({});
    setServerError('');
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
              {step === 1
                ? (isCompany ? t("auth.registerCompanyHeading") : t("auth.registerHeading"))
                : t("auth.registerCompanyHeading")}
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              {step === 1
                ? (isCompany ? t("auth.step1Description") : t("auth.registerDescription"))
                : t("auth.step2Description")}
            </p>

            {isCompany && (
              <div className="flex items-center gap-3 mt-8">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {s}
                    </div>
                    <span className={`text-xs font-bold ${step === s ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {t("auth.stepOf", { current: s, total: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-12 lg:p-16 bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-3">{t("auth.createAccount")}</h2>
            <p className="text-on-surface-variant">
              {step === 1
                ? (isCompany ? t("auth.formCompanyDescription") : t("auth.formDescription"))
                : t("auth.formCompanyDescription")}
            </p>
          </div>

          <div className="flex bg-surface-container-high rounded-xl p-1 mb-8 max-w-md">
            {ROLES.map((r) => {
              const isActive = role === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleRoleChange(r.key)}
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

          {isCompany && (
            <div className="flex gap-2 mb-8 max-w-md">
              {[1, 2].map((s) => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-primary' : 'bg-surface-container-high'}`} />
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">

            {serverError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700 font-medium">
                {serverError}
              </div>
            )}

            {step === 1 ? (
              <>
                <div className="flex gap-4">
                  <InputField id="f_name" label={t("auth.firstName")} value={formData.f_name} onChange={handleChange} error={errors.f_name} placeholder={t("placeholders.nameExample")} containerClass="flex-1" />
                  <InputField id="l_name" label={t("auth.lastName")} value={formData.l_name} onChange={handleChange} error={errors.l_name} placeholder={t("placeholders.lastNameExample")} containerClass="flex-1" />
                </div>

                <InputField id="email" label={t("auth.email")} type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder={t("placeholders.email")} />
                <InputField id="phone_number" label={t("auth.phoneNumber")} type="tel" value={formData.phone_number} onChange={handleChange} error={errors.phone_number} placeholder={t("placeholders.phoneExample")} />

                <div className="flex gap-4">
                  <InputField id="password" label={t("auth.password")} type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} error={errors.password} placeholder={t("placeholders.passwordHint")} containerClass="flex-1" showToggle isVisible={showPassword} onToggleVisibility={() => setShowPassword(!showPassword)} />
                  <InputField id="password_confirmation" label={t("auth.confirmPassword")} type={showConfirmPassword ? "text" : "password"} value={formData.password_confirmation} onChange={handleChange} error={errors.password_confirmation} placeholder={t("placeholders.reEnterPassword")} containerClass="flex-1" showToggle isVisible={showConfirmPassword} onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)} />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col space-y-1.5">
                    <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.age")}</label>
                    <input
                      id="age" type="number" min={20} max={80} value={formData.age} onChange={handleChange}
                      placeholder={t("placeholders.ageExample")}
                      className={`w-full px-4 py-3 rounded-xl bg-surface-container-high border text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 transition-all ${
                        errors.age
                          ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
                          : 'border-surface-container-high focus:ring-primary/30 focus:border-primary'
                      }`}
                    />
                    {errors.age && <p className="text-xs text-rose-500 font-medium ml-1">{errors.age}</p>}
                  </div>

                  <div className="flex-1 flex flex-col space-y-1.5">
                    <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.gender")}</label>
                    <div className="flex gap-2">
                      {GENDERS.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, gender: g.value }));
                            if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                          }}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                            formData.gender === g.value
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'bg-surface-container-high border border-surface-container-high text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                        >
                          {g.value === 'male' ? t("auth.male") : t("auth.female")}
                        </button>
                      ))}
                    </div>
                    {errors.gender && <p className="text-xs text-rose-500 font-medium ml-1">{errors.gender}</p>}
                  </div>
                </div>

                <InputField id="location" label={t("auth.location")} value={formData.location} onChange={handleChange} error={errors.location} placeholder={t("placeholders.locationExample")} />

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                  {loading ? t("auth.creatingAccount") : isCompany ? t("auth.next") : t("auth.createAccount")}
                </button>
              </>
            ) : (
              <>
                <InputField id="commercial_name" label={t("auth.commercialName")} value={formData.commercial_name} onChange={handleChange} error={errors.commercial_name} />
                <InputField id="commercial_registration" label={t("auth.commercialRegistration")} value={formData.commercial_registration} onChange={handleChange} error={errors.commercial_registration} />
                <InputField id="company_address" label={t("auth.companyAddress")} value={formData.company_address} onChange={handleChange} error={errors.company_address} />
                <InputField id="company_phone" label={t("auth.companyPhone")} type="tel" value={formData.company_phone} onChange={handleChange} error={errors.company_phone} />
                <InputField id="license_number" label={t("auth.licenseNumber")} value={formData.license_number} onChange={handleChange} error={errors.license_number} />

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.licenseImage")}</label>
                  <button
                    type="button"
                    onClick={() => licenseInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-xl p-4 text-sm font-medium transition-all text-center ${
                      errors.license_image
                        ? 'border-rose-300 text-rose-500'
                        : formData.license_image
                          ? 'border-primary text-primary'
                          : 'border-surface-container-high text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-base">upload</span>
                      {formData.license_image ? formData.license_image.name : t("auth.clickToUpload")}
                    </div>
                  </button>
                  <p className="text-xs text-on-surface-variant ml-1">{t("auth.fileHint")}</p>
                  <input
                    ref={licenseInputRef}
                    id="license_image"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                  {errors.license_image && <p className="text-xs text-rose-500 font-medium ml-1">{errors.license_image}</p>}
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 px-4 py-3 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container transition-colors"
                  >
                    {t("auth.back")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                    {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                  </button>
                </div>
              </>
            )}

            <p className="text-center text-sm text-on-surface-variant mt-4">
              {t("auth.alreadyHaveAccount")}{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">{t("auth.signIn")}</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

function InputField({ id, label, type = "text", value, onChange, error, placeholder, containerClass = "", showToggle, isVisible, onToggleVisibility }) {
  return (
    <div className={`flex flex-col space-y-1.5 ${containerClass}`}>
      <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{label}</label>
      <div className="relative">
        <input
          id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl bg-surface-container-high border text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 transition-all ${
            showToggle ? 'pe-12' : ''
          } ${
            error
              ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
              : 'border-surface-container-high focus:ring-primary/30 focus:border-primary'
          }`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">{isVisible ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-500 font-medium ml-1">{error}</p>}
    </div>
  );
}
