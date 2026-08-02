import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../services/admin";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    f_name: "",
    l_name: "",
    email: "",
    phone_number: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.profile
      .show()
      .then((res) => {
        const p = res?.data;
        if (p) {
          setProfile({
            f_name: p.f_name || "",
            l_name: p.l_name || "",
            email: p.email || "",
            phone_number: p.phone_number || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.profile.update(profile);
      toast.success(t("settings.profileSaved"));
    } catch {
      toast.error(t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-surface-container/50 text-on-surface px-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40";

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 p-6 lg:p-10 max-w-2xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">{t("settings.title")}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{t("settings.description")}</p>
        </header>

        {/* Profile */}
        <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-surface-container-high flex flex-col gap-5">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-container-high">
            <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">badge</span>
            </div>
            <h2 className="text-base font-extrabold text-on-surface">{t("settings.personalInfo")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.firstName")}</label>
              <input type="text" name="f_name" value={profile.f_name} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.lastName")}</label>
              <input type="text" name="l_name" value={profile.l_name} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.email")}</label>
              <input type="email" name="email" value={profile.email} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.phoneNumber")}</label>
              <input type="text" name="phone_number" value={profile.phone_number} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-on-primary text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60"
            >
              {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {saving ? t("settings.saving") : t("settings.saveProfile")}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-surface-container-high flex flex-col gap-5">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-container-high">
            <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">{theme === "dark" ? "dark_mode" : "light_mode"}</span>
            </div>
            <h2 className="text-base font-extrabold text-on-surface">{t("settings.appearance")}</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-on-surface text-sm">{t("settings.currentTheme")}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{t("settings.appearanceDesc")}</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${theme === "dark" ? "bg-primary" : "bg-surface-container-high"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all flex items-center justify-center ${theme === "dark" ? "ltr:left-6 rtl:right-6" : "ltr:left-0.5 rtl:right-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl border border-surface-container-high flex flex-col gap-5">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-container-high">
            <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">language</span>
            </div>
            <h2 className="text-base font-extrabold text-on-surface">{t("settings.language")}</h2>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">{t("settings.languageDesc")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => i18n.changeLanguage("en")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  i18n.language === "en" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                English
              </button>
              <button
                onClick={() => i18n.changeLanguage("ar")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  i18n.language === "ar" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                العربية
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
