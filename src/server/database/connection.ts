import mongoose from 'mongoose';
import { logger } from '../logger.js';
import { config } from '../../config/environment.js';
import { ResilientExecutor } from '../utils/resiliency/index.js';

export class DBConnectionManager {
  private static instance: DBConnectionManager | null = null;
  private isShuttingDown = false;

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): DBConnectionManager {
    if (!DBConnectionManager.instance) {
      DBConnectionManager.instance = new DBConnectionManager();
    }
    return DBConnectionManager.instance;
  }

  public async connect(): Promise<void> {
    if (mongoose.connection.readyState >= 1) return;

    try {
      mongoose.set('strictQuery', true);

      const options = {
        maxPoolSize: 200,
        minPoolSize: 20,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      };

      await ResilientExecutor.execute(
        {
          name: 'MongoDB',
          retryCount: 10,
          baseDelayMs: 500,
          maxDelayMs: 5000,
          backoffType: 'EXPONENTIAL',
          jitterType: 'FULL',
          isIdempotent: true,
        },
        async () => {
          await mongoose.connect(config.mongodbUri, options);
        }
      );

      logger.info(`MongoDB Connected successfully: ${mongoose.connection.host}`);
    } catch (err) {
      logger.error('Failed to establish MongoDB database pool:', err);
    }
  }

  private setupListeners(): void {
    mongoose.connection.on('disconnected', () => {
      if (!this.isShuttingDown) {
        logger.warn('MongoDB connection lost. Reconnecting...');
      }
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB pool internal error:', err);
    });
  }

  public async disconnect(): Promise<void> {
    this.isShuttingDown = true;
    if (mongoose.connection.readyState === 0) return;

    try {
      await mongoose.connection.close();
      logger.info('MongoDB database pool disconnected cleanly.');
    } catch (err) {
      logger.error('Error closing MongoDB connection:', err);
    }
  }
}
