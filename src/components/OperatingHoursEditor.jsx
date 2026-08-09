import { useState } from "react";
import { useTranslation } from "react-i18next";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function defaultHours() {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    is_closed: false,
    is_24_hours: false,
    opening_time: "09:00",
    closing_time: "18:00",
  }));
}

function toTime(value) {
  if (!value || value === "null") return "";
  return value.length === 5 ? value : value;
}

export default function OperatingHoursEditor({ pharmacyId, initialHours, onSaved }) {
  const { t } = useTranslation();
  const [hours, setHours] = useState(() => {
    if (initialHours && initialHours.length === 7) {
      return initialHours.map((h) => ({
        day_of_week: typeof h.day_of_week === "string" ? parseInt(h.day_of_week) : h.day_of_week,
        is_closed: h.is_closed ?? false,
        is_24_hours: h.is_24_hours ?? false,
        opening_time: toTime(h.opening_time),
        closing_time: toTime(h.closing_time),
      })).sort((a, b) => a.day_of_week - b.day_of_week);
    }
    return defaultHours();
  });
  const [saving, setSaving] = useState(false);

  const [vacationFrom, setVacationFrom] = useState(0);
  const [vacationTo, setVacationTo] = useState(6);
  const [declaring, setDeclaring] = useState(false);

  const toggleClosed = (dayIndex) => {
    setHours((prev) => prev.map((h, i) =>
      i === dayIndex ? { ...h, is_closed: !h.is_closed, is_24_hours: false } : h
    ));
  };

  const toggle24h = (dayIndex) => {
    setHours((prev) => prev.map((h, i) =>
      i === dayIndex ? { ...h, is_24_hours: !h.is_24_hours, is_closed: false } : h
    ));
  };

  const setTime = (dayIndex, field, value) => {
    setHours((prev) => prev.map((h, i) =>
      i === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { operatingHourService } = await import("../services/pharmacist");
      const payload = hours.map((h) => ({
        day_of_week: h.day_of_week,
        opening_time: h.is_closed || h.is_24_hours ? null : h.opening_time || null,
        closing_time: h.is_closed || h.is_24_hours ? null : h.closing_time || null,
        is_24_hours: h.is_24_hours || null,
        is_closed: h.is_closed || null,
      }));
      await operatingHourService.upsert(pharmacyId, payload);
      onSaved?.();
    } catch (err) {
      alert(err.response?.data?.message || err.message || t("pharmacy.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeclareVacation = async () => {
    setDeclaring(true);
    try {
      const { operatingHourService } = await import("../services/pharmacist");
      await operatingHourService.declareVacation(pharmacyId, {
        start_day: vacationFrom,
        end_day: vacationTo,
      });
      onSaved?.();
    } catch (err) {
      alert(err.response?.data?.message || err.message || t("pharmacy.saveFailed"));
    } finally {
      setDeclaring(false);
    }
  };

  const now = new Date();
  const todayIdx = now.getDay();

  const inputCls = "w-full bg-surface border border-surface-container-high px-1.5 py-1 rounded text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-container/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">schedule</span>
          </div>
          <h2 className="text-base font-semibold text-on-surface">{t("pharmacy.operatingHours")}</h2>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 p-4">
        {hours.map((day, i) => {
          const isToday = day.day_of_week === todayIdx;
          const disabled = day.is_closed || day.is_24_hours;
          return (
            <div
              key={day.day_of_week}
              className={`rounded-xl border transition-all flex flex-col items-center gap-1.5 p-2 ${
                isToday
                  ? 'border-primary/30 bg-primary-container/5 ring-1 ring-primary/10'
                  : 'border-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {DAY_ABBR[day.day_of_week]}
                </span>
                {isToday && (
                  <span className="text-[8px] font-semibold text-white bg-primary px-1 py-0.5 rounded-full leading-none">
                    {t("app.today")}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-0.5 w-full">
                <input type="time" value={day.opening_time || ""} onChange={(e) => setTime(i, "opening_time", e.target.value)} disabled={disabled} className={inputCls} />
                <span className="text-[9px] text-on-surface-variant">—</span>
                <input type="time" value={day.closing_time || ""} onChange={(e) => setTime(i, "closing_time", e.target.value)} disabled={disabled} className={inputCls} />
              </div>

              <div className="flex items-center gap-1 mt-0.5">
                <button type="button" onClick={() => toggleClosed(i)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
                    day.is_closed
                      ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {t("pharmacy.closed")}
                </button>
                <button type="button" onClick={() => toggle24h(i)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
                    day.is_24_hours
                      ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  24h
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end px-6 py-4 border-t border-surface-container-high">
        <button type="button" onClick={handleSave} disabled={saving}
          className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dim text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
          {saving ? t("pharmacy.saving") : t("pharmacy.saveHours")}
        </button>
      </div>

      <div className="border-t border-surface-container-high px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-600 text-lg">beach_access</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">{t("pharmacy.declareVacation")}</h3>
            <p className="text-xs text-on-surface-variant">{t("pharmacy.declareVacationDesc")}</p>
          </div>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("pharmacy.from")}</label>
            <select value={vacationFrom} onChange={(e) => { const v = parseInt(e.target.value); setVacationFrom(v); if (vacationTo < v) setVacationTo(v); }}
              className="bg-surface border border-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i} disabled={i > vacationTo}>{t(`days.${name}`)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">{t("pharmacy.to")}</label>
            <select value={vacationTo} onChange={(e) => { const v = parseInt(e.target.value); setVacationTo(v); if (vacationFrom > v) setVacationFrom(v); }}
              className="bg-surface border border-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i} disabled={i < vacationFrom}>{t(`days.${name}`)}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleDeclareVacation} disabled={declaring}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {declaring && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
            {declaring ? t("pharmacy.declaring") : t("pharmacy.declareVacationBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
