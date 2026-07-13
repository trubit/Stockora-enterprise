import winston from 'winston';
import path from 'path';
import { config } from '../config/environment.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
  )
);

const transports: winston.transport[] = [];

if (config.isProduction) {
  // In production, write to files in JSON format for log collection systems
  const logsDir = path.join(process.cwd(), 'logs');
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(winston.format.json()),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(winston.format.json()),
    })
  );
}

// Always log to console with colors
transports.push(
  new winston.transports.Console({
    level: config.isDevelopment ? 'debug' : 'info',
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message}`)
    ),
  })
);

export const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  levels,
  format,
  transports,
});
