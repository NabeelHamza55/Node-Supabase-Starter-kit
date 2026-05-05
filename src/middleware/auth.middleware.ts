import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/errors.js';
import { config } from '../config/index.js';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

/**
 * Middleware to verify JWT token
 */
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Check if auth is enabled
    if (!config.ENABLE_AUTH) {
        return next(new AppError('Authentication is disabled', 403, 'AUTH_DISABLED'));
    }

    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED');
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify token
        const decoded = authService.verifyToken(token);

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError('Invalid token', 401, 'UNAUTHORIZED'));
        }
    }
};

/**
 * Middleware to restrict access to admins only
 */
export const adminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const isAdmin = await authService.isAdmin(userId);

        if (!isAdmin) {
            throw new AppError('Forbidden: Admin access required', 403, 'FORBIDDEN');
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional auth middleware - doesn't fail if token is missing
 */
export const optionalAuthMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = authService.verifyToken(token);
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};

/**
 * Require specific auth provider
 */
export const requireProvider = (provider: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
            }

            const user = await authService.getUserById(userId);

            // @ts-ignore
            if (user.provider !== provider) {
                throw new AppError(
                    `This action requires ${provider} authentication`,
                    403,
                    'WRONG_PROVIDER'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
