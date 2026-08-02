import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import PharmacyForm from "../components/PharmacyForm";
import OperatingHoursEditor from "../components/OperatingHoursEditor";
import { pharmacyApi } from "../services/pharmacist";
import { dashboardApi } from "../services/pharmacist";
import { operatingHourService } from "../services/pharmacist";

export default function EditPharmacyPage() {
  const { selectedPharmacy } = useOutletContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [initialHours, setInitialHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedPharmacy?.id) {
      setLoading(false);
      return;
    }
    const pharmacyId = selectedPharmacy.id;

    Promise.all([
      dashboardApi.getPharmacyDetail(pharmacyId),
      operatingHourService.get(pharmacyId),
    ])
      .then(([pharmRes, hoursRes]) => {
        const data = pharmRes.data || pharmRes;
        setInitialData(data);
        setInitialHours(hoursRes?.data ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedPharmacy?.id]);

  const handleUpdate = async (formData) => {
    if (!selectedPharmacy?.id) return;
    setIsSubmitting(true);
    try {
      await pharmacyApi.update(selectedPharmacy.id, formData);
      toast.success(t("pharmacy.pharmacyUpdated"));
      navigate("/Dashboard");
    } catch {
      toast.error(t("errors.updateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedPharmacy?.id) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/50 text-2xl">store</span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">{t("errors.noPharmacySelected")}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-primary text-2xl">refresh</span>
          <p className="text-sm text-on-surface-variant font-medium">{t("pharmacy.loadingData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative max-w-3xl mx-auto px-8 py-10 pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="mb-8">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-lg">store</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t("pharmacy.editPharmacy")}</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">{selectedPharmacy.name} — {t("pharmacy.editDescription")}</p>
              </div>
            </div>
          </div>

          {initialData && (
            <div className="mb-12">
              <PharmacyForm
                initialData={initialData}
                onSubmit={handleUpdate}
                submitLabel={t("pharmacy.saveChanges")}
                isSubmitting={isSubmitting}
                submitIcon={<span className="material-symbols-outlined text-sm">save</span>}
              />
            </div>
          )}

          <div className="border-t border-surface-container-high pt-10 mb-8">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-lg">schedule</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface tracking-tight">{t("pharmacy.editOperatingHours")}</h2>
                <p className="text-xs text-on-surface-variant/70 mt-0.5">{t("pharmacy.operatingHoursDesc")}</p>
              </div>
            </div>

            <OperatingHoursEditor
              pharmacyId={selectedPharmacy.id}
              initialHours={initialHours}
              onSaved={() => {
                toast.success(t("pharmacy.operatingHoursUpdated"));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
