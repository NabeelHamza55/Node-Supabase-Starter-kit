import { BaseRepository } from './base.repository.js';
import { prisma } from '../lib/prisma.js';
import { Profile } from '../generated/prisma/index.js';

export { Profile };

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

export const profileRepository = new ProfileRepository();
