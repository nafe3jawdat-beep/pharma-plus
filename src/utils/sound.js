const SOUND_KEY = "order_sound_enabled";
const COOLDOWN_MS = 1500;

let ctx = null;
let lastPlayed = 0;

function getContext() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isOrderSoundEnabled() {
  return localStorage.getItem(SOUND_KEY) !== "0";
}

export function setOrderSoundEnabled(enabled) {
  localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
}

function tone(audioCtx, freq, start, duration, volume) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + start + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + start);
  osc.stop(audioCtx.currentTime + start + duration + 0.05);
}

export function playOrderSound() {
  if (!isOrderSoundEnabled()) return;
  const now = Date.now();
  if (now - lastPlayed < COOLDOWN_MS) return;
  lastPlayed = now;

  const audioCtx = getContext();
  if (!audioCtx) return;

  try {
    tone(audioCtx, 880, 0, 0.18, 0.18);
    tone(audioCtx, 1174.66, 0.14, 0.22, 0.16);
    tone(audioCtx, 1567.98, 0.28, 0.28, 0.14);
  } catch {
    /* ignore audio errors */
  }
}

if (typeof window !== "undefined") {
  const unlock = () => {
    const audioCtx = getContext();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}
