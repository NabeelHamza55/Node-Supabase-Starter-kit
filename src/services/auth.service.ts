import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import { emailService } from './email.service.js';
import { authRepository } from '../repositories/auth.repository.js';
import type { UserWithProfile } from '../repositories/auth.repository.js';
import type { User, Profile } from '../generated/prisma/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

interface SignUpRequest {
    email: string;
    password: string;
    fullName?: string;
    userType?: 'user' | 'admin';
}

interface SignInRequest {
    email: string;
    password: string;
}

interface AuthResponse {
    user: {
        id: string;
        email: string;
        fullName?: string;
        userType: string;
    };
    token: string;
}

interface SocialAuthRequest {
    provider: 'google' | 'github';
    email: string;
    fullName?: string;
    avatarUrl?: string;
    providerId: string;
}

export class AuthService {
    /**
     * Check if auth is enabled
     */
    isAuthEnabled(): boolean {
        return config.ENABLE_AUTH;
    }

    /**
     * Check if social auth is enabled
     */
    isSocialAuthEnabled(): boolean {
        return config.ENABLE_SOCIAL_AUTH;
    }

    /**
     * Sign up with email and password
     */
    async signUp(data: SignUpRequest): Promise<AuthResponse> {
        if (!this.isAuthEnabled()) {
            throw new AppError('Authentication is disabled', 403, 'AUTH_DISABLED');
        }

        // Check if user already exists
        const emailExists = await authRepository.emailExists(data.email);
        if (emailExists) {
            throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Generate email verification token if verification is enabled
        const emailVerificationToken = config.ENABLE_EMAIL_VERIFICATION
            ? crypto.randomBytes(32).toString('hex')
            : null;

        // Create user in database
        const user = await authRepository.createUser({
            email: data.email,
            password_hash: hashedPassword,
            fullName: data.fullName,
            userType: data.userType,
            provider: 'local'
        });

        // Set verification token if enabled
        if (config.ENABLE_EMAIL_VERIFICATION && emailVerificationToken) {
            await authRepository.updateVerificationToken(user.id, emailVerificationToken);

            // Send verification email
            await emailService.sendVerificationEmail(
                user.email,
                emailVerificationToken,
                data.fullName
            );
        } else {
            // If verification is disabled, mark as verified immediately
            await authRepository.verifyEmail(user.id);
        }

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user.email, data.fullName);
        } catch (error) {
            // Log but don't fail if welcome email fails
            console.log('Welcome email failed:', error);
        }

