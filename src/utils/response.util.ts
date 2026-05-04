import { Response } from 'express';

interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T | null;
  error: any | null;
}

export const sendResponse = <T>(
  res: Response,
  {
    statusCode = 200,
    status = true,
    message = 'Operation successful',
    data = null,
    error = null,
  }: {
    statusCode?: number;
    status?: boolean;
    message?: string;
    data?: T | null;
    error?: any;
  }
) => {
  const response: ApiResponse<T> = {
    status,
    message,
    data,
    error,
  };

  return res.status(statusCode).json(response);
};
