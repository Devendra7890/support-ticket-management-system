import * as adminTicketService from '../services/adminTicketService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllTickets = asyncHandler(async (req, res) => {
  const result = await adminTicketService.listAllTickets(req.validatedQuery);

  res.status(200).json({
    success: true,
    message: 'Tickets retrieved successfully',
    data: result,
  });
});

export const getTicketStats = asyncHandler(async (req, res) => {
  const stats = await adminTicketService.getAdminTicketStats();

  res.status(200).json({
    success: true,
    message: 'Admin ticket statistics retrieved successfully',
    data: { stats },
  });
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.getTicketById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Ticket retrieved successfully',
    data: { ticket },
  });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const result = await adminTicketService.updateTicketStatus(
    req.params.id,
    req.user.id,
    req.body.status
  );

  res.status(200).json({
    success: true,
    message: 'Ticket status updated successfully',
    data: result,
  });
});

export const updateTicketPriority = asyncHandler(async (req, res) => {
  const result = await adminTicketService.updateTicketPriority(
    req.params.id,
    req.user.id,
    req.body.priority
  );

  res.status(200).json({
    success: true,
    message: 'Ticket priority updated successfully',
    data: result,
  });
});
