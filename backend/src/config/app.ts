// ============================================
// FINQZ PRO - Application Configuration
// ============================================

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  // Server Configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // File Upload
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads/',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  },

  // Multi-tenant
  multiTenant: {
    defaultCompanyId: process.env.DEFAULT_COMPANY_ID || '1',
    mode: process.env.TENANT_MODE || 'multi-tenant',
  },

  // External APIs (optional)
  apis: {
    openai: process.env.OPENAI_API_KEY,
    stripe: {
      secret: process.env.STRIPE_SECRET_KEY,
      publishable: process.env.STRIPE_PUBLISHABLE_KEY,
    },
    creditCheck: {
      url: process.env.CREDIT_CHECK_API_URL,
      key: process.env.CREDIT_CHECK_API_KEY,
    },
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    newRelicKey: process.env.NEW_RELIC_LICENSE_KEY,
  },
} as const;

// Type-safe config access
export type Config = typeof config;