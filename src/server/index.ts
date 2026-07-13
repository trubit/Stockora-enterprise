import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { config } from '../config/environment.js';
import { logger } from './logger.js';
import { securityMiddleware } from './middleware/security.js';
import { DBConnectionManager } from './database/connection.js';
import { SocketManager } from './sockets/manager.js';
import { QueueManager } from './queue/bullmq.js';
import { apiRouter } from './routes/api.js';
import { notFoundHandler, errorHandler } from './errors/handlers.js';
import { seedRolesIfEmpty } from './database/seeder.js';

const app = express();
const httpServer = createServer(app);

// Initialize Sockets lifecycle manager
const socketManager = SocketManager.getInstance();
socketManager.initialize(httpServer);

// Apply Security Middlewares
app.use(securityMiddleware);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Static Assets (Logo, Uploaded avatars, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(express.static(path.join(process.cwd(), 'public')));

// Log HTTP Requests
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
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
  logger.warn(`Shutdown signal received [${signal}]. Terminating processes...`);

  await new Promise<void>((resolve) => {
    httpServer.close(() => {
      logger.info('HTTP Server closed.');
      resolve();
    });
  });

  await QueueManager.getInstance().shutdown();
  await socketManager.shutdown();
  await dbManager.disconnect();

  logger.warn('Stockora Server stopped. Exiting.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start Database & Server
async function startServer() {
  await dbManager.connect();
  await seedRolesIfEmpty();

  httpServer.listen(config.port, () => {
    logger.info(
      `Stockora Server running in [${config.env}] mode on http://localhost:${config.port}`
    );
  });
}

startServer();
