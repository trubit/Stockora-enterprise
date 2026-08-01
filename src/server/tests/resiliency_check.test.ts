import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { redis } from '../database/redis.js';
import { Session } from '../models/Session.js';
import { sessionGuard } from '../middleware/sessionGuard.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { Response } from 'express';

describe('Resiliency, Proxy IP, and Reconnection Audits', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/stockora_test_resiliency_audit');
    await Session.deleteMany({});
  });

  afterAll(async () => {
    await Session.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Redis Resilient Reconnect Strategy', () => {
    it('should calculate exponential backoff with jitter and enforce retry limits', () => {
      const strategy = redis.options.retryStrategy;
      expect(strategy).toBeDefined();

      if (strategy) {
        // Attempt 1: baseDelay is 200ms. Delay is capped at Math.min(200 * 2^0, 5000) = 200. Jittered delay is between 50 and 200.
        const delay1 = strategy(1);
        expect(delay1).toBeTypeOf('number');
        expect(delay1).toBeGreaterThanOrEqual(50);
        expect(delay1).toBeLessThanOrEqual(200);

        // Attempt 5: 200 * 2^4 = 3200ms. Delay is capped at Math.min(3200, 5000) = 3200. Jittered delay is between 50 and 3200.
        const delay5 = strategy(5);
        expect(delay5).toBeTypeOf('number');
        expect(delay5).toBeGreaterThanOrEqual(50);
        expect(delay5).toBeLessThanOrEqual(3200);

        // Attempt 15: Exceeds maximum retries limit (10). Should abort connection (return null).
        const delay15 = strategy(15);
        expect(delay15).toBeNull();
      }
    });
  });

  describe('Secure Proxy Client IP Extraction & Hijacking Protection', () => {
    it('should split and parse proxy headers safely to identify original client IP', async () => {
      // Mock an active database session matching a client IP
      const session = await Session.create({
        userId: new mongoose.Types.ObjectId(),
        sessionToken: `active-session-token-unique-hash-${Date.now()}`,
        ipAddress: '192.168.1.5',
        userAgent: 'Mozilla/TestAgent',
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000),
      });

      // 1. Success case: Matching client IP in the proxy header chain
      const reqSuccess = {
        user: { id: 'user-1' },
        sessionId: session._id,
        headers: {
          'x-forwarded-for': '192.168.1.5, 10.0.0.1, 10.0.0.2',
          'user-agent': 'Mozilla/TestAgent',
        },
        socket: {},
      } as unknown as AuthenticatedRequest;

      const nextSuccess = () => {};
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      let nextErrorThrown: any = null;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const nextFailure = (err?: any) => {
        nextErrorThrown = err;
      };

      await sessionGuard(reqSuccess, {} as Response, nextSuccess);
      expect(nextErrorThrown).toBeNull();

      // 2. Failure case: Hijacked session (IP changes)
      const reqHijack = {
        user: { id: 'user-1' },
        sessionId: session._id,
        headers: {
          'x-forwarded-for': '99.99.99.99, 10.0.0.1', // Spoofed or hijacked IP
          'user-agent': 'Mozilla/TestAgent',
        },
        socket: {},
      } as unknown as AuthenticatedRequest;

      await sessionGuard(reqHijack, {} as Response, nextFailure);
      expect(nextErrorThrown).toBeDefined();
      expect(nextErrorThrown?.message).toContain('Security violation: session properties changed');

      // Check that hijacked session was deactivated
      const updatedSession = await Session.findById(session._id);
      expect(updatedSession?.isActive).toBe(false);
    });
  });
});
