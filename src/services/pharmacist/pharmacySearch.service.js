import { api } from "../api";

export const pharmacySearchApi = {
  search: (query) => api("GET", "/api/v1/pharmacist/pharmacies/search", { params: { query } }),
};
