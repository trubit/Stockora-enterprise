import { Redis } from 'ioredis';
import { logger } from '../logger.js';
import { config } from '../../config/environment.js';

class RedisManager {
  private static instance: RedisManager | null = null;
  private client: Redis | null = null;

  private constructor() {}

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public getClient(): Redis {
    if (!this.client) {
      this.client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        reconnectOnError: (err: Error) => {
          logger.error('Redis reconnecting due to error:', err);
          return true;
        },
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected successfully.');
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis client error:', err);
      });
    }

    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis client disconnected cleanly.');
      this.client = null;
    }
  }
}

export const redis = RedisManager.getInstance().getClient();
export const redisManager = RedisManager.getInstance();
