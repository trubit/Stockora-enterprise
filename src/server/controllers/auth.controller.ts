import type { Request, Response, NextFunction } from 'express';
import { AuthService, validatePasswordStrength } from '../services/auth.service.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { SystemConfig } from '../models/SystemConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { ValidationError, ConflictError } from '../errors/AppError.js';
import { EmailService } from '../services/email.service.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { username, email, password, roleName, branchId, allowedBranches } = req.body;

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

      // Password policy validation
      let sysConfig = await SystemConfig.findOne();
      if (!sysConfig) {
        sysConfig = await SystemConfig.create({
          maintenanceMode: false,
          featureFlags: new Map([
            ['loyaltyProgram', true],
            ['offlinePOS', true],
            ['returns exchanges', true],
          ]),
          allowedIPs: [],
          deniedIPs: [],
          maxConcurrentSessions: 3,
          sessionTimeoutMinutes: 60,
        });
      }

      const policy = sysConfig.passwordPolicy;
      const passError = validatePasswordStrength(password, policy);
      if (passError) {
        return next(new ValidationError(passError));
      }

      const user = await User.create({
        username,
        email,
        password,
        roleName,
        branchId,
        allowedBranches: allowedBranches || (branchId ? [branchId] : []),
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
          branchId: user.branchId,
          allowedBranches: user.allowedBranches,
        },
      });
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password, deviceFingerprint } = req.body;
    if (!email || !password) {
      return next(new ValidationError('Email and password are required.'));
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    try {
      const { user, accessToken, refreshToken, sessionId } = await AuthService.authenticate(
        email,
        password,
        ipAddress,
        userAgent,
        deviceFingerprint
      );
      
      res.json({
        accessToken,
        refreshToken,
        sessionId,
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
          branchId: user.branchId,
          allowedBranches: user.allowedBranches,
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
