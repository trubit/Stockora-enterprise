import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../errors/AppError.js';
import { config } from '../../config/environment.js';
import { SystemConfig } from '../models/SystemConfig.js';
import { Session } from '../models/Session.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    roleName: string;
  };
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  req.ipAddress = ipAddress;
  req.userAgent = userAgent;

  // 1. IP Allowlist & Denylist Enforcement from SystemConfig
  try {
    const sysConfig = await SystemConfig.findOne();
    if (sysConfig) {
      // Denylist check
      if (sysConfig.deniedIPs && sysConfig.deniedIPs.length > 0) {
        const isDenied = sysConfig.deniedIPs.some(
          (denied) => ipAddress === denied || ipAddress.includes(denied)
        );
        if (isDenied) {
          return next(new AuthorizationError('Access denied: your IP is blacklisted.'));
        }
      }

      // Allowlist check
      if (sysConfig.allowedIPs && sysConfig.allowedIPs.length > 0) {
        const isAllowed = sysConfig.allowedIPs.some(
          (allowed) => ipAddress === allowed || ipAddress.includes(allowed)
        );
        if (!isAllowed) {
          return next(new AuthorizationError('Access denied: your IP is not in the allowed list.'));
        }
      }
    }
  } catch (err) {
    // If system config fails to load, log it but don't block auth unless strictly required.
    console.error('SystemConfig IP validation failed:', err);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('No token provided.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      username: string;
      roleName: string;
      sessionToken?: string; // We can sign sessionToken in the JWT payload
    };

    req.user = decoded;

    // 2. Validate session in DB if sessionToken exists in token
    if (decoded.sessionToken) {
      const session = await Session.findOne({ sessionToken: decoded.sessionToken, isActive: true });
      if (!session) {
        return next(new AuthenticationError('Session has been revoked or expired.'));
      }
      if (session.expiresAt < new Date()) {
        session.isActive = false;
        await session.save();
        return next(new AuthenticationError('Session expired. Please log in again.'));
      }
      // Update last seen
      session.lastSeenAt = new Date();
      await session.save();
      req.sessionId = session._id.toString();
    }

    next();
  } catch (err) {
    return next(new AuthenticationError('Session expired or invalid.'));
  }
}

// Export authMiddleware as authenticate to support both import styles in routes
export const authenticate = authMiddleware;
