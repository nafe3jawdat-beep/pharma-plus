import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import PharmacyForm from "../components/PharmacyForm";
import OperatingHoursEditor from "../components/OperatingHoursEditor";
import { pharmacyApi } from "../services/pharmacist";

export default function AddPharmacyPage() {
  const { selectedPharmacy, refreshPharmacies, canCreatePharmacy } = useOutletContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = location.pathname.includes("/EditPharmacy");

  const [initialData, setInitialData] = useState(null);
  const [operatingHours, setOperatingHours] = useState(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPharmacyId, setCreatedPharmacyId] = useState(null);

  const pharmacyId = isEdit ? selectedPharmacy?.id : createdPharmacyId;

  useEffect(() => {
    if (!isEdit) return;
    if (!selectedPharmacy?.id) {
      setIsLoading(false); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    pharmacyApi
      .getProfile(selectedPharmacy.id)
      .then((res) => {
        const pharmacy = res.data || res;
        setInitialData({
          name: pharmacy.name,
          address: pharmacy.address,
          latitude: pharmacy.latitude,
          longitude: pharmacy.longitude,
          support_number: pharmacy.support_number,
          support_email: pharmacy.support_email,
          front_image: pharmacy.front_image,
        });
        if (pharmacy.operating_hours) {
          setOperatingHours(pharmacy.operating_hours);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isEdit, selectedPharmacy?.id]);

  if (!isEdit && !canCreatePharmacy) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/50 text-2xl">lock</span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">{t("pharmacy.creationUnavailable")}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData, coords) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await pharmacyApi.update(selectedPharmacy.id, formData);
        refreshPharmacies();
        toast.success(t("pharmacy.pharmacyUpdated"));
        navigate("/Dashboard");
      } else {
        const res = await pharmacyApi.create(formData);
        const created = res.data || res;
        localStorage.setItem("pharmacy_location", JSON.stringify(coords));
        setCreatedPharmacyId(created.id);
      }
    } catch (err) {
      const msg = isEdit ? t("pharmacy.updateFailed") : t("pharmacy.registerFailed");
      toast.error(err.response?.data?.message || err.message || msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-primary text-2xl">refresh</span>
          <p className="text-sm text-on-surface-variant font-medium">{t("pharmacy.loadingData")}</p>
        </div>
      </div>
    );
  }

  if (createdPharmacyId) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative max-w-3xl mx-auto px-8 py-10 pb-32">
          <div className="mb-10">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-lg">schedule</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t("pharmacy.setHours")}</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">{t("pharmacy.setHoursDescription")}</p>
              </div>
            </div>
          </div>
          <OperatingHoursEditor
            pharmacyId={createdPharmacyId}
            onSaved={() => {
              refreshPharmacies();
              toast.success(t("pharmacy.pharmacyRegistered"));
              navigate("/Dashboard");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-8 py-10 pb-32">
          <div className="mb-10">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary text-lg">{isEdit ? "edit" : "add_business"}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                  {isEdit ? t("pharmacy.editPharmacy") : t("pharmacy.addPharmacy")}
                </h1>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {isEdit ? t("pharmacy.editDescription") : t("pharmacy.addDescription")}
                </p>
              </div>
            </div>
          </div>

        {isEdit && !initialData ? (
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-surface-container-high text-center">
            <p className="text-on-surface-variant">{t("pharmacy.notFound")}</p>
          </div>
        ) : (
          <>
            <PharmacyForm
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel={isEdit ? t("pharmacy.saveChanges") : t("pharmacy.registerPharmacy")}
              submitIcon={isEdit ? <Save size={16} /> : undefined}
            />
            {isEdit && pharmacyId && (
              <OperatingHoursEditor
                pharmacyId={pharmacyId}
                initialHours={operatingHours}
                onSaved={() => {
                  toast.success(t("pharmacy.operatingHoursUpdated"));
                }}
              />
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
