import { api } from "../api";

export const productApi = {
  create: (pharmacyId, data) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/products`, { body: data }),
  list: (pharmacyId, params) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/products`, { params }),
  show: (pharmacyId, productId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/products/${productId}`),
  update: (pharmacyId, productId, data) => api("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/products/${productId}`, { body: data }),
  remove: (pharmacyId, productId) => api("DELETE", `/api/v1/pharmacist/pharmacies/${pharmacyId}/products/${productId}`),
};
