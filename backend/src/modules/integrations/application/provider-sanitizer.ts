const SENSITIVE_HEADER_KEYS = new Set([
  'authorization',
  'proxy-authorization',
  'x-api-key',
  'api-key',
  'x-access-token',
  'access-token',
  'cookie',
  'set-cookie',
  'client-secret',
]);

const SENSITIVE_TOKEN_KEYS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'client_secret',
  'secret',
  'password',
]);

const MASK = '[REDACTED]';

const toDigits = (value: string): string => value.replace(/\D/g, '');

const keepLast = (value: string, visible: number): string => {
  if (value.length <= visible) {
    return '*'.repeat(value.length);
  }

  return `${'*'.repeat(value.length - visible)}${value.slice(-visible)}`;
};

const sanitizePrimitive = (value: string): string =>
  maskPixKey(maskBankAccount(maskCnpj(maskCpf(value))));

const sanitizeByKey = (key: string, value: string): string => {
  const normalized = key.toLowerCase();
  if (normalized.includes('cpf') || normalized.includes('document')) {
    return maskCpf(value);
  }
  if (normalized.includes('cnpj')) {
    return maskCnpj(value);
  }
  if (normalized.includes('pix')) {
    return maskPixKey(value);
  }
  if (normalized.includes('account') || normalized.includes('conta')) {
    return maskBankAccount(value);
  }
  return sanitizePrimitive(value);
};

const sanitizeUnknown = (value: unknown, keyName?: string): unknown => {
  if (typeof value === 'string') {
    return keyName ? sanitizeByKey(keyName, value) : sanitizePrimitive(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item, keyName));
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (SENSITIVE_TOKEN_KEYS.has(key.toLowerCase())) {
        output[key] = MASK;
      } else {
        output[key] = sanitizeUnknown(item, key);
      }
    }
    return output;
  }

  return value;
};

export const maskCpf = (value: string): string => {
  const digits = toDigits(value);
  if (digits.length !== 11) {
    return value;
  }

  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
};

export const maskCnpj = (value: string): string => {
  const digits = toDigits(value);
  if (digits.length !== 14) {
    return value;
  }

  return `${digits.slice(0, 2)}.***.***/****-${digits.slice(-2)}`;
};

export const maskBankAccount = (value: string): string => {
  const digits = toDigits(value);
  if (digits.length < 4 || digits.length > 20 || digits.length === 11 || digits.length === 14) {
    return value;
  }

  return keepLast(digits, 2);
};

export const maskPixKey = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  if (trimmed.includes('@') && trimmed.includes('.')) {
    const [name, domain] = trimmed.split('@');
    if (!name || !domain) {
      return value;
    }
    return `${name.slice(0, 2)}***@${domain}`;
  }

  const digits = toDigits(trimmed);
  if (digits.length === 11 || digits.length === 14) {
    return keepLast(digits, 2);
  }

  if (trimmed.length >= 8) {
    return `${trimmed.slice(0, 3)}***${trimmed.slice(-2)}`;
  }

  return value;
};

export const sanitizeProviderPayload = <T>(payload: T): T => sanitizeUnknown(payload) as T;

export const sanitizeProviderHeaders = (
  headers: HeadersInit | undefined,
): Record<string, string> => {
  const raw = new Headers(headers);
  const sanitized: Record<string, string> = {};

  raw.forEach((value, key) => {
    const normalized = key.toLowerCase();
    sanitized[key] = SENSITIVE_HEADER_KEYS.has(normalized) ? MASK : sanitizePrimitive(value);
  });

  return sanitized;
};

export const sanitizeProviderError = (error: unknown): {
  name?: string;
  message: string;
  code?: string;
  status?: number;
} => {
  if (error instanceof Error) {
    const details = error as Error & { code?: unknown; status?: unknown };
    const code = typeof details.code === 'string' ? details.code : undefined;
    const status = typeof details.status === 'number' ? details.status : undefined;

    return {
      name: error.name,
      message: sanitizePrimitive(error.message),
      ...(code ? { code } : {}),
      ...(typeof status === 'number' ? { status } : {}),
    };
  }

  return {
    message: typeof error === 'string' ? sanitizePrimitive(error) : 'Unknown provider error',
  };
};