        // Create JWT token
        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.profile?.full_name || undefined,
                userType: user.user_type
            },
            token
        };
    }

    /**
     * Sign in with email and password
     */
    async signIn(data: SignInRequest): Promise<AuthResponse> {
        if (!this.isAuthEnabled()) {
            throw new AppError('Authentication is disabled', 403, 'AUTH_DISABLED');
        }

        // Find user
        const user = await authRepository.findByEmail(data.email);

        if (!user) {
            throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
        }

        // Check password
        if (!user.password_hash) {
            throw new AppError('User was registered via social login', 400, 'SOCIAL_LOGIN_ONLY');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        // Update last login
        await authRepository.updateLastLogin(user.id);

        // Create JWT token
        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.profile?.full_name || undefined,
                userType: user.user_type
            },
            token
        };
    }

    /**
     * Social login (Google, GitHub, etc.)
     */
    async socialLogin(data: SocialAuthRequest): Promise<AuthResponse> {
        if (!this.isAuthEnabled()) {
            throw new AppError('Authentication is disabled', 403, 'AUTH_DISABLED');
        }

        if (!this.isSocialAuthEnabled()) {
            throw new AppError('Social authentication is disabled', 403, 'SOCIAL_AUTH_DISABLED');
        }

        // Check if user exists
        let user = await authRepository.findByProvider(data.provider, data.providerId);

        if (!user) {
            // Check if email already exists with different provider
            const existingUser = await authRepository.findByEmail(data.email);
            if (existingUser) {
                // Link account or update provider? 
                user = await authRepository.updateUser(existingUser.id, {
                    provider: data.provider,
                    provider_id: data.providerId,
                    email_verified_at: new Date() // Social login emails are usually verified
                });
            } else {
                // Create new user
                user = await authRepository.createUser({
                    email: data.email,
                    provider: data.provider,
                    provider_id: data.providerId,
                    fullName: data.fullName,
                    avatarUrl: data.avatarUrl
                });
                // Social users are verified by default
                await authRepository.verifyEmail(user.id);
            }
        } else {
            // Update last login and avatar if provided
            await authRepository.updateLastLogin(user.id);
            if (data.avatarUrl && user.profile) {
                user = await authRepository.updateUser(user.id, {
                    profile: {
                        update: { avatar_url: data.avatarUrl }
                    }
                });
            }
        }

        if (!user) {
            throw new AppError('Failed to authenticate user', 500, 'AUTH_FAILED');
        }

        // Create JWT token
        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.profile?.full_name || undefined,
                userType: user.user_type
            },
            token
        };
    }

    /**
     * Get Supabase auth URL for social login
     */
    getSocialAuthUrl(provider: 'google' | 'github'): string {
        const redirectUrl = `${config.API_URL}/api/auth/callback/${provider}`;

        if (provider === 'google') {
            const params = new URLSearchParams({
                client_id: config.GOOGLE_CLIENT_ID || '',
                redirect_uri: redirectUrl,
                response_type: 'code',
                scope: 'openid profile email'
            });
            return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        }

        if (provider === 'github') {
            const params = new URLSearchParams({
                client_id: config.GITHUB_CLIENT_ID || '',
                redirect_uri: redirectUrl,
                scope: 'user:email'
            });
            return `https://github.com/login/oauth/authorize?${params.toString()}`;
        }

        throw new AppError('Invalid provider', 400, 'INVALID_PROVIDER');
    }

    /**
     * Verify JWT token
     */
    verifyToken(token: string): { userId: string; email: string } {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET) as {
                userId: string;
                email: string;
            };
            return decoded;
        } catch (error) {
            throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
        }
    }

    /**
     * Generate JWT token
     */
    generateToken(userId: string, email: string): string {
        return jwt.sign(
            { userId, email },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRY } as jwt.SignOptions
        );
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        const user = await authRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return {
            id: user.id,
            email: user.email,
            provider: user.provider,
            userType: user.user_type,
            emailVerified: !!user.email_verified_at,
            isActive: user.is_active,
            profile: {
                fullName: user.profile?.full_name,
                avatarUrl: user.profile?.avatar_url,
                bio: user.profile?.bio
            }
        };
    }

    /**
     * Update user profile
     */
    async updateProfile(
        userId: string,
        data: {
            fullName?: string;
            bio?: string;
            avatarUrl?: string;
        }
    ) {
        const user = await authRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        const updatedUser = await authRepository.updateUser(userId, {
            profile: {
                update: {
                    ...(data.fullName && { full_name: data.fullName }),
                    ...(data.bio && { bio: data.bio }),
                    ...(data.avatarUrl && { avatar_url: data.avatarUrl })
                }
            }
        });

        return updatedUser.profile;
    }

    /**
     * Logout (invalidate token)
     */
    async logout(userId: string): Promise<void> {
        const user = await authRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }
    }

    /**
     * Change password
     */
    async changePassword(
        userId: string,
        oldPassword: string,
        newPassword: string
    ): Promise<void> {
        const user = await authRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        if (!user.password_hash) {
            throw new AppError('User was registered via social login', 400, 'SOCIAL_LOGIN_ONLY');
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await authRepository.updateUser(userId, { password_hash: hashedNewPassword });

        // Send password change notification
        try {
            await emailService.sendPasswordChangeNotification(
                user.email,
                user.profile?.full_name || undefined
            );
        } catch (error) {
            console.log('Password change notification failed:', error);
        }
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<void> {
        if (!config.ENABLE_EMAIL_VERIFICATION) {
            throw new AppError('Email verification is disabled', 403, 'EMAIL_VERIFICATION_DISABLED');
        }

        const user = await authRepository.findByVerificationToken(token);

        if (!user) {
            throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
        }

        // Update user email verification
        await authRepository.verifyEmail(user.id);
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail(email: string): Promise<void> {
        if (!config.ENABLE_EMAIL_VERIFICATION) {
            throw new AppError('Email verification is disabled', 403, 'EMAIL_VERIFICATION_DISABLED');
        }

        const user = await authRepository.findByEmail(email);

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        if (user.email_verified_at) {
            throw new AppError('Email already verified', 400, 'EMAIL_ALREADY_VERIFIED');
        }

        // Generate new verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        // Update user with new token
        await authRepository.updateVerificationToken(user.id, emailVerificationToken);

        // Send verification email
        await emailService.sendVerificationEmail(
            user.email,
            emailVerificationToken,
            user.profile?.full_name || undefined
        );
    }

    /**
     * Request password reset
     */
    async forgotPassword(email: string): Promise<void> {
        const user = await authRepository.findByEmail(email);

        if (!user) {
            // Don't reveal if email exists for security reasons
            throw new AppError('If that email is registered, you will receive a password reset link', 200, 'PASSWORD_RESET_SENT');
        }

        // Generate password reset token
        const passwordResetToken = crypto.randomBytes(32).toString('hex');

        // Update user with reset token
        await authRepository.setResetToken(user.id, passwordResetToken);

        // Send password reset email
        try {
            await emailService.sendPasswordResetEmail(
                user.email,
                passwordResetToken,
                user.profile?.full_name || undefined
            );
        } catch (error) {
            console.log('Password reset email failed:', error);
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Find user by reset token
        const user = await authRepository.findByResetToken(token);

        if (!user) {
            throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
        }

        // Check if token is expired
        if (user.password_reset_at) {
            const tokenAge = Date.now() - user.password_reset_at.getTime();
            if (tokenAge > config.PASSWORD_RESET_EXPIRY * 1000) {
                throw new AppError('Password reset token has expired', 400, 'EXPIRED_RESET_TOKEN');
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password and clear reset token
        await authRepository.resetPassword(user.id, hashedPassword);
    }

    /**
     * Get user type
     */
    async getUserType(userId: string): Promise<string> {
        const user = await authRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return user.user_type;
    }

    /**
     * Check if user is admin
     */
    async isAdmin(userId: string): Promise<boolean> {
        const userType = await this.getUserType(userId);
        return userType === 'admin';
    }
}

export const authService = new AuthService();
