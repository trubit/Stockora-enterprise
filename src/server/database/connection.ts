import mongoose from 'mongoose';
import { logger } from '../logger.js';
import { config } from '../../config/environment.js';

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
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(config.mongodbUri, options);
      logger.info(`MongoDB Connected successfully: ${mongoose.connection.host}`);
    } catch (err) {
      logger.error('Failed to establish MongoDB database pool:', err);
      if (!this.isShuttingDown) {
        logger.info('Retrying connection to database in 5 seconds...');
        setTimeout(() => this.connect(), 5000);
      }
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
