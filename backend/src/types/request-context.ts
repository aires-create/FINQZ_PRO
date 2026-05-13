export interface JwtPayload {
  sub: string;
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantId?: string;
      requestId?: string;
    }
  }
}

export {};