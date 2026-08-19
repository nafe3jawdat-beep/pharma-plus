import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import InstallGuideModal from "../components/InstallGuideModal";

const pharmacistFeatures = [
  { icon: "inventory_2", titleKey: "landing.pharmacistFeatures.inventory", descKey: "landing.pharmacistFeatures.inventoryDesc" },
  { icon: "medication", titleKey: "landing.pharmacistFeatures.medications", descKey: "landing.pharmacistFeatures.medicationsDesc" },
  { icon: "receipt_long", titleKey: "landing.pharmacistFeatures.orders", descKey: "landing.pharmacistFeatures.ordersDesc" },
  { icon: "analytics", titleKey: "landing.pharmacistFeatures.analytics", descKey: "landing.pharmacistFeatures.analyticsDesc" },
];

const companyFeatures = [
  { icon: "group", titleKey: "landing.companyFeatures.reps", descKey: "landing.companyFeatures.repsDesc" },
  { icon: "event", titleKey: "landing.companyFeatures.schedules", descKey: "landing.companyFeatures.schedulesDesc" },
  { icon: "assignment_ind", titleKey: "landing.companyFeatures.assignments", descKey: "landing.companyFeatures.assignmentsDesc" },
  { icon: "location_on", titleKey: "landing.companyFeatures.tracking", descKey: "landing.companyFeatures.trackingDesc" },
];

