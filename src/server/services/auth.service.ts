import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { AuthenticationError } from '../errors/AppError.js';
import { config } from '../../config/environment.js';
import crypto from 'crypto';

export class AuthService {
  public static generateAccessToken(user: IUser): string {
    return jwt.sign(
      { id: user._id, username: user.username, roleName: user.roleName },
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

  public static async authenticate(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
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
      throw new AuthenticationError('Invalid email or password.');
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { user, accessToken, refreshToken };
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
}
