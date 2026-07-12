import mongoose from 'mongoose';
import { config } from '../config/environment.js';
import { logger } from './logger.js';

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error instanceof Error ? error.message : String(error)}`);
    // In production, we might want the server to fail-fast.
    // In development, we degrade gracefully so compilation/testing can continue.
    if (config.isProduction) {
      process.exit(1);
    } else {
      logger.warn('Running without MongoDB connection. Databases operations will fail.');
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB internal connection error: ${err}`);
});

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully due to application termination.');
    process.exit(0);
  } catch (err) {
    logger.error(`Error during MongoDB connection closure: ${err}`);
    process.exit(1);
  }
});
