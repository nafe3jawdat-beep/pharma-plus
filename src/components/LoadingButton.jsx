import { useTranslation } from "react-i18next";

export default function LoadingButton({
  loading,
  children,
}) {
  const { t } = useTranslation();
  return (
    <button
      type="submit"
      disabled={loading}
      className="bg-primary text-on-primary px-8 py-4 rounded-xl disabled:opacity-50"
    >
      {loading
        ? t("app.loading")
        : children}
    </button>
  );
}
