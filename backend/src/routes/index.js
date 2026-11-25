import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/tickets', ticketRoutes);
router.use('/notifications', notificationRoutes);

export default router;
