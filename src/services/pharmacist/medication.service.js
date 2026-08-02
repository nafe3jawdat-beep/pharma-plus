import { api } from "../api";

export const medicationApi = {
  fetchAll: (params = {}) => api("GET", "/api/v1/medications", { params }),
  getCategories: () => api("GET", "/api/v1/categories"),
  getTitlesForCategory: (categoryId) => api("GET", `/api/v1/categories/${categoryId}/titles`),
  getUsagesForTitle: (titleId) => api("GET", `/api/v1/titles/${titleId}/usages`),
};
