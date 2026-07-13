import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { UploadService } from '../services/upload.service.js';

export class UserController {
  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user?.id);
      if (!user) {
        return next(new NotFoundError('User not found.'));
      }
      res.json(user);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { themePreference, preferredLanguage, timeZone } = req.body;
    try {
      const user = await User.findById(req.user?.id);
      if (!user) {
        return next(new NotFoundError('User not found.'));
      }

      if (themePreference) user.themePreference = themePreference;
      if (preferredLanguage) user.preferredLanguage = preferredLanguage;
      if (timeZone) user.timeZone = timeZone;

      await user.save();
      res.json(user);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    if (!req.file) {
      return next(new ValidationError('Please upload an image file.'));
    }

    try {
      const user = await User.findById(req.user?.id);
      if (!user) {
        return next(new NotFoundError('User not found.'));
      }

      const avatarUrl = await UploadService.processAndSaveImage(req.file);
      user.avatarUrl = avatarUrl;
      await user.save();

      res.json({ message: 'Avatar uploaded successfully.', avatarUrl });
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async listUsers(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err: unknown) {
      next(err);
    }
  }
}
