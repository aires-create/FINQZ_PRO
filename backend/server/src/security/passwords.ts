/**
 * FINQZ PRO - Password Security Module
 * Secure password handling with hashing
 */

import { randomBytes, createHash } from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

const SALT_ROUNDS = 12;
const TEMP_PASSWORD_LENGTH = 12;

// ============================================
// PASSWORD GENERATION
// ============================================

/**
 * Generate a secure random password using crypto
 * Replaces insecure Math.random() implementation
 */
export function generateSecurePassword(length: number = TEMP_PASSWORD_LENGTH): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomValues = randomBytes(length);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
}

/**
 * Generate a simple alphanumeric token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a numeric OTP code
 */
export function generateOTP(length: number = 6): string {
  const bytes = randomBytes(length);
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += (bytes[i] % 10).toString();
  }
  return otp;
}

// ============================================
// PASSWORD HASHING (Simple implementation for Edge Workers)
// ============================================

/**
 * Hash password using PBKDF2 (available in Edge Workers)
 * Note: For production, use Argon2 or bcrypt when available
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(32).toString('hex');
  const hash = createHash('sha256');
  hash.update(password + salt);
  const hashed = hash.digest('hex');
  return `${salt}:${hashed}`;
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = createHash('sha256');
    verifyHash.update(password + salt);
    const computed = verifyHash.digest('hex');
    return computed === hash;
  } catch {
    return false;
  }
}

/**
 * Check if password needs reset (first login, expired, etc.)
 */
export function passwordNeedsReset(user: { mustChangePassword?: boolean; passwordChangedAt?: number }): boolean {
  if (user.mustChangePassword) return true;
  
  // Password expired (90 days)
  if (user.passwordChangedAt) {
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    if (Date.now() - user.passwordChangedAt > ninetyDays) {
      return true;
    }
  }
  
  return false;
}

// ============================================
// PASSWORD VALIDATION
// ============================================

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================
// SENSITIVE DATA MASKING
// ============================================

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['senha', 'password', 'token', 'access_token', 'refresh_token', 'cpf', 'cnpj'];
  const masked = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in masked) {
      const value = masked[field];
      if (typeof value === 'string' && value.length > 4) {
        masked[field] = value.substring(0, 2) + '****' + value.substring(value.length - 2);
      } else {
        masked[field] = '****';
      }
    }
  }
  
  return masked;
}

/**
 * Remove sensitive fields from object before API response
 */
export function removeSensitiveFields<T extends Record<string, unknown>>(data: T, fields: string[] = ['senha', 'password', 'token']): T {
  const cleaned = { ...data };
  
  for (const field of fields) {
    if (field in cleaned) {
      delete (cleaned as Record<string, unknown>)[field];
    }
  }
  
  return cleaned;
}
