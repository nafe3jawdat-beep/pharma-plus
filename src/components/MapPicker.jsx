import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function MapPicker({
  setValue,
}) {
  const { t } = useTranslation();
  const [coords, setCoords] =
    useState({
      lat: 33.5138,
      lng: 36.2765,
    });

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        setCoords({
          lat,
          lng,
        });

        setValue(
          "latitude",
          lat
        );

        setValue(
          "longitude",
          lng
        );
      },
      (err) => {
        if (err.code === 1) {
          toast.error(t("pharmacy.locationDenied"));
        } else {
          toast.error(t("pharmacy.locationError"));
        }
      }
    );
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={getLocation}
        className="text-primary font-bold"
      >
        {t("pharmacy.useCurrentLocation")}
      </button>

      <div className="h-72 rounded-3xl bg-surface-container-high flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl">
            📍
          </div>

          <p className="font-bold">
            {coords.lat.toFixed(4)}
          </p>

          <p className="font-bold">
            {coords.lng.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}
