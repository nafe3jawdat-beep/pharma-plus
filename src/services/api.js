import { db } from './db';
import { reportApiResult } from './connectivity';

export const BaseUrl = import.meta.env.VITE_API_URL || "";

export async function api(method, path, opts = {}) {
  const { body, params, signal } = opts;

  const url = BaseUrl ? new URL(BaseUrl + path) : new URL(path, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }

  const headers = { "Accept": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = "Bearer " + token;

  const isFormData = body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const payload = body ? (isFormData ? body : JSON.stringify(body)) : undefined;

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload, signal });
  } catch (err) {
    if (err?.name !== 'AbortError') reportApiResult(false);
    throw err;
  }
  reportApiResult(true);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.message || "Request failed");
    err.response = { data, status: res.status };
    throw err;
  }
  return data;
}

export async function offlineApi(method, path, opts = {}) {
  try {
    return await api(method, path, opts);
  } catch (err) {
    if (!err.response && !navigator.onLine) {
      await db.pendingActions.add({
        type: 'API_CALL',
        endpoint: path,
        method: method,
        body: opts.body || null,
        dependsOn: null,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        attempts: 0,
        lastError: null,
      });
      return { queued: true, offline: true };
    }
    throw err;
  }
}
