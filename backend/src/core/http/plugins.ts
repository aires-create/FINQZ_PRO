import { FastifyPluginAsync } from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { config } from '../../config/app';
import { AppError } from '../../types';
import crypto from 'node:crypto';
import type { JWTPayload } from '../../shared/types';

export const httpAuthPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cookie, {
    parseOptions: {
      httpOnly: true,
      sameSite: 'strict',
    },
  });

  await app.register(jwt, {
    secret: config.jwt.secret as string,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  app.decorateRequest('currentUser', null);
  app.decorateRequest('currentTenant', null);
  app.decorateRequest('requestId', null);
  app.decorateRequest('startTime', null);

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const payload = (await request.jwtVerify()) as JWTPayload;
      request.currentUser = payload;
      request.currentTenant = {
        tenantId: payload.tenantId,
        userId: payload.userId,
        roleId: payload.roleId,
      };
    } catch (error) {
      reply.status(401).send(new AppError('Invalid or expired access token', 401));
    }
  });

  app.addHook('onRequest', async (request: any, reply: any) => {
    request.requestId = crypto.randomUUID();
    request.startTime = Date.now();
  });
};
