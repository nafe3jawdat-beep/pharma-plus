import { useTranslation } from "react-i18next";

const dosageOptions = [
  { id: "Tablet", label: "drugs.tablet", icon: "pill" },
  { id: "Syrup", label: "drugs.syrup", icon: "water_drop" },
  { id: "Injection", label: "drugs.injection", icon: "vaccines" },
  { id: "Capsule", label: "drugs.capsule", icon: "medical_services" },
  { id: "Other", label: "drugs.other", icon: "add" },
];

export default function DosageFormPicker({ selectedForm, onSelect }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {dosageOptions.map((opt) => {
          const active = selectedForm === opt.id;
          return (
            <button key={opt.id} type="button" onClick={() => onSelect(opt.id)}
              className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2.5 transition-all border ${
                active
                  ? "bg-primary-container/30 border-primary text-primary font-bold shadow-sm"
                  : "bg-surface border-surface-container-high text-on-surface-variant font-medium hover:border-primary/30 hover:bg-surface-container/50"
              }`}>
              <span className="material-symbols-outlined text-lg">{opt.icon}</span>
              {t(opt.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
