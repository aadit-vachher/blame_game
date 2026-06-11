import api from './axios';

export const listCategories = async (params) => {
  const response = await api.get('/categories', { params });
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post('/categories', data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.patch(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};
