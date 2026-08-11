import { api } from "../api";

export const reportsApi = {
  financialSummary: (pharmacyId, params) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/financial-summary`, { params }),
  topMedications: (pharmacyId, params) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/top-medications`, { params }),
  demand: (pharmacyId, params) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/demand`, { params }),
  expiringInventory: (pharmacyId, params) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/inventory-expiring`, { params }),
  slowMoving: (pharmacyId, params) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/slow-moving`, { params }),
  staffPerformance: (pharmacyId, params) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/staff-performance`, { params }),
  aiInsights: (pharmacyId) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/ai-insights`),
  generateAiInsights: (pharmacyId, params) =>
    api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/reports/ai-insights`, { params }),
};
