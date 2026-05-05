import { profileRepository } from '../repositories/profile.repository.js';
import type { Profile } from '../repositories/profile.repository.js';
import { BaseService } from './base.service.js';

export class ProfileService extends BaseService<Profile> {
  constructor() {
    super(profileRepository);
  }

  // Add profile-specific business logic methods here
}

export const profileService = new ProfileService();
