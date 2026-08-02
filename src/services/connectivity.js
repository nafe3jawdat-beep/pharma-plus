let backendReachable = null;
const listeners = new Set();

export function reportApiResult(ok) {
  if (backendReachable === ok) return;
  backendReachable = ok;
  listeners.forEach((fn) => fn(backendReachable));
}

export function isBackendReachable() {
  return backendReachable;
}

export function subscribeBackend(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
