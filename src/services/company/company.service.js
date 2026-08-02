import { api } from "../api";

export const companyService = {
  getProfile: () => api("GET", "/api/v1/company/profile"),
  getReps: () => api("GET", "/api/v1/company/reps"),
  getRep: (repId) => api("GET", `/api/v1/company/reps/${repId}`),
  createRep: (data) => api("POST", "/api/v1/company/reps", { body: data }),
  suspendRep: (repId, email, password) => api("POST", `/api/v1/company/reps/${repId}/suspend`, { body: { email, password } }),
  activateRep: (repId) => api("POST", `/api/v1/company/reps/${repId}/activate`),
  deleteRep: (repId) => api("DELETE", `/api/v1/company/reps/${repId}`),

  getSchedules: (params) => api("GET", "/api/v1/company/schedules", { params }),
  createSchedule: (data) => api("POST", "/api/v1/company/schedules", { body: data }),
  batchCreateSchedules: (data) => api("POST", "/api/v1/company/schedules/batch", { body: data }),
  publishSchedule: (id) => api("POST", `/api/v1/company/schedules/${id}/publish`),
  cancelSchedule: (id) => api("POST", `/api/v1/company/schedules/${id}/cancel`),

  getAssignments: () => api("GET", "/api/v1/company/assignments"),
  createAssignment: (repId, doctorId) =>
    api("POST", "/api/v1/company/assignments", { body: { rep_id: repId, doctor_id: doctorId } }),
  deleteAssignment: (id) => api("DELETE", `/api/v1/company/assignments/${id}`),
  getDashboard: () => api("GET", "/api/v1/company/dashboard"),
  getDoctors: (params) => api("GET", "/api/v1/doctor/list", { params }),
  getVisits: (params) => api("GET", "/api/v1/company/visits", { params }),
  getVisit: (id) => api("GET", `/api/v1/company/visits/${id}`),
  updateProfile: (data) => api("PUT ", "/api/v1/company/profile", { body: { ...data, _method: "PUT" } }),
};