const steps = [
  { num: "01", icon: "person_add", titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
  { num: "02", icon: "tune", titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
  { num: "03", icon: "rocket_launch", titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
];

const stats = [
  { value: "24/7", labelKey: "landing.statAccess" },
  { value: "100%", labelKey: "landing.statSecure" },
];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);
  const { deferredPrompt, isStandalone, justInstalled, promptInstall } = useInstallPrompt();

  const handleInstall = async () => {
    if (justInstalled || isStandalone) {
      toast(t("landing.alreadyInstalled"), { icon: "✅", duration: 4000 });
      return;
    }
    if (deferredPrompt) {
      const accepted = await promptInstall();
      if (accepted) toast(t("landing.installDone"), { icon: "✅", duration: 4000 });
      return;
    }
    setShowGuide(true);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-2xl border-b border-surface-container-high/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
              <span className="material-symbols-outlined text-on-primary text-xl">spa</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-on-surface">{t("brand")}</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === "en" ? "ar" : "en")}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high/80 text-on-surface-variant text-xs font-bold hover:bg-surface-container-high transition-colors"
            >
              {i18n.language === "en" ? "عربي" : "EN"}
            </button>
            <button
              onClick={handleInstall}
              className="h-9 w-9 rounded-xl bg-surface-container-high/80 flex items-center justify-center hover:bg-surface-container-high transition-colors group"
              title={t("landing.installApp")}
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] group-hover:text-primary transition-colors">download</span>
            </button>
            <Link
              to="/login"
              className="h-9 px-5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-dim transition-all shadow-sm shadow-primary/20 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">login</span>
              {t("landing.logIn")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-28 lg:pt-40 lg:pb-36 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/[0.05] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container/30 border border-primary/10 text-primary text-xs font-bold mb-8 tracking-wider uppercase">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            {t("brand")}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-on-surface leading-[1.05] tracking-tight mb-7 max-w-4xl mx-auto">
            {t("landing.heroTitle")}
          </h1>

          <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="h-13 px-8 rounded-2xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2.5"
            >
              {t("landing.ctaButton")}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────── */}
      <section className="relative z-10 border-y border-surface-container-high bg-surface-container/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-surface-container-high">
            {stats.map((s) => (
              <div key={s.labelKey} className="py-8 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">{s.value}</p>
                <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/30 text-primary text-[11px] font-bold tracking-wider uppercase mb-4">
              {t("brand")}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight mb-4">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          {/* Pharmacist */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-lg">local_pharmacy</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">{t("landing.pharmacist")}</h3>
                <p className="text-sm text-on-surface-variant">{t("landing.pharmacistDesc")}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pharmacistFeatures.map((f) => (
                <div
                  key={f.titleKey}
                  className="group bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-container/20 flex items-center justify-center mb-4 group-hover:bg-primary-container/40 transition-colors">
                    <span className="material-symbols-outlined text-primary text-xl">{f.icon}</span>
                  </div>
                  <p className="font-bold text-sm text-on-surface mb-1.5">{t(f.titleKey)}</p>
                  <p className="text-xs text-on-surface-variant/60 leading-relaxed">{t(f.descKey)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-lg">business</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">{t("landing.company")}</h3>
                <p className="text-sm text-on-surface-variant">{t("landing.companyDesc")}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {companyFeatures.map((f) => (
                <div
                  key={f.titleKey}
                  className="group bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-container/20 flex items-center justify-center mb-4 group-hover:bg-primary-container/40 transition-colors">
                    <span className="material-symbols-outlined text-primary text-xl">{f.icon}</span>
                  </div>
                  <p className="font-bold text-sm text-on-surface mb-1.5">{t(f.titleKey)}</p>
                  <p className="text-xs text-on-surface-variant/60 leading-relaxed">{t(f.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section className="relative py-24 lg:py-32 bg-surface-container/40 border-y border-surface-container-high">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight mb-4">
              {t("landing.howItWorksTitle")}
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              {t("landing.howItWorksSubtitle")}
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            <div className="grid sm:grid-cols-3 gap-10 sm:gap-8">
              {steps.map((s) => (
                <div key={s.titleKey} className="flex flex-col items-center text-center relative">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-center shadow-ambient-sm relative z-10">
                      <span className="material-symbols-outlined text-3xl text-primary">{s.icon}</span>
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dim text-on-primary text-xs font-bold flex items-center justify-center shadow-md shadow-primary/25 z-20">
                      {s.num}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-on-surface mb-2">{t(s.titleKey)}</h4>
                  <p className="text-sm text-on-surface-variant/60 max-w-[240px] leading-relaxed">{t(s.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Download App ──────────────────────────────────── */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-primary/[0.02] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/30 text-primary text-[11px] font-bold tracking-wider uppercase mb-4">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>phone_android</span>
              {t("brand")}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight mb-4">
              {t("landing.downloadAppTitle")}
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              {t("landing.downloadAppSubtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Mobile App Card */}
            <div className="group bg-surface-container-lowest rounded-2xl border-2 border-primary/20 p-8 flex flex-col items-center text-center hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/25 mb-6">
                <span className="material-symbols-outlined text-on-primary text-3xl">phone_android</span>
              </div>
              <h3 className="text-xl font-extrabold text-on-surface mb-2">{t("landing.mobileAppTitle")}</h3>
              <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-8 flex-1">{t("landing.mobileAppDesc")}</p>
              <a
                href="https://expo.dev/artifacts/eas/ClZBEeFtF4n1_VLcbKwtyqHwZ5t9nskUTlVchDLOUoY.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                {t("landing.downloadApk")}
              </a>
            </div>

            {/* PWA Card */}
            <div className="group bg-surface-container-lowest rounded-2xl border border-surface-container-high p-8 flex flex-col items-center text-center hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center mb-6 group-hover:bg-primary-container/40 transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">install_mobile</span>
              </div>
              <h3 className="text-xl font-extrabold text-on-surface mb-2">{t("landing.pwaTitle")}</h3>
              <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-8 flex-1">{t("landing.pwaDesc")}</p>
              <button
                onClick={handleInstall}
                className="h-12 px-8 rounded-xl bg-primary/10 text-primary font-bold text-sm border border-primary/20 hover:bg-primary/20 hover:border-primary/30 cursor-pointer transition-all flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[18px]">install_mobile</span>
                {t("landing.installToHomeScreen")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-5">
            {t("landing.heroTitle")}
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2.5 h-13 px-8 rounded-2xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
          >
            {t("landing.ctaButton")}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-surface-container-high bg-surface-container/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-sm">spa</span>
              </div>
              <span className="font-bold text-sm text-on-surface-variant">{t("brand")}</span>
            </div>
            <p className="text-xs text-on-surface-variant/40">
              &copy; {new Date().getFullYear()} {t("brand")}. {t("landing.footerText")}
            </p>
            <Link to="/login" className="text-xs font-bold text-primary hover:underline">
              {t("landing.logIn")}
            </Link>
          </div>
        </div>
      </footer>

      {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
