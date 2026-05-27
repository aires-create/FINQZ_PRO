import {
  maskBankAccount,
  maskCnpj,
  maskCpf,
  maskPixKey,
  sanitizeProviderHeaders,
  sanitizeProviderPayload,
} from '../../../modules/integrations/application/provider-sanitizer.js';

describe('ProviderSanitizer', () => {
  it('masks cpf and cnpj values', () => {
    expect(maskCpf('12345678901')).toBe('123.***.***-01');
    expect(maskCnpj('12345678000195')).toBe('12.***.***/****-95');
  });

  it('masks bank account and pix key values', () => {
    expect(maskBankAccount('1234567')).toBe('*****67');
    expect(maskPixKey('pix-chave-12345')).toBe('pix***45');
  });

  it('sanitizes payload with sensitive token and pix/cpf values', () => {
    const sanitized = sanitizeProviderPayload({
      cpf: '12345678901',
      token: 'super-secret-token',
      nested: {
        pixKey: 'cliente@pix.com.br',
      },
    });

    expect(sanitized).toEqual({
      cpf: '123.***.***-01',
      token: '[REDACTED]',
      nested: {
        pixKey: 'cl***@pix.com.br',
      },
    });
  });

  it('removes sensitive headers and keeps safe headers', () => {
    const headers = sanitizeProviderHeaders({
      authorization: 'Bearer abc',
      'x-api-key': 'xyz',
      'x-request-id': 'req-1',
    });

    expect(headers.authorization).toBe('[REDACTED]');
    expect(headers['x-api-key']).toBe('[REDACTED]');
    expect(headers['x-request-id']).toBe('req-1');
  });
});
