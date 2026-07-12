import { Redis } from 'ioredis';
import { config } from '../config/environment.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;
let isRedisConnected = false;

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    try {
      redisClient = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false, // Don't queue commands while offline to avoid memory leaks
        retryStrategy(times: number) {
          const delay = Math.min(times * 100, 2000);
          logger.warn(`Retrying Redis connection in ${delay}ms... (attempt ${times})`);
          if (times > 3) {
            // Stop retrying to prevent endless logs if Redis is missing
            logger.error('Redis connection attempts exceeded limit. Continuing without Redis.');
            return null; 
          }
          return delay;
        },
      });

      redisClient.on('connect', () => {
        isRedisConnected = true;
        logger.info('Redis Connected successfully.');
      });

      redisClient.on('error', (error: Error) => {
        isRedisConnected = false;
        logger.error(`Redis Error: ${error?.message || String(error)}`);
      });
      
    } catch (err) {
      logger.error(`Could not initialize Redis client: ${err}`);
      redisClient = null;
    }
  }
  return redisClient;
}

export function isRedisReady(): boolean {
  return isRedisConnected && redisClient !== null;
}

// Initialize client
getRedisClient();
