import api from './api';

export const getTickets = async (params = {}) => {
  const response = await api.get('/tickets', { params });
  return response.data;
};

export const getTicketStats = async () => {
  const response = await api.get('/tickets/stats');
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

export const createTicket = async (payload) => {
  const response = await api.post('/tickets', payload);
  return response.data;
};

export const updateTicket = async (id, payload) => {
  const response = await api.patch(`/tickets/${id}`, payload);
  return response.data;
};

export const deleteTicket = async (id) => {
  const response = await api.delete(`/tickets/${id}`);
  return response.data;
};
