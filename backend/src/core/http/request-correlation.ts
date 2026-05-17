import { randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

export const requestIdHeaderName = 'X-Request-ID';

const maxRequestIdLength = 128;
const requestIdPattern = /^[A-Za-z0-9._:-]+$/;

const getHeaderValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

export const isValidInboundRequestId = (
  value: string | undefined,
): value is string => {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  return (
    trimmed.length > 0 &&
    trimmed.length <= maxRequestIdLength &&
    trimmed === value &&
    requestIdPattern.test(trimmed)
  );
};

export const resolveRequestId = (value: string | string[] | undefined) => {
  const inboundRequestId = getHeaderValue(value);

  return isValidInboundRequestId(inboundRequestId)
    ? inboundRequestId
    : randomUUID();
};

export const applyRequestCorrelation = (
  request: FastifyRequest,
  reply: FastifyReply,
): void => {
  const requestId =
    request.requestId ?? resolveRequestId(request.headers['x-request-id']);

  request.requestId = requestId;
  request.correlationId = request.correlationId ?? requestId;
  request.startTime = request.startTime ?? Date.now();

  reply.header(requestIdHeaderName, requestId);
};
