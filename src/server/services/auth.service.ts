import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Session } from '../models/Session.js';
import { SystemConfig, type IPasswordPolicy } from '../models/SystemConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthenticationError } from '../errors/AppError.js';
import { config } from '../../config/environment.js';
import crypto from 'crypto';

export function validatePasswordStrength(password: string, policy: IPasswordPolicy): string | null {
  if (password.length < policy.minLength) {
    return `Password must be at least ${policy.minLength} characters long.`;
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
}

export class AuthService {
  public static generateAccessToken(user: IUser, sessionToken?: string): string {
    return jwt.sign(
      {
        id: user._id,
        username: user.username,
        roleName: user.roleName,
        branchId: user.branchId,
        allowedBranches: user.allowedBranches,
        sessionToken, // Hashed version signed in JWT payload to identify DB Session
      },
      config.jwtSecret,
      { expiresIn: '15m' }
    );
  }

  public static async generateRefreshToken(user: IUser): Promise<string> {
    const tokenStr = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
      userId: user._id,
      token: tokenStr,
      expiresAt,
    });

    return tokenStr;
  }

  public static async authenticate(
    email: string,
    password: string,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
    deviceFingerprint?: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string; sessionId: string }> {

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AuthenticationError('Invalid email or password.');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const diffMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new AuthenticationError(`Account locked due to multiple login failures. Try again in ${diffMinutes} minutes.`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        user.failedLoginAttempts = 0;
      }
      await user.save();

      // Log failed authentication attempt
      await AuditLog.create({
        action: 'LOGIN_FAILED',
        targetModel: 'User',
        targetId: user._id.toString(),
        ipAddress,
        userAgent,
        newValues: { email, reason: 'Incorrect password' },
      });

      throw new AuthenticationError('Invalid email or password.');
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // 1. Fetch system configuration settings (session controls, password policies)
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

    // 2. Concurrent Session Enforcement (invalidate oldest sessions if limit exceeded)
    const activeSessions = await Session.find({ userId: user._id, isActive: true }).sort({ lastSeenAt: 1 });
    const maxSessions = sysConfig.maxConcurrentSessions || 3;
    if (activeSessions.length >= maxSessions) {
      const overage = activeSessions.length - maxSessions + 1;
      for (let i = 0; i < overage; i++) {
        const oldestSession = activeSessions[i];
        oldestSession.isActive = false;
        await oldestSession.save();

        // Audit log the concurrent session invalidation
        await AuditLog.create({
          userId: user._id,
          action: 'SESSION_TERMINATED_CONCURRENT',
          targetModel: 'Session',
          targetId: oldestSession._id.toString(),
          ipAddress: oldestSession.ipAddress,
          userAgent: oldestSession.userAgent,
          sessionId: oldestSession._id.toString(),
        });
      }
    }

    // 3. Create active session record in DB
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const hashedSessionToken = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
    const timeoutMin = sysConfig.sessionTimeoutMinutes || 60;
    const expiresAt = new Date(Date.now() + timeoutMin * 60 * 1000);

    const session = await Session.create({
      userId: user._id,
      sessionToken: hashedSessionToken,
      ipAddress,
      userAgent,
      deviceFingerprint,
      isActive: true,
      expiresAt,
    });

    const accessToken = this.generateAccessToken(user, hashedSessionToken);
    const refreshToken = await this.generateRefreshToken(user);

    // Audit log successful authentication
    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      targetModel: 'User',
      targetId: user._id.toString(),
      ipAddress,
      userAgent,
      sessionId: session._id.toString(),
    });

    return { user, accessToken, refreshToken, sessionId: session._id.toString() };
  }

  public static async rotateRefreshToken(tokenStr: string): Promise<{ accessToken: string; refreshToken: string }> {
    const activeToken = await RefreshToken.findOne({ token: tokenStr });
    if (!activeToken || !activeToken.isActive) {
      throw new AuthenticationError('Session expired or invalid.');
    }

    const user = await User.findById(activeToken.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('Session owner is deactivated.');
    }

    // Attempt to rotate while maintaining current session binding if present
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshTokenStr = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    activeToken.revokedAt = new Date();
    activeToken.replacedByToken = newRefreshTokenStr;
    await activeToken.save();

    await RefreshToken.create({
      userId: user._id,
      token: newRefreshTokenStr,
      expiresAt,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshTokenStr };
  }

  public static async revokeToken(tokenStr: string): Promise<void> {
    const token = await RefreshToken.findOne({ token: tokenStr });
    if (token) {
      token.revokedAt = new Date();
      await token.save();
    }
  }

  /**
   * Hard-logout a user across all active sessions/devices.
   */
  public static async forceLogoutUser(userId: string, adminUserId: string): Promise<void> {
    // 1. Revoke all refresh tokens
    await RefreshToken.updateMany(
      { userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );

    // 2. Inactivate all active Sessions
    const activeSessions = await Session.find({ userId, isActive: true });
    for (const session of activeSessions) {
      session.isActive = false;
      await session.save();

      // Log audit trail for each session force closed
      await AuditLog.create({
        userId: new mongoose.Types.ObjectId(adminUserId),
        action: 'FORCE_LOGOUT_SESSION',
        targetModel: 'Session',
        targetId: session._id.toString(),
        newValues: { userId },
      });
    }
  }
}
