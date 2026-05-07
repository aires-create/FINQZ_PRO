// ============================================
// FINQZ PRO - Logger Configuration
// ============================================

import winston from 'winston';
import path from 'path';
import { config } from '../config/app';

// Define log levels
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

// Add colors to winston
winston.addColors(colors);

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: config.logging.file,
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json(),
    ),
  }),

  // Error log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json(),
    ),
  }),
];

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format,
  transports,
});

// Custom logger methods for different contexts
export const createModuleLogger = (moduleName: string) => ({
  error: (message: string, meta?: any) => logger.error(`[${moduleName}] ${message}`, meta),
  warn: (message: string, meta?: any) => logger.warn(`[${moduleName}] ${message}`, meta),
  info: (message: string, meta?: any) => logger.info(`[${moduleName}] ${message}`, meta),
  http: (message: string, meta?: any) => logger.http(`[${moduleName}] ${message}`, meta),
  debug: (message: string, meta?: any) => logger.debug(`[${moduleName}] ${message}`, meta),
});

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );
  });

  next();
};

export default logger;