import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketStats,
  getTicketById,
  updateTicket,
  deleteTicket,
} from '../controllers/ticketController.js';
import authenticate from '../middlewares/authenticate.js';
import validate from '../middlewares/validate.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsQuerySchema,
} from '../validators/ticketValidators.js';
import commentRoutes from './commentRoutes.js';
import activityRoutes from './activityRoutes.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTicketSchema), createTicket);
router.get('/', validate(listTicketsQuerySchema, 'query'), getTickets);
router.get('/stats', getTicketStats);

router.use('/:id/comments', validateObjectId('id'), commentRoutes);
router.use('/:id/activity', validateObjectId('id'), activityRoutes);

router.get('/:id', validateObjectId('id'), getTicketById);
router.patch(
  '/:id',
  validateObjectId('id'),
  validate(updateTicketSchema),
  updateTicket
);
router.delete('/:id', validateObjectId('id'), deleteTicket);

export default router;
