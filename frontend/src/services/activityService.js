import api from './api';

export const getTicketActivity = async (ticketId, params = {}) => {
  const response = await api.get(`/tickets/${ticketId}/activity`, { params });
  return response.data;
};
