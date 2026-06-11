import api from './axios';

export const getOverviewAnalytics = async (params) => {
  const response = await api.get('/analytics/overview', { params });
  return response.data;
};

export const getTeamsAnalytics = async (params) => {
  const response = await api.get('/analytics/teams', { params });
  return response.data;
};

export const getCategoriesAnalytics = async (params) => {
  const response = await api.get('/analytics/categories', { params });
  return response.data;
};

export const getProductivityAnalytics = async (params) => {
  const response = await api.get('/analytics/productivity', { params });
  return response.data;
};

export const getTrendsAnalytics = async (params) => {
  const response = await api.get('/analytics/trends', { params });
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await api.get('/analytics/leaderboard');
  return response.data;
};
