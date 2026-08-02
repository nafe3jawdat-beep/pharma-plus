import { api } from "../api";

export const salaryService = {
  getAll: (pharmacyId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/salaries`),
  getOne: (pharmacyId, salaryId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/salaries/${salaryId}`),
  create: (pharmacyId, data) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/salaries`, { body: data }),
  update: (pharmacyId, salaryId, data) => api("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/salaries/${salaryId}`, { body: data }),
  remove: (pharmacyId, salaryId) => api("DELETE", `/api/v1/pharmacist/pharmacies/${pharmacyId}/salaries/${salaryId}`),
};
