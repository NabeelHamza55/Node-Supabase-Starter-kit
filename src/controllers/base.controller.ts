import { Request, Response } from 'express';
import { BaseService } from '../services/base.service.js';
import { sendResponse } from '../utils/response.util.js';
import { asyncHandler } from '../middleware/asyncHandler.middleware.js';

export abstract class BaseController<T extends Record<string, any>> {
  constructor(
    protected readonly service: BaseService<T>,
    protected readonly resourceName: string
  ) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getAll();
    sendResponse(res, {
      message: `${this.resourceName}s retrieved successfully`,
      data,
    });
  });

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getById(req.params.id as string);
    sendResponse(res, {
      message: `${this.resourceName} retrieved successfully`,
      data,
    });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.create(req.body);
    sendResponse(res, {
      statusCode: 201,
      message: `${this.resourceName} created successfully`,
      data,
    });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.update(req.params.id as string, req.body);
    sendResponse(res, {
      message: `${this.resourceName} updated successfully`,
      data,
    });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete(req.params.id as string);
    sendResponse(res, {
      message: `${this.resourceName} deleted successfully`,
    });
  });
}
