import api from './axios';

export const listBlames = async (params) => {
  const response = await api.get('/blames', { params });
  return response.data;
};

export const getBlameById = async (id) => {
  const response = await api.get(`/blames/${id}`);
  return response.data;
};

export const createBlame = async (data) => {
  const response = await api.post('/blames', data);
  return response.data;
};

export const updateBlame = async (id, data) => {
  const response = await api.patch(`/blames/${id}`, data);
  return response.data;
};

export const changeBlameStatus = async (id, status) => {
  const response = await api.patch(`/blames/${id}/status`, { status });
  return response.data;
};
