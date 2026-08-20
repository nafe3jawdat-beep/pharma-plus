import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';

function SkeletonBar({ className }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-lg ${className}`} />;
}

export default function OperatingHours({ operatingHours, loading }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { myPermissions, isOwner } = useOutletContext();

  if (!(isOwner || myPermissions?.operating_hours_manage)) return null;

  return (
    <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-container-high rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-surface-container-high">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">schedule</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">{t("pharmacy.operatingHours")}</h2>
            <p className="text-xs text-on-surface-variant/60">Weekly schedule</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/Dashboard/EditPharmacy')}
          className="text-xs font-bold text-primary hover:text-primary-dim flex items-center gap-1 transition-colors"
        >
          {t("app.edit")}
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
      </div>

      <div className="divide-y divide-surface-container-high">
        {loading ? (
          <div className="p-4 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <SkeletonBar key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : operatingHours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl text-on-surface-variant/50">schedule</span>
            </div>
            <p className="text-sm text-on-surface-variant">{t("app.noData")}</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-2">
            {operatingHours.map((day) => {
              const isToday = new Date().getDay() === day.day_of_week;
              const dayNames = [t("days.sunday"), t("days.monday"), t("days.tuesday"), t("days.wednesday"), t("days.thursday"), t("days.friday"), t("days.saturday")];
              const dayName = dayNames[day.day_of_week];
              return (
                <div
                  key={day.day_of_week}
                  className={`rounded-xl border px-3 py-2.5 transition-all ${
                    isToday
                      ? 'border-primary/30 bg-primary-container/5 ring-1 ring-primary/10'
                      : 'border-surface-container-high hover:border-surface-container-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {i18n.language === "ar" ? dayName : dayName.slice(0, 3)}
                    </span>
                    {isToday && (
                      <span className="text-[7px] font-bold text-white bg-primary px-1 py-0.5 rounded-full leading-none">{t("app.today")}</span>
                    )}
                  </div>
                  {day.is_closed ? (
                    <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full inline-block">{t("pharmacy.closed")}</span>
                  ) : day.is_24_hours ? (
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">{t("pharmacy.24h")}</span>
                  ) : (
                    <p className="text-[11px] font-semibold text-on-surface-variant tabular-nums">
                      {day.opening_time?.slice(0, 5)} — {day.closing_time?.slice(0, 5)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
