import { api } from "../api";

export const operatingHourService = {
  get: (pharmacyId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/operating-hours`),
  upsert: (pharmacyId, hours) => api("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/operating-hours`, { body: { hours } }),
  declareVacation: (pharmacyId, data) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/vacation`, { body: data }),
};
