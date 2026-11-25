import * as ticketService from '../services/ticketService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Ticket created successfully',
    data: { ticket },
  });
});

export const getTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.listUserTickets(
    req.user.id,
    req.validatedQuery
  );

  res.status(200).json({
    success: true,
    message: 'Tickets retrieved successfully',
    data: result,
  });
});

export const getTicketStats = asyncHandler(async (req, res) => {
  const stats = await ticketService.getUserTicketStats(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Ticket statistics retrieved successfully',
    data: { stats },
  });
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getUserTicketById(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Ticket retrieved successfully',
    data: { ticket },
  });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateUserTicket(
    req.params.id,
    req.user.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: 'Ticket updated successfully',
    data: { ticket },
  });
});

export const deleteTicket = asyncHandler(async (req, res) => {
  await ticketService.deleteUserTicket(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Ticket deleted successfully',
  });
});
