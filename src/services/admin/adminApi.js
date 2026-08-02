import { api } from "../api";

const adminApi = {
  login: (data) => api("POST", "/api/v1/admin/login", { body: data }),
  logout: () => api("POST", "/api/v1/admin/logout"),
  dashboard: () => api("GET", "/api/v1/admin/dashboard"),

  companies: {
    list: (params) => api("GET", "/api/v1/admin/companies", { params }),
    show: (id) => api("GET", `/api/v1/admin/companies/${id}`),
    create: (data) => api("POST", "/api/v1/admin/companies", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/companies/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/companies/${id}`),
    pending: (params) => api("GET", "/api/v1/company/admin/pending", { params }),
    verify: (id, data) => api("POST", `/api/v1/company/admin/${id}/verify`, { body: data }),
  },

  doctors: {
    list: (params) => api("GET", "/api/v1/admin/doctors", { params }),
    show: (id) => api("GET", `/api/v1/admin/doctors/${id}`),
    create: (data) => api("POST", "/api/v1/admin/doctors", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/doctors/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/doctors/${id}`),
    pendingVerifications: (params) => api("GET", "/api/v1/admin/verifications/doctors", { params }),
    verify: (id, data) => api("POST", `/api/v1/admin/verifications/doctors/${id}/verify`, { body: data }),
  },

  pharmacists: {
    list: (params) => api("GET", "/api/v1/admin/pharmacists", { params }),
    show: (id) => api("GET", `/api/v1/admin/pharmacists/${id}`),
    create: (data) => api("POST", "/api/v1/admin/pharmacists", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/pharmacists/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/pharmacists/${id}`),
    pendingVerifications: (params) => api("GET", "/api/v1/admin/verifications/pharmacists", { params }),
    verify: (id, data) => api("POST", `/api/v1/admin/verifications/pharmacists/${id}/verify`, { body: data }),
  },

  patients: {
    list: (params) => api("GET", "/api/v1/admin/patients", { params }),
    show: (id) => api("GET", `/api/v1/admin/patients/${id}`),
    create: (data) => api("POST", "/api/v1/admin/patients", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/patients/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/patients/${id}`),
  },

  specialists: {
    list: (params) => api("GET", "/api/v1/admin/specialists", { params }),
    show: (id) => api("GET", `/api/v1/admin/specialists/${id}`),
    create: (data) => api("POST", "/api/v1/admin/specialists", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/specialists/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/specialists/${id}`),
  },

  scientificReps: {
    list: (params) => api("GET", "/api/v1/admin/scientific-reps", { params }),
    show: (id) => api("GET", `/api/v1/admin/scientific-reps/${id}`),
    create: (data) => api("POST", "/api/v1/admin/scientific-reps", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/scientific-reps/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/scientific-reps/${id}`),
  },

  users: {
    list: (params) => api("GET", "/api/v1/admin/users", { params }),
    show: (id) => api("GET", `/api/v1/admin/users/${id}`),
    create: (data) => api("POST", "/api/v1/admin/users", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/users/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/users/${id}`),
    restore: (id) => api("POST", `/api/v1/admin/users/${id}/restore`),
    suspend: (id) => api("POST", `/api/v1/admin/users/${id}/suspend`),
    assignRoles: (id, data) => api("POST", `/api/v1/admin/users/${id}/assign-roles`, { body: data }),
  },

  chronicDiseases: {
    list: (params) => api("GET", "/api/v1/admin/medical-data/chronic-diseases", { params }),
    create: (data) => api("POST", "/api/v1/admin/medical-data/chronic-diseases", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/medical-data/chronic-diseases/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/medical-data/chronic-diseases/${id}`),
    publicList: (params) => api("GET", "/api/v1/chronic-diseases", { params }),
    publicShow: (id) => api("GET", `/api/v1/chronic-diseases/${id}`),
  },

  activeIngredients: {
    list: (params) => api("GET", "/api/v1/admin/medical-data/active-ingredients", { params }),
    create: (data) => api("POST", "/api/v1/admin/medical-data/active-ingredients", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/medical-data/active-ingredients/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/medical-data/active-ingredients/${id}`),
  },

  medications: {
    list: (params) => api("GET", "/api/v1/admin/medical-data/medications", { params }),
    create: (data) => api("POST", "/api/v1/admin/medical-data/medications", { body: data }),
    update: (id, data) => api("PUT", `/api/v1/admin/medical-data/medications/${id}`, { body: data }),
    delete: (id) => api("DELETE", `/api/v1/admin/medical-data/medications/${id}`),
  },

  proposals: {
    list: (params) => api("GET", "/api/v1/admin/proposals", { params }),
    show: (id) => api("GET", `/api/v1/admin/proposals/${id}`),
    assign: (id, data) => api("POST", `/api/v1/admin/proposals/${id}/assign`, { body: data }),
    approve: (id) => api("POST", `/api/v1/admin/proposals/${id}/approve`),
    reject: (id, data) => api("POST", `/api/v1/admin/proposals/${id}/reject`, { body: data }),
  },

  audit: {
    activity: (params) => api("GET", "/api/v1/admin/audit/activity", { params }),
  },

  profile: {
    show: () => api("GET", "/api/v1/admin/profile"),
    update: (data) => {
      const formData = new FormData();
      if (data.f_name !== undefined) formData.append("f_name", data.f_name);
      if (data.l_name !== undefined) formData.append("l_name", data.l_name);
      if (data.email !== undefined) formData.append("email", data.email);
      if (data.phone_number !== undefined) formData.append("phone_number", data.phone_number);
      formData.append("_method", "PUT");
      return api("POST", "/api/v1/admin/profile", { body: formData });
    },
  },
};

export default adminApi;
