import { api } from "../api";

export const proposalsApi = {
  create: (formData) =>
    api("POST", "/api/v1/pharmacist/proposals", { body: formData }),
  list: (params) =>
    api("GET", "/api/v1/pharmacist/proposals", { params }),
  show: (id) =>
    api("GET", `/api/v1/pharmacist/proposals/${id}`),
};
