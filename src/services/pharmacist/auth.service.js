import { api } from "../api";

export const authApi = {
  register: (data) => api("POST", "/api/v1/pharmacist/register", { body: data }),
  companyRegister: (data) => api("POST", "/api/v1/company/register", { body: data }),
  login: (credentials) => api("POST", "/api/v1/pharmacist/login", { body: credentials }),
  dashboard: () => api("GET", "/api/v1/pharmacist/dashboard"),
  getProfile: () => api("GET", "/api/v1/pharmacist/profile"),
  verify: (data) => api("POST", "/api/v1/pharmacist/verify", { body: data }),
  verificationStatus: () => api("GET", "/api/v1/pharmacist/verification-status"),
  updateProfile: (data) => {
    const formData = new FormData();
    if (data.f_name !== undefined) formData.append("f_name", data.f_name);
    if (data.l_name !== undefined) formData.append("l_name", data.l_name);
    if (data.email !== undefined) formData.append("email", data.email);
    if (data.phone_number !== undefined) formData.append("phone_number", data.phone_number);
    if (data.age !== undefined) formData.append("age", String(data.age));
    if (data.gender !== undefined) formData.append("gender", data.gender);
    if (data.location !== undefined) formData.append("location", data.location);
    formData.append("_method", "PUT");
    return api("POST", "/api/v1/pharmacist/update-profile", { body: formData });
  },
  forgotPassword: (data) => api("POST", "/api/v1/auth/forgot-password", { body: data }),
  resetPassword: (data) => api("POST", "/api/v1/auth/reset-password", { body: data }),
  sendVerificationEmail: (data) => api("POST", "/api/v1/auth/send-verification-email", { body: data }),
  verifyEmail: (data) => api("POST", "/api/v1/auth/verify-email", { body: data }),
};
