import { api } from "../api";

export const analyticsApi = {
  
  fetchDemandMap: (pharmacyId, params) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/demand-map`, { params }),
};
