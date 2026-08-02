import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../services/pharmacist";
import { companyService } from "../../services/company";
import { adminApi } from "../../services/admin";
import toast from "react-hot-toast";
import TwoFactorPanel from "./TwoFactorPanel";
import VerificationPanel from "./VerificationPanel";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, login, role } = useAuth();
  const isCompany = role === "company";
  const isAdmin = role === "admin";
  const outlet = useOutletContext();
  const verificationStatus = isCompany || isAdmin ? null : outlet?.verificationStatus;
  const refreshPharmacies = isCompany || isAdmin ? null : outlet?.refreshPharmacies;

  const [profile, setProfile] = useState({
    f_name: "", l_name: "", email: "", phone_number: "",
    age: "", gender: "", location: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      adminApi.profile.show().then((res) => {
        const p = res?.data;
        if (p) {
          setProfile({
            f_name: p.f_name || "", l_name: p.l_name || "", email: p.email || "",
            phone_number: p.phone_number || "", age: "", gender: "", location: "",
          });
        }
      }).catch(() => {});
    } else if (isCompany) {
      companyService.getProfile().then((res) => {
        const p = res?.data;
        if (p) {
          setProfile({
            f_name: user?.f_name || "", l_name: user?.l_name || "",
            email: user?.email || "", phone_number: user?.phone_number || "",
            age: "", gender: "", location: "",
          });
        }
      }).catch(() => {});
    } else {
      authApi.dashboard().then((res) => {
        const p = res.data?.pharmacist;
        if (p) {
          setProfile({
            f_name: p.f_name || "", l_name: p.l_name || "", email: p.email || "",
            phone_number: p.phone_number || "", age: p.age ?? "",
            gender: p.gender || "", location: p.location || "",
          });
        }
      }).catch(() => {});
    }
  }, [isAdmin, isCompany, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isAdmin) {
        await adminApi.profile.update(profile);
      } else if (isCompany) {
        await companyService.updateProfile(profile);
      } else {
        await authApi.updateProfile(profile);
        const fullName = `${profile.f_name} ${profile.l_name}`.trim();
        if (user) login({ ...user, name: fullName, email: profile.email, f_name: profile.f_name, l_name: profile.l_name, phone_number: profile.phone_number, age: profile.age, gender: profile.gender, location: profile.location }, localStorage.getItem("token"));
      }
      toast.success(t("settings.profileSaved"));
    } catch {
      toast.error(t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-surface-container-high bg-surface px-3 py-2 rounded-lg text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  return (
    <div className="flex-1 overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="animate-[fadeIn_0.3s_ease-out]">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">{t("settings.title")}</h1>
          <p className="text-base text-on-surface-variant mt-1">{t("settings.description")}</p>
        </div>

        <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl shadow-ambient-sm border border-surface-container-high flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
            <h2 className="text-xl font-bold text-on-surface">{t("settings.personalInfo")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.firstName")}</label>
              <input type="text" name="f_name" value={profile.f_name} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.lastName")}</label>
              <input type="text" name="l_name" value={profile.l_name} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.email")}</label>
              <input type="email" name="email" value={profile.email} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.phoneNumber")}</label>
              <input type="text" name="phone_number" value={profile.phone_number} onChange={handleChange} className={inputClass} />
            </div>
            {!isCompany && !isAdmin && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.age")}</label>
                  <input type="number" name="age" value={profile.age} onChange={handleChange} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.gender")}</label>
                  <select name="gender" value={profile.gender} onChange={handleChange} className={inputClass}>
                    <option value="">--</option>
                    <option value="male">{t("auth.male")}</option>
                    <option value="female">{t("auth.female")}</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.location")}</label>
                  <input type="text" name="location" value={profile.location} onChange={handleChange} className={inputClass} />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60">
              {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {saving ? t("settings.saving") : t("settings.saveProfile")}
            </button>
          </div>
        </div>

        <TwoFactorPanel role={role} />

        {!isCompany && !isAdmin && verificationStatus && (
          <VerificationPanel verificationStatus={verificationStatus} refreshPharmacies={refreshPharmacies} />
        )}

        <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl shadow-ambient-sm border border-surface-container-high flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
            <h2 className="text-xl font-bold text-on-surface">{t("settings.appearance")}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-on-surface">{t("settings.currentTheme")}</p>
              <p className="text-sm text-on-surface-variant">{t("settings.appearanceDesc")}</p>
            </div>
            <button onClick={toggleTheme} className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${theme === 'dark' ? 'bg-primary' : 'bg-surface-container-high'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all flex items-center justify-center ${theme === 'dark' ? 'ltr:left-6 rtl:right-6' : 'ltr:left-0.5 rtl:right-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl shadow-ambient-sm border border-surface-container-high flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
            <h2 className="text-xl font-bold text-on-surface">{t("settings.language")}</h2>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">{t("settings.languageDesc")}</p>
            <div className="flex gap-2">
              <button onClick={() => i18n.changeLanguage("en")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${i18n.language === "en" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"}`}>
                English
              </button>
              <button onClick={() => i18n.changeLanguage("ar")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${i18n.language === "ar" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"}`}>
                العربية
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
