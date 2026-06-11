import api from './axios';

export const listDiscussionMessages = async (blameId, params) => {
  const response = await api.get(`/blames/${blameId}/messages`, { params });
  return response.data;
};

export const createDiscussionMessage = async (blameId, data) => {
  const response = await api.post(`/blames/${blameId}/messages`, data);
  return response.data;
};
