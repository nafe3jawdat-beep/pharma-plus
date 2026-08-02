import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Upload, Navigation, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTranslation } from "react-i18next";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapRecenter({ position }) {
  const map = useMap();
  if (position) {
    map.setView(position, 15);
  }
  return <Marker position={position} />;
}

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

const validate = (t) => (data) => {
  const errors = {};
  if (!data.pharmacyName.trim()) {
    errors.pharmacyName = t("validation.pharmacyNameRequired");
  }
  if (!data.primaryContact.trim()) {
    errors.primaryContact = t("validation.contactRequired");
  } else if (!/^[\d\s\-+()]{7,}$/.test(data.primaryContact)) {
    errors.primaryContact = t("validation.validContact");
  }
  if (!data.supportEmail.trim()) {
    errors.supportEmail = t("validation.emailRequiredGeneric");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.supportEmail)) {
    errors.supportEmail = t("validation.validEmailGeneric");
  }
  if (!data.fullAddress.trim()) {
    errors.fullAddress = t("validation.addressRequired");
  }
  return errors;
};

function inputClass(error) {
  return `w-full bg-surface-container/50 px-4 py-3 rounded-xl text-sm text-on-surface placeholder:text-outline-variant/50 outline-none transition-all duration-200 border ${
    error
      ? "border-rose-300/60 focus:border-rose-400 focus:ring-2 focus:ring-rose-300/20"
      : "border-transparent focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
  } focus:bg-surface-container-lowest`;
}

