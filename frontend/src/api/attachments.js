import api from './axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const uploadAttachment = async (file, { blameId, messageId, dependencyId } = {}, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  if (blameId) formData.append('blameId', blameId);
  if (messageId) formData.append('messageId', messageId);
  if (dependencyId) formData.append('dependencyId', dependencyId);

  const response = await api.post('/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const deleteAttachment = async (id) => {
  const response = await api.delete(`/attachments/${id}`);
  return response.data;
};

export const getAttachmentDownloadUrl = (id) => {
  return `${API_BASE_URL}/attachments/${id}`;
};
