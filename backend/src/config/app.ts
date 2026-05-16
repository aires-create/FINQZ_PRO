import { env } from './env.js';

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
  nodeEnv: env.nodeEnv,
  host: env.host,
  port: env.port,
  cors: {
    origin: env.corsOrigin,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  },
  jwt: {
    secret: env.jwtSecret,
    refreshSecret: env.jwtRefreshSecret,
    expiresIn: env.jwtExpiresIn,
    refreshExpiresIn: env.jwtRefreshExpiresIn,
  },
  bcryptRounds: env.bcryptRounds,
  logging: {
    level: env.logLevel,
    file: env.logFile,
  },
  swagger: {
    title: env.swaggerTitle,
    version: env.swaggerVersion,
    description: env.swaggerDescription,
    path: env.swaggerPath,
  },
};
