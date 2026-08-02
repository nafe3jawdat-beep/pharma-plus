import { api } from "../api";

export const notificationApi = {
  fetchAll: () => api("GET", "/api/v1/pharmacist/notifications"),
  fetchUnreadCount: async () => {
    const res = await api("GET", "/api/v1/pharmacist/notifications");
    const items = res?.data ?? res ?? [];
    const unread = Array.isArray(items) ? items.filter(n => !n.read_at).length : 0;
    return { unread_count: unread };
  },
  acceptInvitation: (id) => api("POST", `/api/v1/pharmacist/notifications/${id}/accept-invitation`),
  rejectInvitation: (id) => api("POST", `/api/v1/pharmacist/notifications/${id}/reject-invitation`),
  acceptJoinRequest: (id) => api("POST", `/api/v1/pharmacist/notifications/${id}/accept-join-request`),
  rejectJoinRequest: (id) => api("POST", `/api/v1/pharmacist/notifications/${id}/reject-join-request`),
};
