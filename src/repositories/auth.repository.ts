import { prisma } from '../lib/prisma.js';
import { BaseRepository } from './base.repository.js';
import type { User, Profile } from '../generated/prisma/index.js';
import { NotFoundError } from '../utils/errors.js';

export type UserWithProfile = User & { profile: Profile | null };

export class AuthRepository extends BaseRepository<User> {
    constructor() {
        super('user');
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<UserWithProfile | null> {
        return prisma.user.findUnique({
            where: { email },
            include: { profile: true }
        }) as Promise<UserWithProfile | null>;
    }

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<UserWithProfile> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        }) as UserWithProfile | null;

        if (!user) {
            throw new NotFoundError('User');
        }

        return user;
    }

    /**
     * Find user by provider and provider ID
     */
    async findByProvider(provider: string, providerId: string): Promise<UserWithProfile | null> {
        return prisma.user.findFirst({
            where: {
                provider,
                provider_id: providerId
            },
            include: { profile: true }
        }) as Promise<UserWithProfile | null>;
    }

    /**
     * Create new user
     */
    async createUser(data: {
        email: string;
        password_hash?: string;
        provider?: string;
        provider_id?: string;
        fullName?: string;
        avatarUrl?: string;
        userType?: string;
    }): Promise<UserWithProfile> {
        return prisma.user.create({
            data: {
                email: data.email,
                password_hash: data.password_hash,
                provider: data.provider || 'local',
                provider_id: data.provider_id,
                user_type: data.userType || 'user',
                email_verified_at: data.provider ? new Date() : undefined,
                profile: {
                    create: {
                        full_name: data.fullName,
                        avatar_url: data.avatarUrl
                    }
                }
            },
            include: { profile: true }
        }) as Promise<UserWithProfile>;
    }

    /**
     * Update user
     */
    async updateUser(id: string, data: any): Promise<UserWithProfile> {
        return prisma.user.update({
            where: { id },
            data,
            include: { profile: true }
        }) as Promise<UserWithProfile>;
    }

    /**
     * Check if email exists
     */
    async emailExists(email: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        return !!user;
    }

    /**
     * Update last login
     */
    async updateLastLogin(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { last_login: new Date() }
        });
    }

    /**
     * Find user by email verification token
     */
    async findByVerificationToken(token: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: { email_verified_token: token }
        });
    }

    /**
     * Find user by password reset token
     */
    async findByResetToken(token: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: { password_reset_token: token }
        });
    }

    /**
     * Update user verification status
     */
    async verifyEmail(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                email_verified_at: new Date(),
                email_verified_token: null
            }
        });
    }

    /**
     * Set password reset token
     */
    async setResetToken(userId: string, token: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                password_reset_token: token,
                password_reset_at: new Date()
            }
        });
    }

    /**
     * Reset password and clear token
     */
    async resetPassword(userId: string, passwordHash: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                password_hash: passwordHash,
                password_reset_token: null,
                password_reset_at: null
            }
        });
    }

    /**
     * Update email verification token
     */
    async updateVerificationToken(userId: string, token: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { email_verified_token: token }
        });
    }
}

export const authRepository = new AuthRepository();
