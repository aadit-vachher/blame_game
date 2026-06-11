import api from './axios';

export const getDependencyChain = async (blameId) => {
  const response = await api.get(`/dependencies/chain/${blameId}`);
  return response.data;
};

export const listDependenciesForBlame = async (blameId) => {
  const response = await api.get(`/dependencies/${blameId}`);
  return response.data;
};

export const createDependency = async (blameId, data) => {
  const response = await api.post(`/dependencies/${blameId}`, data);
  return response.data;
};

export const removeDependency = async (id) => {
  const response = await api.delete(`/dependencies/${id}`);
  return response.data;
};
