import { randomBytes } from 'node:crypto';
import net from 'node:net';
import type { FastifyReply, FastifyRequest } from 'fastify';

export const requestBodyLimits = {
  jsonBytes: 1_048_576,
  formBytes: 262_144,
  futureUploadBytes: 10_485_760,
} as const;

export const proxyTrustPolicy = {
  maxTrustedHops: 3,
} as const;

const forwardedHeaderNames = [
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'x-forwarded-server',
  'x-real-ip',
  'x-client-ip',
  'x-cluster-client-ip',
  'proxy',
  'x-original-url',
  'x-rewrite-url',
] as const;

const bodyMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type BodyLimitPolicy = {
  label: 'json' | 'form' | 'future_upload';
  bytes: number;
};

const getHeaderValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

const getContentType = (request: FastifyRequest) => {
  return getHeaderValue(request.headers['content-type'])
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();
};

const parseContentLength = (request: FastifyRequest) => {
  const value = getHeaderValue(request.headers['content-length']);

  if (!value) {
    return undefined;
  }

  const length = Number(value);

  return Number.isSafeInteger(length) && length >= 0 ? length : undefined;
};

const getBodyLimitPolicy = (
  contentType: string | undefined,
): BodyLimitPolicy => {
  if (contentType === 'application/x-www-form-urlencoded') {
    return {
      label: 'form',
      bytes: requestBodyLimits.formBytes,
    };
  }

  if (
    contentType === 'multipart/form-data' ||
    contentType === 'application/octet-stream'
  ) {
    return {
      label: 'future_upload',
      bytes: requestBodyLimits.futureUploadBytes,
    };
  }

  return {
    label: 'json',
    bytes: requestBodyLimits.jsonBytes,
  };
};

export const normalizeIpAddress = (address: string | undefined) => {
  if (!address) {
    return undefined;
  }

  const normalized = address.trim().replace(/^::ffff:/, '');

  return net.isIP(normalized) ? normalized : undefined;
};

const getIpv4Octets = (address: string) => {
  const octets = address.split('.').map((part) => Number(part));

  return octets.length === 4 &&
    octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
    ? octets
    : undefined;
};

const isTrustedIpv4Proxy = (address: string) => {
  const octets = getIpv4Octets(address);

  if (!octets) {
    return false;
  }

  const [first = 0, second = 0] = octets;

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31)
  );
};

const isTrustedIpv6Proxy = (address: string) => {
  const normalized = address.toLowerCase();

  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
};

export const isTrustedProxyAddress = (address: string, hop = 1) => {
  if (hop > proxyTrustPolicy.maxTrustedHops) {
    return false;
  }

  const normalized = normalizeIpAddress(address);

  if (!normalized) {
    return false;
  }

  return net.isIP(normalized) === 4
    ? isTrustedIpv4Proxy(normalized)
    : isTrustedIpv6Proxy(normalized);
};

export const trustProxy = (address: string, hop: number) => {
  return isTrustedProxyAddress(address, hop);
};

export function applyRequestSanitization(request: FastifyRequest): void {
  const peerAddress = normalizeIpAddress(request.raw.socket.remoteAddress);
  const peerIsTrustedProxy = peerAddress
    ? isTrustedProxyAddress(peerAddress)
    : false;

  if (!peerIsTrustedProxy) {
    for (const headerName of forwardedHeaderNames) {
      delete request.headers[headerName];
    }
  }

  request.normalizedIp = normalizeIpAddress(request.ip) ?? peerAddress ?? null;
  request.trustedProxyChain = peerIsTrustedProxy;
}

export function enforceRequestSizeGovernance(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!bodyMethods.has(request.method)) {
    return undefined;
  }

  const contentLength = parseContentLength(request);

  if (contentLength === undefined) {
    return undefined;
  }

  const policy = getBodyLimitPolicy(getContentType(request));

  if (contentLength <= policy.bytes) {
    return undefined;
  }

  return reply.status(413).send({
    success: false,
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Payload too large.',
    limit: {
      type: policy.label,
      bytes: policy.bytes,
    },
  });
}

export const baselineSecurityHeaders = {
  contentTypeOptions: 'nosniff',
  frameOptions: 'DENY',
  referrerPolicy: 'no-referrer',
  permissionsPolicy:
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
} as const;

export const buildContentSecurityPolicy = () => {
  return [
    "default-src 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "img-src 'self' data:",
    "font-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "connect-src 'self'",
  ].join('; ');
};

export const createCspNonce = () => randomBytes(16).toString('base64');

export const buildSwaggerContentSecurityPolicy = (nonce: string) => {
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "img-src 'self' data: https://validator.swagger.io",
    "font-src 'self' data: https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    `script-src 'self' 'nonce-${nonce}' https://unpkg.com`,
    "connect-src 'self'",
  ].join('; ');
};
