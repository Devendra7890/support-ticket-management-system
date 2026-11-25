import { Router } from 'express';
import {
  getAllTickets,
  getTicketStats,
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
} from '../controllers/adminTicketController.js';
import validate from '../middlewares/validate.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import {
  adminListTicketsQuerySchema,
  adminUpdateStatusSchema,
  adminUpdatePrioritySchema,
} from '../validators/adminTicketValidators.js';

const router = Router();

router.get('/', validate(adminListTicketsQuerySchema, 'query'), getAllTickets);
router.get('/stats', getTicketStats);

router.get('/:id', validateObjectId('id'), getTicketById);

router.patch(
  '/:id/status',
  validateObjectId('id'),
  validate(adminUpdateStatusSchema),
  updateTicketStatus
);

router.patch(
  '/:id/priority',
  validateObjectId('id'),
  validate(adminUpdatePrioritySchema),
  updateTicketPriority
);

export default router;
