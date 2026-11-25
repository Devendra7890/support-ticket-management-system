import api from './api';

export const getComments = async (ticketId, params = {}) => {
  const response = await api.get(`/tickets/${ticketId}/comments`, { params });
  return response.data;
};

export const addComment = async (ticketId, message) => {
  const response = await api.post(`/tickets/${ticketId}/comments`, { message });
  return response.data;
};
