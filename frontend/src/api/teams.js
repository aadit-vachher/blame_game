import api from './axios';

export const listTeams = async (params) => {
  const response = await api.get('/teams', { params });
  return response.data;
};

export const getTeamById = async (id) => {
  const response = await api.get(`/teams/${id}`);
  return response.data;
};

export const getTeamMembers = async (id) => {
  const response = await api.get(`/teams/${id}/members`);
  return response.data;
};

export const createTeam = async (data) => {
  const response = await api.post('/teams', data);
  return response.data;
};

export const updateTeam = async (id, data) => {
  const response = await api.patch(`/teams/${id}`, data);
  return response.data;
};

export const archiveTeam = async (id) => {
  const response = await api.patch(`/teams/${id}/archive`);
  return response.data;
};
