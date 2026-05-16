// ============================================
// FINQZ PRO - Logger Configuration
// ============================================

import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { config } from '../config/app.js';

type LogMeta = Record<string, unknown> | unknown;

type AppLogger = {
  error: (message: string, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  info: (message: string, meta?: LogMeta) => void;
  http: (message: string, meta?: LogMeta) => void;
  debug: (message: string, meta?: LogMeta) => void;
};

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

const logsDir = path.dirname(config.logging.file);

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
);

const winstonLogger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: config.logging.file,
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  ],
});

const writeLog = (
  level: keyof AppLogger,
  message: string,
  meta?: LogMeta,
) => {
  winstonLogger.log(level, message, meta ?? {});
};

export const logger: AppLogger = {
  error: (message, meta) => writeLog('error', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  info: (message, meta) => writeLog('info', message, meta),
  http: (message, meta) => writeLog('http', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta),
};

export const createModuleLogger = (moduleName: string): AppLogger => ({
  error: (message, meta) => logger.error(`[${moduleName}] ${message}`, meta),
  warn: (message, meta) => logger.warn(`[${moduleName}] ${message}`, meta),
  info: (message, meta) => logger.info(`[${moduleName}] ${message}`, meta),
  http: (message, meta) => logger.http(`[${moduleName}] ${message}`, meta),
  debug: (message, meta) => logger.debug(`[${moduleName}] ${message}`, meta),
});

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
        userAgent: req.get?.('User-Agent'),
      },
    );
  });

  next();
};

export default logger;