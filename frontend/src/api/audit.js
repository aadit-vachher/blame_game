import api from './axios';

export const listAuditLogs = async (params) => {
  const response = await api.get('/audit-logs', { params });
  return response.data;
};
