import type { JWTPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: string;
      companyId?: string;
      userContext?: {
        roles: Array<Record<string, any>>;
        permissions: Set<string>;
      };
    }
  }
}

export {};
