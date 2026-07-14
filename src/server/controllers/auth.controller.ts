import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { ValidationError, ConflictError } from '../errors/AppError.js';
import { EmailService } from '../services/email.service.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { username, email, password, roleName } = req.body;

    if (!username || !email || !password || !roleName) {
      return next(new ValidationError('Username, email, password, and roleName are required.'));
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new ConflictError('Email is already registered.'));
      }

      const roleExists = await Role.findOne({ name: roleName });
      if (!roleExists) {
        return next(new ValidationError(`Specified role [${roleName}] does not exist.`));
      }

      const user = await User.create({
        username,
        email,
        password,
        roleName,
        isActive: true,
      });

      await EmailService.sendWelcome(user.email, user.username);

      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = await AuthService.generateRefreshToken(user);

      res.status(201).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          roleName: user.roleName,
          isActive: user.isActive,
          themePreference: user.themePreference,
          preferredLanguage: user.preferredLanguage,
          timeZone: user.timeZone,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError('Email and password are required.'));
    }

    try {
      const { user, accessToken, refreshToken } = await AuthService.authenticate(email, password);
      
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          roleName: user.roleName,
          isActive: user.isActive,
          themePreference: user.themePreference,
          preferredLanguage: user.preferredLanguage,
          timeZone: user.timeZone,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new ValidationError('Refresh token is required.'));
    }

    try {
      const tokens = await AuthService.rotateRefreshToken(refreshToken);
      res.json(tokens);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { refreshToken } = req.body;
    try {
      if (refreshToken) {
        await AuthService.revokeToken(refreshToken);
      }
      res.json({ message: 'Session logged out successfully.' });
    } catch (err: unknown) {
      next(err);
    }
  }
}
