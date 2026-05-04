import { Router } from 'express';
import profileRoutes from './profile.route.js';

const router = Router();

// Register all routes here
router.use('/profiles', profileRoutes);

export default router;
