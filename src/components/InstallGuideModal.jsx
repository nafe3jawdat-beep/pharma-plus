import { useTranslation } from "react-i18next";

function detectPlatform() {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export default function InstallGuideModal({ onClose }) {
  const { t } = useTranslation();
  const platform = detectPlatform();

  const steps =
    platform === "ios"
      ? ["installIosStep1", "installIosStep2", "installIosStep3"]
      : platform === "android"
        ? ["installAndroidStep1", "installAndroidStep2"]
        : ["installDesktopStep1", "installDesktopStep2"];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">download</span>
          <h3 className="text-lg font-extrabold text-on-surface">{t("landing.installGuideTitle")}</h3>
        </div>
        <p className="text-sm text-on-surface-variant mb-5">{t("landing.installGuideIntro")}</p>

        <ol className="space-y-3 mb-6">
          {steps.map((key, i) => (
            <li key={key} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary-dim text-on-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm text-on-surface leading-relaxed">{t(`landing.${key}`)}</span>
            </li>
          ))}
        </ol>

        <p className="text-xs text-primary font-bold mb-5">{t("landing.installDone")}</p>

        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-on-primary text-sm font-bold transition-all shadow-md"
        >
          {t("app.close")}
        </button>
      </div>
    </div>
  );
}
