import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { AppError } from '../utils/errors.js';
import { sendResponse } from '../utils/response.util.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  let statusCode = 500;
  let message = 'Something went wrong';
  let errorCode = 'INTERNAL_SERVER_ERROR';

  // Handle Custom App Errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } 
  
  // Handle Prisma Known Request Errors (P2025, P2002, etc.)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025': // Record not found
        statusCode = 404;
        message = 'Resource not found';
        errorCode = 'NOT_FOUND';
        break;
      case 'P2002': // Unique constraint failed
        statusCode = 400;
        message = `Unique constraint failed on field: ${err.meta?.target}`;
        errorCode = 'VALIDATION_ERROR';
        break;
      default:
        statusCode = 400;
        message = 'Database request failed';
        errorCode = 'DB_ERROR';
    }
  }

  const errorDetails = process.env.NODE_ENV === 'development' ? {
    stack: err.stack,
    code: errorCode,
    prismaCode: err.code, // Include prisma code in dev
    ...err
  } : {
    code: errorCode
  };

  return sendResponse(res, {
    statusCode,
    status: false,
    message,
    data: null,
    error: errorDetails,
  });
};
