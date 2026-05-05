import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { storageService } from '../services/storage.service.js';
import { sendResponse } from '../utils/response.util.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/asyncHandler.middleware.js';

// Validation schemas
const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().optional(),
    userType: z.enum(['user', 'admin']).optional()
});

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

const socialLoginSchema = z.object({
    provider: z.enum(['google', 'github']),
    email: z.string().email(),
    fullName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    providerId: z.string()
});

const updateProfileSchema = z.object({
    fullName: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().url().optional()
});

const changePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(8)
});

const forgotPasswordSchema = z.object({
    email: z.string().email()
});

const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8)
});

const resendVerificationSchema = z.object({
    email: z.string().email()
});

export class AuthController {
    /**
     * Sign up with email and password
     */
    signUp = asyncHandler(async (req: Request, res: Response) => {
        const validated = signUpSchema.parse(req.body);
        const result = await authService.signUp(validated);
        sendResponse(res, 201, 'User registered successfully', result);
    });

    /**
     * Sign in with email and password
     */
    signIn = asyncHandler(async (req: Request, res: Response) => {
        const validated = signInSchema.parse(req.body);
        const result = await authService.signIn(validated);
        sendResponse(res, 200, 'Signed in successfully', result);
    });

    /**
     * Social login
     */
    socialLogin = asyncHandler(async (req: Request, res: Response) => {
        const validated = socialLoginSchema.parse(req.body);
        const result = await authService.socialLogin(validated);
        sendResponse(res, 200, 'Social login successful', result);
    });

    /**
     * Get social auth URL
     */
    getSocialAuthUrl = asyncHandler(async (req: Request, res: Response) => {
        const provider = req.params.provider as 'google' | 'github';

        if (!['google', 'github'].includes(provider)) {
            throw new AppError('Invalid provider', 400, 'INVALID_PROVIDER');
        }

        const url = authService.getSocialAuthUrl(provider);
        sendResponse(res, 200, 'Social auth URL generated', { url });
    });

    /**
     * Get current user profile
     */
    getProfile = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.userId;

        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const user = await authService.getUserById(userId);
        sendResponse(res, 200, 'Profile retrieved', user);
    });

    /**
     * Update user profile
     */
    updateProfile = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.userId;

        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const validated = updateProfileSchema.parse(req.body);
        const profile = await authService.updateProfile(userId, validated);
        sendResponse(res, 200, 'Profile updated successfully', profile);
    });

    /**
     * Upload avatar
     */
    uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.userId;

        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const file = (req as any).file;
        if (!file) {
            throw new AppError('No file provided', 400, 'NO_FILE');
        }

        const result = await storageService.uploadAvatar(userId, {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });

        // Update profile with avatar URL
        await authService.updateProfile(userId, { avatarUrl: result.url });

        sendResponse(res, 200, 'Avatar uploaded successfully', result);
    });

    /**
     * Change password
     */
    changePassword = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.userId;

        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const validated = changePasswordSchema.parse(req.body);
        await authService.changePassword(userId, validated.oldPassword, validated.newPassword);

        sendResponse(res, 200, 'Password changed successfully', null);
    });

    /**
     * Logout
     */
    logout = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.userId;

        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        await authService.logout(userId);
        sendResponse(res, 200, 'Logged out successfully', null);
    });

    /**
     * Verify email
     */
    verifyEmail = asyncHandler(async (req: Request, res: Response) => {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            throw new AppError('Verification token is required', 400, 'MISSING_TOKEN');
        }

        await authService.verifyEmail(token);
        sendResponse(res, 200, 'Email verified successfully', null);
    });

    /**
     * Resend verification email
     */
    resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
        const validated = resendVerificationSchema.parse(req.body);
        await authService.resendVerificationEmail(validated.email);
        sendResponse(res, 200, 'Verification email sent', null);
    });

    /**
     * Forgot password
     */
    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const validated = forgotPasswordSchema.parse(req.body);
        await authService.forgotPassword(validated.email);
        sendResponse(res, 200, 'If that email is registered, you will receive a password reset link', null);
    });

    /**
     * Reset password
     */
    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const validated = resetPasswordSchema.parse(req.body);
        await authService.resetPassword(validated.token, validated.password);
        sendResponse(res, 200, 'Password reset successfully', null);
    });
}

export const authController = new AuthController();
