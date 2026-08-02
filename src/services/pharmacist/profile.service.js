import { api } from "../api";

export const profileService = {
  updateProfile: (data) => api("PUT", "/api/v1/pharmacist/update-profile", { body: data }),
};
