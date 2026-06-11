import api from './axios';

export const listUsers = async (params) => {
  const response = await api.get('/users', { params });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
};

export const disableUser = async (id) => {
  const response = await api.patch(`/users/${id}/disable`);
  return response.data;
};

export const enableUser = async (id) => {
  const response = await api.patch(`/users/${id}/enable`);
  return response.data;
};

export const resetUserPassword = async (id, newPassword) => {
  const response = await api.patch(`/users/${id}/reset-password`, { newPassword });
  return response.data;
};

export const transferUserTeam = async (id, teamId) => {
  const response = await api.patch(`/users/${id}/transfer`, { teamId });
  return response.data;
};
