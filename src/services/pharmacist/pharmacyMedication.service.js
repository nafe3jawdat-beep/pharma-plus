import { api } from "../api";

export const pharmacyMedicationApi = {
  create: (pharmacyId, data) =>
    api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/medications`, { body: data }),
  list: (pharmacyId) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/medications`),
};
