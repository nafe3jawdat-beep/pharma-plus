import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function SendCountdownToast({ totalMs = 3000, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(Math.max(1, Math.ceil(totalMs / 1000)));
  const done = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    const started = Date.now();
    const interval = setInterval(() => {
      const left = Math.ceil((totalMs - (Date.now() - started)) / 1000);
      setSeconds(Math.max(0, left));
    }, 200);
    const timer = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onConfirmRef.current?.();
    }, totalMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [totalMs]);

  const fireCancel = () => {
    if (done.current) return;
    done.current = true;
    onCancelRef.current?.();
  };

  return (
    <div className="relative overflow-hidden flex items-center gap-3.5 bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-lg pl-5 pr-3 py-3.5 w-[340px] max-w-[calc(100vw-2rem)]">
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-primary/20" />
      <span className="relative w-11 h-11 rounded-full flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
        <span className="material-symbols-outlined text-xl">schedule_send</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-on-surface leading-tight">{t("sendGrace.sendingIn", { seconds })}</span>
        <span className="block text-xs text-on-surface-variant/70 mt-0.5">{t("sendGrace.hint")}</span>
      </span>
      <button
        type="button"
        onClick={fireCancel}
        className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold transition-colors hover:bg-error/10 hover:text-error"
      >
        {t("sendGrace.cancel")}
      </button>
    </div>
  );
}
