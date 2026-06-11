import api from './axios';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const refresh = async (refreshToken) => {
  const response = await api.post('/auth/refresh', { refreshToken });
  return response.data;
};

export const logout = async (refreshToken) => {
  const response = await api.post('/auth/logout', { refreshToken });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
