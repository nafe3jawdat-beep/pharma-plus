import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { authApi } from "../../services/pharmacist";
import toast from "react-hot-toast";

export default function VerificationPanel({ verificationStatus, refreshPharmacies }) {
  const { t } = useTranslation();
  const [cardFile, setCardFile] = useState(null);
  const [cardPreview, setCardPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const statusLabels = {
    approved: { label: t("profile.verified"), class: 'bg-green-100 text-green-700', icon: 'check_circle' },
    pending: { label: t("profile.pending"), class: 'bg-amber-100 text-amber-700', icon: 'pending' },
    unverified: { label: t("profile.unverified"), class: 'bg-gray-100 text-gray-600', icon: 'cancel' },
  };
  const status = statusLabels[verificationStatus] || statusLabels.unverified;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCardFile(file);
    setCardPreview(URL.createObjectURL(file));
  };

  const handleUploadCard = async () => {
    if (!cardFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('syndicate_card', cardFile);
      await authApi.verify(formData);
      toast.success(t("profile.cardSubmitted"));
      setCardFile(null);
      setCardPreview(null);
      if (refreshPharmacies) refreshPharmacies();
    } catch (err) {
      toast.error(err.response?.data?.message || t("profile.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <h2 className="text-base font-semibold text-on-surface">{t("profile.accountVerification")}</h2>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status.class}`}>
          <span className="material-symbols-outlined text-sm">{status.icon}</span>
          {status.label}
        </span>
      </div>

      {verificationStatus === 'approved' ? (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-green-600">verified</span>
          <p className="text-sm text-green-700 font-medium">{t("profile.verifiedMessage")}</p>
        </div>
      ) : verificationStatus === 'pending' ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
          <p className="text-sm text-amber-700 font-medium">{t("profile.pendingMessage")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-on-surface-variant">{t("profile.uploadCard")}</p>
          <div className="flex flex-col gap-3">
            <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("profile.syndicateCard")}</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
            <div onClick={() => fileInputRef.current.click()} className="w-full h-40 bg-surface-container/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-container/50 border-2 border-dashed border-outline-variant transition-colors relative overflow-hidden">
              {cardPreview ? (
                <>
                  <img src={cardPreview} alt="Card preview" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-bold">{t("app.clickToChange")}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-ambient-sm">
                    <span className="material-symbols-outlined text-primary">description</span>
                  </div>
                  <div className="flex flex-col items-center text-xs">
                    <span className="font-bold text-on-surface">{t("profile.uploadSyndicateCard")}</span>
                    <span className="text-on-surface-variant">{t("profile.fileHint")}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleUploadCard} disabled={!cardFile || uploading} className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-on-primary text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
              {uploading ? (
                <><span className="material-symbols-outlined text-sm animate-spin">refresh</span>{t("profile.uploading")}</>
              ) : (
                <><span className="material-symbols-outlined text-sm">upload</span>{t("profile.submitVerification")}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
