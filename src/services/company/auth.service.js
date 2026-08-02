import { api } from "../api";

export const companyAuthApi = {
  login: (credentials) => api("POST", "/api/v1/company/login", { body: credentials }),
  register: (data) => api("POST", "/api/v1/company/register", { body: data }),
  logout: () => api("POST", "/api/v1/company/logout"),
  profile: () => api("GET", "/api/v1/company/profile"),
};
