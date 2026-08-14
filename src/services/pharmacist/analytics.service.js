import { api } from "../api";

export const analyticsApi = {
  fetchDemandMap: (pharmacyId, params) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/demand-map`, { params }),
  generateDemandSummary: (pharmacyId) =>
    api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/ai-insights/epidemic`),
  getAiDemand: (pharmacyId) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/ai-insights/epidemic`),
};
