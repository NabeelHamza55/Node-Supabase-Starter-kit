import { BaseRepository } from './base.repository.js';
import { prisma } from '../lib/prisma.js';

export interface Profile {
  id: string;
  user_id: string;
  org_id: string | null;
  full_name: string | null;
  created_at: Date; // Prisma returns Date for DateTime
}

export class ProfileRepository extends BaseRepository<Profile> {
  constructor() {
    super('profile');
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    return prisma.profile.findUnique({
      where: { user_id: userId },
    });
  }
}
