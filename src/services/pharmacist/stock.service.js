import { api } from "../api";

export const stockApi = {
  fetchInventory: (pharmacyId, page = 1) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory`, { params: { page } }),
  fetchLowStock: (pharmacyId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/low-stock`),
  addItem: (pharmacyId, data) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory`, { body: { items: [data] } }),
  bulkAddItems: (pharmacyId, items) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory`, { body: { items } }),
  updateItem: (pharmacyId, itemId, data) => api("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}`, { body: data }),
  bulkUpdateItems: (pharmacyId, items) => api("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory`, { body: { items } }),
  deleteItem: (pharmacyId, itemId) => api("DELETE", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}`),
};

export const posApi = {
  findItem: (pharmacyId, barcode, opts = {}) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/pos/find-item`, { params: { search: barcode }, signal: opts.signal }),
  checkout: (pharmacyId, items) =>
    api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/pos/checkout`, { body: { items } }),
  damaged: (pharmacyId, data) =>
    api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/pos/damaged`, { body: data }),
  return: (pharmacyId, data) =>
    api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/pos/return`, { body: data }),
  reverseDamage: (pharmacyId, data) =>
    api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/pos/reverse-damage`, { body: data }),
  purchase: (pharmacyId, data) =>
    api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/pos/purchase`, { body: data }),
};
