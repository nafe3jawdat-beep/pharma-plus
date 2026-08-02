import { api } from "../api";

export const expenseService = {
  getAll: (pharmacyId, params) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/expenses`, { params }),
  getOne: (pharmacyId, expenseId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/expenses/${expenseId}`),
  create: (pharmacyId, formData) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/expenses`, { body: formData }),
  update: (pharmacyId, expenseId, formData) => api("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/expenses/${expenseId}`, { body: formData }),
  remove: (pharmacyId, expenseId) => api("DELETE", `/api/v1/pharmacist/pharmacies/${pharmacyId}/expenses/${expenseId}`),
};
