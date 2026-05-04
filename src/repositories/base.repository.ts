import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export abstract class BaseRepository<T extends Record<string, any>> {
  protected model: any;

  constructor(protected readonly modelName: string) {
    this.model = (prisma as any)[modelName];
  }

  async findAll(): Promise<T[]> {
    return this.model.findMany();
  }

  async findById(id: string): Promise<T> {
    const data = await this.model.findUnique({
      where: { id },
    });

    if (!data) throw new NotFoundError(this.modelName);
    return data as T;
  }

  async create(payload: Partial<T>): Promise<T> {
    return this.model.create({
      data: payload,
    });
  }

  async update(id: string, payload: Partial<T>): Promise<T> {
    return this.model.update({
      where: { id },
      data: payload,
    });
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({
      where: { id },
    });
  }
}
