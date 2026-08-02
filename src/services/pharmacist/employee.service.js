import { api, offlineApi } from "../api";

export const employeeService = {
  getAll: (pharmacyId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/staff`),
  search: (pharmacyId, query) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/staff/search`, { body: { query } }),
  invite: (pharmacyId, targetId) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/staff/invite/${targetId}`),
  create: (pharmacyId, data) => offlineApi("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/staff`, { body: data }),
  update: (pharmacyId, staffId, data) => offlineApi("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/staff/${staffId}`, { body: data }),
  remove: (pharmacyId, staffId) => offlineApi("DELETE", `/api/v1/pharmacist/pharmacies/${pharmacyId}/staff/${staffId}`),
  joinRequest: (pharmacyId) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/join-request`),
  myPermissions: (pharmacyId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/permissions`),
};
