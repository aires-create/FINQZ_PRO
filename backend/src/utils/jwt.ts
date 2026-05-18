// ============================================
// FINQZ PRO - JWT Utilities
// ============================================

import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/app.js';
import { AppError } from '../types/index.js';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  roleId: string;
  role: string;
  email: string;
  permissions?: string[];
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const withTokenId = (
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
): Omit<JWTPayload, 'iat' | 'exp'> => ({
  ...payload,
  jti: payload.jti ?? randomUUID(),
});

/**
 * Generate JWT access and refresh tokens
 */
export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
  const tokenPayload = withTokenId(payload);

  const accessToken = jwt.sign(tokenPayload, config.jwt.secret as any, {
    expiresIn: config.jwt.expiresIn as any,
  });

  const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret as any, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });

  return { accessToken, refreshToken };
}

/**
 * Generate only access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(withTokenId(payload), config.jwt.secret as any, {
    expiresIn: config.jwt.expiresIn as any,
  });
}

/**
 * Generate only refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(withTokenId(payload), config.jwt.refreshSecret as any, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Access token expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid access token', 401);
    }
    throw error;
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid refresh token', 401);
    }
    throw error;
  }
}

/**
 * Decode token without verification (useful for error handling)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiresAt(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiresAt = getTokenExpiresAt(token);
  if (!expiresAt) {
    return true;
  }
  return new Date() > expiresAt;
}

/**
 * Get token remaining time in seconds
 */
export function getTokenRemainingTime(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }
  return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
}
