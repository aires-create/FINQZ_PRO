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
  redis: {
    url: string;
    host: string;
    port: number;
    password?: string;
    db: number;
    tls: boolean;
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
  integrations: {
    novaPromotora: {
      baseUrl?: string;
      apiKey?: string;
      healthPath?: string;
      proposalsPath?: string;
      timeoutMs?: number;
    };
    sosBolso: {
      enabled: boolean;
      baseUrl?: string;
      tokenPath?: string;
      marginPath?: string;
      clientId?: string;
      clientSecret?: string;
      timeoutMs?: number;
      signedJwt?: string;
    };
    bluepay: {
      enabled: boolean;
      baseUrl?: string;
      clientId?: string;
      clientSecret?: string;
      timeoutMs?: number;
    };
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
  redis: {
    url: env.redisUrl,
    host: env.redisHost,
    port: env.redisPort,
    ...(env.redisPassword ? { password: env.redisPassword } : {}),
    db: env.redisDb,
    tls: env.redisTls,
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
  integrations: {
    novaPromotora: {
      ...(env.novaPromotoraBaseUrl ? { baseUrl: env.novaPromotoraBaseUrl } : {}),
      ...(env.novaPromotoraApiKey ? { apiKey: env.novaPromotoraApiKey } : {}),
      ...(env.novaPromotoraHealthPath ? { healthPath: env.novaPromotoraHealthPath } : {}),
      ...(env.novaPromotoraProposalsPath ? { proposalsPath: env.novaPromotoraProposalsPath } : {}),
      ...(env.novaPromotoraTimeoutMs ? { timeoutMs: env.novaPromotoraTimeoutMs } : {}),
    },
    sosBolso: {
      enabled: env.sosBolsoEnabled,
      ...(env.sosBolsoBaseUrl ? { baseUrl: env.sosBolsoBaseUrl } : {}),
      ...(env.sosBolsoTokenPath ? { tokenPath: env.sosBolsoTokenPath } : {}),
      ...(env.sosBolsoMarginPath ? { marginPath: env.sosBolsoMarginPath } : {}),
      ...(env.sosBolsoClientId ? { clientId: env.sosBolsoClientId } : {}),
      ...(env.sosBolsoClientSecret ? { clientSecret: env.sosBolsoClientSecret } : {}),
      ...(env.sosBolsoTimeoutMs ? { timeoutMs: env.sosBolsoTimeoutMs } : {}),
      ...(env.sosBolsoSignedJwt ? { signedJwt: env.sosBolsoSignedJwt } : {}),
    },
    bluepay: {
      enabled: env.bluepayEnabled,
      ...(env.bluepayBaseUrl ? { baseUrl: env.bluepayBaseUrl } : {}),
      ...(env.bluepayClientId ? { clientId: env.bluepayClientId } : {}),
      ...(env.bluepayClientSecret ? { clientSecret: env.bluepayClientSecret } : {}),
      ...(env.bluepayTimeoutMs ? { timeoutMs: env.bluepayTimeoutMs } : {}),
    },
  },
};
