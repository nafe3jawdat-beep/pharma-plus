import { api } from "../api";

export const pharmacyApi = {
  create: (formData) => api("POST", "/api/v1/pharmacist/pharmacy", { body: formData }),
  getProfile: (pharmacyId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/profile`),
  update: (pharmacyId, formData) => {
    formData.append("_method", "PUT");
    return api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/profile`, { body: formData });
  },
};
