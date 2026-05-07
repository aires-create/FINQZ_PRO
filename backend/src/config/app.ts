import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  cors: {
    origin: string | string[];
    methods: string[];
    credentials: boolean;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  bcryptRounds: number;
  logging: {
    level: string;
    file: string;
  };
  swagger: {
    title: string;
    version: string;
    description: string;
    path: string;
  };
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT ?? 4000),
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : ['*'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refreshsupersecret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  swagger: {
    title: process.env.SWAGGER_TITLE || 'FINQZ PRO API',
    version: process.env.SWAGGER_VERSION || '1.0.0',
    description: process.env.SWAGGER_DESCRIPTION || 'FINQZ PRO backend API documentation',
    path: process.env.SWAGGER_PATH || '/api-docs',
  },
};
