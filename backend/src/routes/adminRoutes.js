import { Router } from 'express';
import { adminCheck } from '../controllers/adminController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import { USER_ROLES } from '../constants/roles.js';
import adminTicketRoutes from './adminTicketRoutes.js';

const router = Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN));

router.get('/check', adminCheck);
router.use('/tickets', adminTicketRoutes);

export default router;
