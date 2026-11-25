import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController.js';
import authenticate from '../middlewares/authenticate.js';
import validate from '../middlewares/validate.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import { listNotificationsQuerySchema } from '../validators/notificationValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsQuerySchema, 'query'), getMyNotifications);
router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:id/read', validateObjectId('id'), markNotificationAsRead);

export default router;
