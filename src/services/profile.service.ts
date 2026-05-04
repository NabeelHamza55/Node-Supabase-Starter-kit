import { ProfileRepository, Profile } from '../repositories/profile.repository.js';
import { BaseService } from './base.service.js';

export class ProfileService extends BaseService<Profile> {
  constructor() {
    super(new ProfileRepository());
  }

  // Add profile-specific business logic methods here
}
