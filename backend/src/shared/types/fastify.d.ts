import type { FastifyReply, FastifyRequest } from 'fastify';
import type { JWTPayload, TenantContext } from './index';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: JWTPayload;
    currentTenant?: TenantContext;
    requestId?: string;
    startTime?: number;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    challengeAuthorization: (reply: FastifyReply, message?: string) => void;
  }
}
