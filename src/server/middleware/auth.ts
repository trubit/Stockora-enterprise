import { redis } from '../database/redis.js';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../errors/AppError.js';
import { config } from '../../config/environment.js';
import { SystemConfig } from '../models/SystemConfig.js';
import { Session } from '../models/Session.js';
import { memoryCache } from '../utils/cache.js';
import { logger } from '../logger.js';
import type { ITenant } from '../models/Tenant.js';

export interface AuthenticatedRequest extends Request {
  user?: Express.User;
  tenantId?: string;
  tenantSlug?: string;
  tenant?: ITenant;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extracts and normalizes the real client IP from the request.
 * Handles both string and array forms of X-Forwarded-For.
 */
function extractClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    return xForwardedFor[0].split(',')[0].trim();
  }
  return req.socket.remoteAddress || '';
}

/**
 * Sanitizes a string input to block MongoDB operator injection.
 * Strips keys starting with '$' from any nested objects.
 */
export function sanitizeInput(value: unknown): unknown {
  if (typeof value === 'string') {
    // Reject strings that look like MongoDB operators
    if (value.startsWith('$')) return '';
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizeInput);
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (!k.startsWith('$')) {
        sanitized[k] = sanitizeInput(v);
      }
    }
    return sanitized;
  }
  return value;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const ipAddress = extractClientIp(req);
  const userAgent = (req.headers['user-agent'] as string) || '';

  req.ipAddress = ipAddress;
  req.userAgent = userAgent;

  // 1. IP Allowlist & Denylist — cached to avoid a DB hit on every request
  try {
    const cacheKey = 'sysconfig:ip_rules';
    let ipRules = memoryCache.get<{ deniedIPs: string[]; allowedIPs: string[] }>(cacheKey);

    if (!ipRules) {
      const sysConfig = await SystemConfig.findOne().select('deniedIPs allowedIPs').lean();
      ipRules = {
        deniedIPs: sysConfig?.deniedIPs ?? [],
        allowedIPs: sysConfig?.allowedIPs ?? [],
      };
      // Cache for 60 seconds — avoids a DB round-trip on every authenticated request
      memoryCache.set(cacheKey, ipRules, 60_000);
    }

    if (ipRules.deniedIPs.length > 0) {
      const isDenied = ipRules.deniedIPs.some(
        (denied) => ipAddress === denied || ipAddress.startsWith(denied)
      );
      if (isDenied) {
        return next(new AuthorizationError('Access denied: your IP has been blocked.'));
      }
    }

    if (ipRules.allowedIPs.length > 0) {
      const isAllowed = ipRules.allowedIPs.some(
        (allowed) => ipAddress === allowed || ipAddress.startsWith(allowed)
      );
      if (!isAllowed) {
        return next(new AuthorizationError('Access denied: your IP is not in the allowed list.'));
      }
    }
  } catch (err) {
    // Non-fatal: log and continue. Do not block the request if SystemConfig is unreachable.
    logger.error('SystemConfig IP validation error (non-fatal):', err);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('No token provided.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as Express.User;

    req.user = decoded;
    if (decoded.tenantId) {
      req.tenantId = decoded.tenantId;
    }
    if (decoded.tenantSlug) {
      req.tenantSlug = decoded.tenantSlug;
    }

    // 2. Validate server-side session with Redis caching & throttled disk writes
    if (decoded.sessionToken) {
      const sessionCacheKey = `session:${decoded.sessionToken}`;
      let cachedSessionId: string | null = null;
      try {
        cachedSessionId = await redis.get(sessionCacheKey);
      } catch {
        // graceful Redis cache fallback
      }

      if (cachedSessionId) {
        req.sessionId = cachedSessionId;
      } else {
        const session = await Session.findOne({
          sessionToken: decoded.sessionToken,
          isActive: true,
          expiresAt: { $gt: new Date() },
        });

        if (!session) {
          return next(
            new AuthenticationError('Session has been revoked or expired. Please log in again.')
          );
        }

        req.sessionId = session._id.toString();

        // Cache session in Redis for 120 seconds to eliminate continuous DB write locks
        try {
          await redis.setex(sessionCacheKey, 120, req.sessionId);
        } catch {
          // ignore cache error
        }

        // Throttled lastSeenAt write: only update DB if lastSeenAt is older than 2 minutes
        const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
        if (Date.now() - lastSeen > 120_000) {
          Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } }).catch(
            () => {}
          );
        }
      }
    }

    next();
  } catch {
    return next(new AuthenticationError('Session expired or invalid token.'));
  }
}

export const authenticate = authMiddleware;
export const authenticateToken = authMiddleware;
export const requireAuth = authMiddleware;

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as Express.User;
    req.user = decoded;
    if (decoded.tenantId) {
      req.tenantId = decoded.tenantId;
    }
    if (decoded.tenantSlug) {
      req.tenantSlug = decoded.tenantSlug;
    }
    next();
  } catch {
    next();
  }
}
