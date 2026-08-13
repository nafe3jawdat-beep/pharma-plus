import { useState, useEffect, useCallback } from "react";

let deferredPrompt = null;
let installFired = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

function onBeforeInstallPrompt(e) {
  e.preventDefault();
  deferredPrompt = e;
  notify();
}

function onAppInstalled() {
  deferredPrompt = null;
  installFired = true;
  notify();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true
  );
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(deferredPrompt);
  const [installed, setInstalled] = useState(installFired);

  useEffect(() => {
    const update = () => {
      setPrompt(deferredPrompt);
      setInstalled(installFired);
    };
    listeners.add(update);
    return () => listeners.delete(update);
  }, []);

  const promptInstall = useCallback(async () => {
    const event = deferredPrompt;
    if (!event) return false;
    event.prompt();
    const { outcome } = await event.userChoice;
    deferredPrompt = null;
    notify();
    return outcome === "accepted";
  }, []);

  return {
    deferredPrompt: prompt,
    isStandalone: isStandalone(),
    justInstalled: installed,
    promptInstall,
  };
}
