import type { FastifyReply, FastifyRequest } from 'fastify';
import type { JWTPayload, TenantContext } from './index.js';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser: JWTPayload | null;
    currentTenant: TenantContext | null;
    requestId: string | null;
    correlationId: string | null;
    startTime: number | null;
    securityEventLogKeys?: string[];
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    challengeAuthorization: (reply: FastifyReply, message?: string) => void;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
