import { Router } from 'express';
import multer from 'multer';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Public auth routes
 */

// Sign up
router.post('/signup', authController.signUp);

// Sign in
router.post('/signin', authController.signIn);

// Social login
router.post('/social-login', authController.socialLogin);

// Get social auth URL
router.get('/social-auth/:provider', authController.getSocialAuthUrl);

// Verify email
router.get('/verify-email', authController.verifyEmail);

// Resend verification email
router.post('/resend-verification', authController.resendVerificationEmail);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

/**
 * Protected routes (require authentication)
 */

// Get profile
router.get('/profile', authMiddleware, authController.getProfile);

// Update profile
router.put('/profile', authMiddleware, authController.updateProfile);

// Upload avatar
router.post(
    '/avatar',
    authMiddleware,
    upload.single('avatar'),
    authController.uploadAvatar
);

// Change password
router.post('/change-password', authMiddleware, authController.changePassword);

// Logout
router.post('/logout', authMiddleware, authController.logout);

export default router;
