// ============================================
// FINQZ PRO - Logger Configuration
// ============================================

import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';
import winston from 'winston';
import { config } from '../config/app.js';

type LogMeta = unknown;
type SanitizedLogRecord = { [key: string]: SanitizedLogValue };
type SanitizedLogValue =
  | string
  | number
  | boolean
  | null
  | SanitizedLogValue[]
  | SanitizedLogRecord;

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

const sensitiveLogKeyPattern =
  /(password|senha|token|secret|authorization|cookie|set-cookie|credential|session|api[-_]?key|private[-_]?key|database_url|redis_url|jwt_secret|jwt_refresh_secret|processenv|envvars|environmentvariables)/i;
const redactedValue = '[REDACTED]';
const maxLogDepth = 5;
const maxLogKeys = 100;
const maxArrayItems = 50;
const maxStringLength = 2_048;

const logsDir = path.dirname(config.logging.file);

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: config.nodeEnv !== 'production' }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = logFormat;

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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getErrorCode = (error: Error) => {
  const errorRecord = error as Error & { code?: unknown };

  if (
    typeof errorRecord.code === 'string' ||
    typeof errorRecord.code === 'number'
  ) {
    return String(errorRecord.code);
  }

  return undefined;
};

export const sanitizeLogText = (value: string) => {
  const withoutBearerTokens = value.replace(
    /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,
    'Bearer [REDACTED]',
  );

  const withoutNamedSecrets = withoutBearerTokens.replace(
    /\b(password|senha|access[_-]?token|refresh[_-]?token|token|secret|authorization|cookie|credential|session|api[-_]?key)\b\s*[:=]\s*[^,\s}]+/gi,
    '$1=[REDACTED]',
  );

  const withoutJwtLikeTokens = withoutNamedSecrets.replace(
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    '[REDACTED_JWT]',
  );

  const withoutSecretUrls = withoutJwtLikeTokens.replace(
    /\b(postgresql|postgres|redis|rediss):\/\/[^\s,}]+/gi,
    '$1://[REDACTED]',
  );

  return withoutSecretUrls.length <= maxStringLength
    ? withoutSecretUrls
    : `${withoutSecretUrls.slice(0, maxStringLength)}[TRUNCATED]`;
};

const sanitizeError = (error: Error): SanitizedLogRecord => {
  const errorCode = getErrorCode(error);
  const sanitized: SanitizedLogRecord = {
    errorName: error.name,
    errorMessage: sanitizeLogText(error.message),
  };

  if (errorCode) {
    sanitized.errorCode = sanitizeLogText(errorCode);
  }

  if (config.nodeEnv !== 'production' && error.stack) {
    sanitized.stack = sanitizeLogText(error.stack);
  }

  return sanitized;
};

const sanitizeLogValue = (
  key: string,
  value: unknown,
  depth: number,
): SanitizedLogValue => {
  if (sensitiveLogKeyPattern.test(key)) {
    return redactedValue;
  }

  if (value instanceof Error) {
    return sanitizeError(value);
  }

  if (typeof value === 'string') {
    return sanitizeLogText(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value === undefined) {
    return '[UNDEFINED]';
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return `[${typeof value}]`;
  }

  if (depth >= maxLogDepth) {
    return '[MAX_DEPTH]';
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, maxArrayItems)
      .map((item) => sanitizeLogValue(key, item, depth + 1));
  }

  if (!isRecord(value)) {
    return '[UNSUPPORTED]';
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, unknown] => entry[1] !== undefined)
      .slice(0, maxLogKeys)
      .map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeLogValue(entryKey, entryValue, depth + 1),
      ]),
  ) as SanitizedLogRecord;
};

const sanitizeLogMeta = (meta?: LogMeta): SanitizedLogRecord => {
  if (meta === undefined) {
    return {};
  }

  const sanitized = sanitizeLogValue('meta', meta, 0);

  return isRecord(sanitized) ? sanitized : { value: sanitized };
};

const writeLog = (
  level: keyof AppLogger,
  message: string,
  meta?: LogMeta,
) => {
  winstonLogger.log(level, sanitizeLogText(message), sanitizeLogMeta(meta));
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

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const url = req.originalUrl.split('?')[0] || req.originalUrl;

    logger.http(
      `${req.method} ${url} ${res.statusCode} - ${duration}ms`,
      {
        method: req.method,
        url,
        statusCode: res.statusCode,
        durationMs: duration,
        latencyMs: duration,
        ip: req.ip,
        userAgent: req.get?.('User-Agent'),
      },
    );
  });

  next();
};

export default logger;
