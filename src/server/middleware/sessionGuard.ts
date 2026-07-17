import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { Session } from '../models/Session.js';
import { AuthenticationError } from '../errors/AppError.js';

/**
 * sessionGuard
 * Additional security validation middleware.
 * Detects if the current request session exists, is active,
 * matches the current IP and User Agent to prevent session hijacking.
 */
export async function sessionGuard(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required.'));
  }

  if (!req.sessionId) {
    // If route doesn't have sessionToken inside JWT, bypass or throw depending on policy
    return next();
  }

  try {
    const session = await Session.findById(req.sessionId);
    if (!session || !session.isActive) {
      return next(new AuthenticationError('Session is invalid or has been logged out.'));
    }

    // IP or User Agent hijacking prevention check
    const currentIp = req.ipAddress || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const currentUserAgent = req.headers['user-agent'] || '';

    // If either IP or UA changes dramatically, reject & flag (basic risk detection)
    if (session.ipAddress !== currentIp || session.userAgent !== currentUserAgent) {
      // In production, we might want to flag risk instead of strict block, but strict block is secure!
      session.isActive = false;
      await session.save();
      return next(new AuthenticationError('Security violation: session properties changed. Please log in again.'));
    }

    next();
  } catch (err) {
    next(err);
  }
}
