import api from './api';

export const getAdminTickets = async (params = {}) => {
  const response = await api.get('/admin/tickets', { params });
  return response.data;
};

export const getAdminTicketStats = async () => {
  const response = await api.get('/admin/tickets/stats');
  return response.data;
};

export const getAdminTicketById = async (id) => {
  const response = await api.get(`/admin/tickets/${id}`);
  return response.data;
};

export const updateTicketStatus = async (id, status) => {
  const response = await api.patch(`/admin/tickets/${id}/status`, { status });
  return response.data;
};

export const updateTicketPriority = async (id, priority) => {
  const response = await api.patch(`/admin/tickets/${id}/priority`, { priority });
  return response.data;
};
