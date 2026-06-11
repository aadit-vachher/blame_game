import api from './axios';

export const listNotifications = async (params) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

export const getUnreadNotificationsCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};