export default function PharmacyForm({ initialData, onSubmit, submitLabel, isSubmitting, submitIcon }) {
  const { t } = useTranslation();
  const [position, setPosition] = useState(
    initialData?.latitude && initialData?.longitude
      ? [parseFloat(initialData.latitude), parseFloat(initialData.longitude)]
      : [40.7128, -74.0060]
  );
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(initialData?.front_image || null);
  const [isLocating, setIsLocating] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageDragOver, setImageDragOver] = useState(false);

  const [formData, setFormData] = useState({
    pharmacyName: initialData?.name || "",
    primaryContact: initialData?.support_number || initialData?.phone || "",
    supportEmail: initialData?.support_email || initialData?.email || "",
    fullAddress: initialData?.address || "",
    storefrontImage: null,
  });

  useEffect(() => {
    return () => {
      if (imagePreview && !initialData?.front_image) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const sanitized = id === "primaryContact" ? value.replace(/[^\d\s\-+()]/g, "") : value;
    setFormData((prev) => ({ ...prev, [id]: sanitized }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const fetchAddress = async (lat, lng) => {
    setIsLocating(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setFormData((prev) => ({ ...prev, fullAddress: data.display_name }));
        if (errors.fullAddress) {
          setErrors((prev) => ({ ...prev, fullAddress: "" }));
        }
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t("errors.noGeolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchAddress(latitude, longitude);
      },
      (err) => {
        const messages = {
          1: t("errors.locationDenied"),
          2: t("errors.locationUnavailable"),
          3: t("errors.locationTimeout"),
        };
        alert(messages[err.code] || t("errors.locationFailed"));
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMapClick = (latlng) => {
    const { lat, lng } = latlng;
    setPosition([lat, lng]);
    fetchAddress(lat, lng);
  };

  const handleFileChange = (file) => {
    if (file && file.type.startsWith("image/")) {
      setFormData((prev) => ({ ...prev, storefrontImage: file }));
      setImagePreview((prev) => {
        if (prev && !initialData?.front_image) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      if (errors.storefrontImage) {
        setErrors((prev) => ({ ...prev, storefrontImage: "" }));
      }
    } else {
      alert(t("errors.invalidImage"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(t)(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const dataToSend = new FormData();
    dataToSend.append("name", formData.pharmacyName);
    dataToSend.append("support_number", formData.primaryContact);
    dataToSend.append("support_email", formData.supportEmail);
    dataToSend.append("address", formData.fullAddress);
    dataToSend.append("latitude", position[0]);
    dataToSend.append("longitude", position[1]);

    if (formData.storefrontImage) {
      dataToSend.append("front_image", formData.storefrontImage);
    }

    await onSubmit(dataToSend, { lat: position[0], lng: position[1] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section: Pharmacy Identity */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
        <div className="px-8 pt-7 pb-6">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/15">
              <span className="material-symbols-outlined text-on-primary text-lg">store</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">{t("pharmacy.pharmacyIdentity")}</h2>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">{t("pharmacy.publicProfileDesc")}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold tracking-[0.06em] uppercase text-on-surface-variant ml-1 block mb-1.5">{t("pharmacy.officialName")}</label>
              <input type="text" id="pharmacyName" value={formData.pharmacyName} onChange={handleInputChange}
                className={inputClass(errors.pharmacyName)}
                placeholder={t("placeholders.pharmacyName")} />
              {errors.pharmacyName && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-rose-500 font-medium ml-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.pharmacyName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-bold tracking-[0.06em] uppercase text-on-surface-variant ml-1 block mb-1.5">{t("pharmacy.primaryContact")}</label>
                <input type="tel" id="primaryContact" value={formData.primaryContact} onChange={handleInputChange}
                  className={inputClass(errors.primaryContact)}
                  placeholder={t("placeholders.contactNumber")} />
                {errors.primaryContact && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-rose-500 font-medium ml-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.primaryContact}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-[0.06em] uppercase text-on-surface-variant ml-1 block mb-1.5">{t("pharmacy.supportEmail")}</label>
                <input type="email" id="supportEmail" value={formData.supportEmail} onChange={handleInputChange}
                  className={inputClass(errors.supportEmail)}
                  placeholder={t("placeholders.pharmacyEmail")} />
                {errors.supportEmail && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-rose-500 font-medium ml-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.supportEmail}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold tracking-[0.06em] uppercase text-on-surface-variant ml-1 block mb-1.5">{t("pharmacy.storefrontImage")}</label>
              <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files[0])}
                accept="image/*" className="hidden" />
              <div
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                onDragLeave={() => setImageDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setImageDragOver(false); handleFileChange(e.dataTransfer.files[0]); }}
                className={`relative w-full h-40 rounded-xl flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 overflow-hidden group ${
                  imageDragOver
                    ? "border-2 border-primary/40 bg-primary/[0.03]"
                    : imagePreview
                      ? "border border-surface-container-high bg-surface-container/20"
                      : "border-2 border-dashed border-outline-variant/30 hover:border-primary/30 hover:bg-primary/[0.02]"
                } ${errors.storefrontImage ? "border-rose-300" : ""}`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="relative flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white text-xs font-bold mt-auto mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload size={14} />
                      {t("pharmacy.clickToChange")}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center">
                      <Upload size={20} className="text-primary/60" />
                    </div>
                    <div className="flex flex-col items-center text-xs">
                      <span className="font-bold text-on-surface">{t("pharmacy.clickToUpload")}</span>
                      <span className="text-on-surface-variant/60 mt-0.5">{t("pharmacy.imageHint")}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Address & Map */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
        <div className="px-8 pt-7 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/15">
                <span className="material-symbols-outlined text-white text-lg">location_on</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">{t("pharmacy.addressCoordinates")}</h2>
                <p className="text-xs text-on-surface-variant/70 mt-0.5">{t("pharmacy.dataVerificationDesc")}</p>
              </div>
            </div>
            <button type="button" onClick={handleGetCurrentLocation}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all whitespace-nowrap">
              <Navigation size={14} className="rotate-45" />
              {t("pharmacy.useCurrentLocation")}
            </button>
          </div>

          <div className="space-y-5">
            <div className="relative">
              <textarea id="fullAddress" value={formData.fullAddress} onChange={handleInputChange}
                rows="2"
                className={`w-full bg-surface-container/50 px-4 py-3 rounded-xl text-sm text-on-surface placeholder:text-outline-variant/50 outline-none transition-all duration-200 resize-none border ${
                  errors.fullAddress
                    ? "border-rose-300/60 focus:border-rose-400 focus:ring-2 focus:ring-rose-300/20"
                    : "border-transparent focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                } focus:bg-surface-container-lowest pr-10`}
                placeholder={t("pharmacy.addressPlaceholder")} />
              {isLocating && (
                <div className="absolute right-3.5 top-3.5 text-on-surface-variant animate-spin">
                  <Loader2 size={16} />
                </div>
              )}
              {errors.fullAddress && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-rose-500 font-medium ml-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.fullAddress}
                </p>
              )}
            </div>

            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-surface-container-high">
              <MapContainer center={position} zoom={14} zoomControl={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapEvents onMapClick={handleMapClick} />
                <MapRecenter position={position} />
              </MapContainer>

              <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-surface-container-high z-[1000]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                  <span className="text-[11px] font-semibold text-on-surface-variant tracking-wide">
                    {position[0].toFixed(4)}, {position[1].toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-3 right-3 bg-surface-container-lowest/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg z-[1000]">
                <p className="text-[10px] text-on-surface-variant/50 font-medium">{t("pharmacy.clickMapHint")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dim text-on-primary text-sm font-bold transition-all duration-200 flex items-center gap-2.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0">
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            submitIcon || <span className="material-symbols-outlined text-sm">check</span>
          )}
          {isSubmitting ? t("pharmacy.submitting") : submitLabel || t("pharmacy.continue")}
        </button>
      </div>
    </form>
  );
}
