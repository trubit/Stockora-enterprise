import express from 'express';
import { createServer } from 'http';
import path from 'path';
import cluster from 'cluster';
import os from 'os';
import compression from 'compression';
import { config } from '../config/environment.js';
import { logger } from './logger.js';
import { securityMiddleware } from './middleware/security.js';
import { DBConnectionManager } from './database/connection.js';
import { SocketManager } from './sockets/manager.js';
import { QueueManager } from './queue/bullmq.js';
import { apiRouter } from './routes/api.js';
import { notFoundHandler, errorHandler } from './errors/handlers.js';
import { seedRolesIfEmpty, seedProductsIfEmpty } from './database/seeder.js';

const app = express();
const httpServer = createServer(app);

// Initialize Sockets lifecycle manager
const socketManager = SocketManager.getInstance();
socketManager.initialize(httpServer);

// Apply Security Middlewares
app.use(securityMiddleware);

// Gzip Compression
app.use(compression());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Static Assets (Logo, Uploaded avatars, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(express.static(path.join(process.cwd(), 'public')));

// Log HTTP Requests
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.url} - IP: ${req.ip} (PID: ${process.pid})`);
  next();
});

// Versioned APIs Route Prefix
app.use('/api/v1', apiRouter);

// Serve Frontend in Production Mode
if (config.isProduction) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Graceful welcome message for API root in development
  app.get('/', (_req, res) => {
    res.json({
      message:
        'Welcome to the Stockora Enterprise API Server (Development Mode). Please navigate to the frontend port.',
      endpoints: {
        health: '/api/v1/health',
        products: '/api/v1/products',
        transactions: '/api/v1/transactions',
      },
    });
  });
}

// 404 Route Catch Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware (OWASP Secure Coding standard)
app.use(errorHandler);

// Database connection lifecycle singleton
const dbManager = DBConnectionManager.getInstance();

// Graceful Shutdown Handler
async function gracefulShutdown(signal: string) {
  logger.warn(`Shutdown signal received [${signal}] on worker [${process.pid}]. Terminating processes...`);

  await new Promise<void>((resolve) => {
    httpServer.close(() => {
      logger.info(`HTTP Server closed on worker [${process.pid}].`);
      resolve();
    });
  });

  await QueueManager.getInstance().shutdown();
  await socketManager.shutdown();
  await dbManager.disconnect();

  try {
    const { redisManager } = await import('./database/redis.js');
    await redisManager.disconnect();
  } catch (err) {
    logger.error('Error disconnecting Redis client during shutdown:', err);
  }

  logger.warn(`Stockora Worker [${process.pid}] stopped. Exiting.`);
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start Database & Server
async function startServer() {
  await dbManager.connect();
  await seedRolesIfEmpty();
  await seedProductsIfEmpty();

  httpServer.listen(config.port, () => {
    logger.info(
      `Stockora Worker (PID: ${process.pid}) running in [${config.env}] mode on http://localhost:${config.port}`
    );
  });
}

// Spawns CPU-based process clusters in production mode for unlimited horizontal scaling
if (config.isProduction) {
  if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    logger.info(`Stockora Primary Process running (PID: ${process.pid}). Forking ${numCPUs} cluster workers...`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker process ${worker.process.pid} exited (code: ${code}, signal: ${signal}). Reviving worker...`);
      cluster.fork();
    });
  } else {
    startServer();
  }
} else {
  // Single thread run for developer debugging ease in development environments
  startServer();
}
