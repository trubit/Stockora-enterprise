import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Router } from 'express';
import { config } from '../../config/environment.js';

export const securityMiddleware = Router();

// 1. Helmet headers for OWASP compliance (XSS protection, clickjacking prevention, HSTS)
securityMiddleware.use(
  helmet({
    contentSecurityPolicy: config.isProduction ? undefined : false, // Disable CSP in dev to allow Vite HMR
  })
);

// 2. CORS configuration - Restricts access to whitelist origin
securityMiddleware.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Rate limiting to prevent Brute Force & DoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isProduction ? 100 : 1000, // Limit each IP
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
securityMiddleware.use('/api/', apiLimiter);

// 4. Gzip/Brotli compression for performance optimization
securityMiddleware.use(compression());

// 5. Parse cookies securely
securityMiddleware.use(cookieParser(config.jwtSecret));
