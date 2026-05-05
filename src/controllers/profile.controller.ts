import { profileService } from '../services/profile.service.js';
import { BaseController } from './base.controller.js';
import { Profile } from '../repositories/profile.repository.js';

export class ProfileController extends BaseController<Profile> {
  constructor() {
    super(profileService, 'Profile');
  }

  // Add profile-specific controller methods here
}

export const profileController = new ProfileController();
