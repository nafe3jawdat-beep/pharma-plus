import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function UploadImage({
  image,
  setImage,
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef();

  useEffect(() => {
    return () => {
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [image?.preview]);

  const handleChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  return (
    <>
      <input
        hidden
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleChange}
      />

      <div
        onClick={() =>
          fileInputRef.current.click()
        }
        className="h-56 rounded-3xl border-2 border-dashed border-outline-variant/30 cursor-pointer overflow-hidden flex items-center justify-center bg-surface-container-low"
      >
        {image ? (
          <img
            src={image.preview}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <h4 className="font-bold">
              {t("pharmacy.clickToUpload")}
            </h4>

              <p className="text-on-surface-variant text-sm">
              {t("pharmacy.imageHint")}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
