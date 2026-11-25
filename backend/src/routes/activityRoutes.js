import { Router } from 'express';
import { getTicketActivity } from '../controllers/activityController.js';
import validate from '../middlewares/validate.js';
import { listActivityQuerySchema } from '../validators/activityValidators.js';

const router = Router({ mergeParams: true });

router.get('/', validate(listActivityQuerySchema, 'query'), getTicketActivity);

export default router;
