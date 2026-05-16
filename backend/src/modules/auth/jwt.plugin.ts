import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import crypto from 'node:crypto';
import { config } from '../../config/app.js';
import { authenticate } from '../../core/http/middleware.js';

const getHeaderValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

const resolveRequestId = (value: string | string[] | undefined) => {
  const inboundRequestId = getHeaderValue(value);

  return inboundRequestId && inboundRequestId.length <= 128
    ? inboundRequestId
    : crypto.randomUUID();
};

const authJwtPluginHandler: FastifyPluginAsync = async (app) => {
  await app.register(cookie, {
    parseOptions: {
      httpOnly: true,
      sameSite: 'strict',
    },
  });

  await app.register(jwt, {
    secret: config.jwt.secret as string,
    sign: {
      expiresIn: config.jwt.expiresIn as string,
    },
  });

  app.decorateRequest('currentUser', null);
  app.decorateRequest('currentTenant', null);
  app.decorateRequest('requestId', null);
  app.decorateRequest('correlationId', null);
  app.decorateRequest('startTime', null);

  app.decorate('authenticate', authenticate);

  app.decorate('challengeAuthorization', (reply: FastifyReply, message = 'Unauthorized') => {
    reply.status(401).send({
      success: false,
      message,
      statusCode: 401,
    });
  });

  app.addHook('onRequest', async (request, reply) => {
    const requestId = resolveRequestId(request.headers['x-request-id']);

    request.requestId = requestId;
    request.correlationId = requestId;
    request.startTime = Date.now();

    reply.header('X-Request-Id', requestId);
  });
};

export const authJwtPlugin = fp(authJwtPluginHandler, {
  name: 'finqz-auth-jwt',
});
