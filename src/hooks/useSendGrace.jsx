import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import SendCountdownToast from "../components/SendCountdownToast";

export function useSendGrace({ delayMs = 3000, onConfirm, onCancel }) {
  const [isActive, setIsActive] = useState(false);
  const activeRef = useRef(false);
  const toastIdRef = useRef(null);
  const onConfirmRef = useRef(onConfirm);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
    onCancelRef.current = onCancel;
  });

  const begin = useCallback((...args) => {
    if (activeRef.current) return false;
    activeRef.current = true;
    setIsActive(true);

    const id = toast.custom(
      (t) => (
        <SendCountdownToast
          totalMs={delayMs}
          onConfirm={() => {
            if (!activeRef.current) return;
            activeRef.current = false;
            setIsActive(false);
            toast.dismiss(t.id);
            onConfirmRef.current?.(...args);
          }}
          onCancel={() => {
            if (!activeRef.current) return;
            activeRef.current = false;
            setIsActive(false);
            toast.dismiss(t.id);
            onCancelRef.current?.(...args);
          }}
        />
      ),
      { duration: Infinity }
    );
    toastIdRef.current = id;
    return true;
  }, [delayMs]);

  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, []);

  return { begin, isActive };
}
