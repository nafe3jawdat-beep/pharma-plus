import { api, offlineApi } from "../api";

export const batchApi = {
  list: (pharmacyId, itemId, page) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}/batches`, { params: { page } }),

  get: (pharmacyId, itemId, batchId) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}/batches/${batchId}`),

  create: (pharmacyId, itemId, data) =>
    offlineApi("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}/batches`, { body: data }),

  update: (pharmacyId, itemId, batchId, data) =>
    offlineApi("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}/batches/${batchId}`, { body: data }),

  delete: (pharmacyId, itemId, batchId) =>
    offlineApi("DELETE", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}/batches/${batchId}`),
};
