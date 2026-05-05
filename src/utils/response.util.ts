import { Response } from 'express';

interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T | null;
  error: any | null;
}

/**
 * Standardized API response utility
 */
export const sendResponse = <T>(
  res: Response,
  statusCode: number = 200,
  message: string = 'Operation successful',
  data: T | null = null,
  error: any = null
) => {
  const response: ApiResponse<T> = {
    status: statusCode >= 200 && statusCode < 300,
    message,
    data,
    error,
  };

  return res.status(statusCode).json(response);
};
