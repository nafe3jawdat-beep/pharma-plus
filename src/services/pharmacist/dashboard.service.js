import { api } from "../api";

export const dashboardApi = {
  getPharmacyDetail: (pharmacyId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}`),
};
