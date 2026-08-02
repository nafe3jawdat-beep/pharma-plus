import { api } from "./api";

const rolePrefix = (role) => `/api/v1/${role}`;

export const twoFactorService = {
  getStatus: (role) => api("GET", `${rolePrefix(role)}/two-factor/status`),

  enable: (role) => api("POST", `${rolePrefix(role)}/two-factor/enable`),

  confirm: (role, code) =>
    api("POST", `${rolePrefix(role)}/two-factor/confirm`, { body: { code } }),

  disable: (role, password, code) =>
    api("POST", `${rolePrefix(role)}/two-factor/disable`, {
      body: { password, code },
    }),

  verify: (role, twoFactorToken, code) =>
    api("POST", `${rolePrefix(role)}/two-factor/verify`, {
      body: { two_factor_token: twoFactorToken, code },
    }),

  getRecoveryCodes: (role) =>
    api("GET", `${rolePrefix(role)}/two-factor/recovery-codes`),
};
