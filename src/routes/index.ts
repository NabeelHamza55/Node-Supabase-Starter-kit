import { Router } from 'express';
import authRoutes from './auth.route.js';
import profileRoutes from './profile.route.js';

const router = Router();

// Register all routes here
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);

export default router;
