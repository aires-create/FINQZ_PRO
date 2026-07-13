const MAX_DEPTH = 6;
const MAX_PROPERTIES = 64;
const MAX_ARRAY_ITEMS = 64;
const MAX_STRING_LENGTH = 2_048;
const MAX_MAP_ENTRIES = 64;
const MAX_SET_ENTRIES = 64;

const REDACTED = '[REDACTED]';
const CYCLE = '[CYCLE]';
const MAX_DEPTH_MARKER = '[MAX_DEPTH]';
const TRUNCATED = '[TRUNCATED]';

const sensitiveKeyPattern =
  /(authorization|proxy-authorization|cookie|set-cookie|password|senha|token|secret|api[-_]?key|client[-_]?secret|refresh[-_]?token|access[-_]?token|tenantId|correlationId|traceId|spanId)/i;

const querySecretPattern =
  /([?&](?:password|senha|token|secret|api[-_]?key|client_secret|access_token|refresh_token|authorization)=)([^&#\s]+)/gi;

const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const jwtPattern = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const sensitiveWordPattern =
  /\b(password|senha|token|secret|authorization|cookie|api[-_]?key|client[-_]?secret|refresh[-_]?token|access[-_]?token)\b/i;
const credentialUrlPattern =
  /\b([a-z][a-z0-9+.-]*:\/\/)([^@\s/]+)@([^\s]+)/gi;
const cnpjPattern =
  /\b(\d{2})[.\s-]?(\d{3})[.\s-]?(\d{3})[./\s-]?(\d{4})[-\s]?(\d{2})\b/g;
const cpfPattern =
  /\b(\d{3})[.\s-]?(\d{3})[.\s-]?(\d{3})[-\s]?(\d{2})\b/g;
const bankAccountPattern = /(account|bank|iban|swift|routing|pix|agency)/i;
const controlCharsPattern = /[\u0000-\u001F\u007F]/g;
const whitespacePattern = /\s+/g;
const maxString = (value: string) =>
  value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}${TRUNCATED}` : value;

const maskDigits = (digits: string, visiblePrefix: number, visibleSuffix: number) => {
  if (digits.length <= visiblePrefix + visibleSuffix) {
    return REDACTED;
  }

  return `${digits.slice(0, visiblePrefix)}***${digits.slice(-visibleSuffix)}`;
};

const maskCpf = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 11) {
    return REDACTED;
  }

  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
};

const maskCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 14) {
    return REDACTED;
  }

  return `${digits.slice(0, 2)}.***.***/****-${digits.slice(-2)}`;
};

const maskBankingValue = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) {
    return REDACTED;
  }

  return maskDigits(digits, 0, Math.min(2, digits.length));
};

const redactSensitiveString = (value: string) => {
  let output = value
    .replace(controlCharsPattern, ' ')
    .replace(whitespacePattern, ' ')
    .trim();

  output = output.replace(bearerPattern, 'Bearer [REDACTED]');
  output = output.replace(jwtPattern, '[REDACTED_JWT]');
  output = output.replace(querySecretPattern, '$1[REDACTED]');
  output = output.replace(credentialUrlPattern, '$1[REDACTED]@$3');

  if (sensitiveWordPattern.test(output)) {
    return REDACTED;
  }

  if (cpfPattern.test(output)) {
    output = output.replace(cpfPattern, (_, a, b, c, d) => `${a}.***.***-${d}`);
  }

  if (cnpjPattern.test(output)) {
    output = output.replace(cnpjPattern, (_, a, b, c, d, e) => `${a}.***.***/****-${e}`);
  }

  return maxString(output);
};

const redactByKey = (key: string, value: string): string => {
  if (/cpf/i.test(key)) {
    return maskCpf(value);
  }

  if (/cnpj/i.test(key)) {
    return maskCnpj(value);
  }

  if (bankAccountPattern.test(key)) {
    return maskBankingValue(value);
  }

  if (sensitiveKeyPattern.test(key)) {
    return REDACTED;
  }

  return redactSensitiveString(value);
};

const sanitizeObjectLike = (
  value: unknown,
  key: string | undefined,
  depth: number,
  seen: WeakSet<object>,
): unknown => {
  if (depth >= MAX_DEPTH) {
    return MAX_DEPTH_MARKER;
  }

  if (typeof value === 'string') {
    return key ? redactByKey(key, value) : redactSensitiveString(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : REDACTED;
  }

  if (typeof value === 'boolean' || value === null) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'undefined') {
    return undefined;
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return REDACTED;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? REDACTED : value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: redactSensitiveString(value.name),
      message: redactSensitiveString(value.message),
      stack: value.stack ? maxString(redactSensitiveString(value.stack)) : undefined,
      ...(value.cause !== undefined
        ? { cause: sanitizeObjectLike(value.cause, 'cause', depth + 1, seen) }
        : {}),
    };
  }

  if (value instanceof Map) {
    if (seen.has(value)) {
      return CYCLE;
    }

    seen.add(value);
    const entries = Array.from(value.entries()).slice(0, MAX_MAP_ENTRIES);
    const output: Record<string, unknown> = {};

    for (const [entryKey, entryValue] of entries) {
      output[redactSensitiveString(String(entryKey))] = sanitizeObjectLike(
        entryValue,
        String(entryKey),
        depth + 1,
        seen,
      );
    }

    return output;
  }

  if (value instanceof Set) {
    if (seen.has(value)) {
      return CYCLE;
    }

    seen.add(value);
    return Array.from(value.values())
      .slice(0, MAX_SET_ENTRIES)
      .map((entry) => sanitizeObjectLike(entry, key, depth + 1, seen));
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return CYCLE;
    }

    seen.add(value);
    const result = value.slice(0, MAX_ARRAY_ITEMS).map((entry) =>
      sanitizeObjectLike(entry, key, depth + 1, seen),
    );

    return value.length > MAX_ARRAY_ITEMS ? [...result, TRUNCATED] : result;
  }

  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) {
      return CYCLE;
    }

    seen.add(value);

    const output: Record<string, unknown> = {};

    const keys = Object.keys(value).slice(0, MAX_PROPERTIES);

    for (const entryKey of keys) {
      let entryValue: unknown;

      try {
        entryValue = (value as Record<string, unknown>)[entryKey];
      } catch {
        output[entryKey] = REDACTED;
        continue;
      }

      const sanitized = sanitizeObjectLike(entryValue, entryKey, depth + 1, seen);

      if (sanitized !== undefined) {
        output[entryKey] = sanitized;
      }
    }

    return output;
  }

  return REDACTED;
};

export const sanitizeTelemetryText = (value: string): string => {
  try {
    return redactSensitiveString(value);
  } catch {
    return REDACTED;
  }
};

export const sanitizeTelemetryIdentifier = (
  value: string,
  options?: { keepPrefix?: number; keepSuffix?: number },
): string => {
  try {
    const sanitized = sanitizeTelemetryText(value);
    const keepPrefix = options?.keepPrefix ?? 3;
    const keepSuffix = options?.keepSuffix ?? 2;

    if (sanitized.length <= keepPrefix + keepSuffix) {
      return REDACTED;
    }

    return `${sanitized.slice(0, keepPrefix)}***${sanitized.slice(-keepSuffix)}`;
  } catch {
    return REDACTED;
  }
};

export const sanitizeTelemetryContext = <T extends Record<string, unknown>>(value: T): T => {
  try {
    const sanitized = sanitizeObjectLike(value, undefined, 0, new WeakSet<object>());

    return (sanitized && typeof sanitized === 'object' ? sanitized : {}) as T;
  } catch {
    return {} as T;
  }
};
