// ============================================
// FINQZ PRO - Auth Service
// ============================================

import { prisma } from '../../database/prisma';
import { AppError, AuthenticationError, ValidationError } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import {
  generateTokens,
  generateAccessToken,
  verifyRefreshToken,
  JWTPayload,
  TokenPair,
} from '../../utils/jwt';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  isCommonPassword,
} from '../../utils/password';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
} from './types';

const logger = createModuleLogger('AuthService');

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      logger.info(`Register attempt for email: ${data.email}`);

      // Validate password strength
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        throw new ValidationError('Password does not meet requirements', passwordValidation.errors);
      }

      // Check for common passwords
      if (isCommonPassword(data.password)) {
        throw new ValidationError('Password is too common', ['Please choose a stronger password']);
      }

      // Normalize email
      const emailNormalized = data.email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          emailNormalized: emailNormalized,
        },
      });

      if (existingUser) {
        throw new ValidationError('User already exists', ['Email already registered']);
      }

      // Get or create tenant
      let tenant = await prisma.tenant.findFirst({
        where: { isActive: true },
      });

      if (!tenant) {
        // Create default tenant if none exists
        const domain = emailNormalized.split('@')[1] || null;
        tenant = await prisma.tenant.create({
          data: {
            name: data.companyName || 'Default Company',
            domain,
            isActive: true,
          },
        });
      }

      // Get default role
      let role = await prisma.role.findFirst({
        where: {
          tenantId: tenant.id,
          slug: 'user',
        },
      });

      if (!role) {
        // Create default role if it doesn't exist
        role = await prisma.role.create({
          data: {
            name: 'User',
            slug: 'user',
            tenantId: tenant.id,
            isSystem: true,
          },
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user with primary role assignment through userRoles
      const user = await prisma.user.create({
        data: {
          email: data.email,
          emailNormalized,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName || '',
          tenant: { connect: { id: tenant.id } },
          userRoles: {
            create: {
              tenant: { connect: { id: tenant.id } },
              role: { connect: { id: role.id } },
            },
          },
          isActive: true,
        },
        include: {
          tenant: true,
          userRoles: {
            include: { role: true },
          },
        },
      });

      // Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        tenantId: user.tenantId,
        roleId: role.id,
        role: role.slug || role.name,
        email: user.email,
      });

      // Store refresh token in database
      const refreshTokenData = this.parseTokenExpiry(tokens.refreshToken);
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: refreshTokenData.expiresAt,
        },
      });

      logger.info(`User registered successfully: ${user.id}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: role.id,
          role: role.slug || role.name,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      logger.info(`Login attempt for email: ${data.email}`);

      // Normalize email
      const emailNormalized = data.email.toLowerCase().trim();

      // Find user with tenant and assigned roles
      // Find user with tenant information
      const user = await prisma.user.findFirst({
        where: { emailNormalized },
        include: {
          tenant: true,
          userRoles: {
            include: { role: true },
          },
        },
      });

      if (!user) {
        throw new AuthenticationError('Invalid credentials', 401);
      }

      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated', 401);
      }

      // Verify tenant is active
      if (!user.tenant.isActive) {
        throw new AuthenticationError('Tenant is not active', 401);
      }

      // Verify password
      const isValidPassword = await verifyPassword(data.password, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid credentials', 401);
      }

      const userRole = await prisma.userRole.findFirst({
        where: {
          userId: user.id,
          tenantId: user.tenantId,
        },
        include: {
          role: true,
        },
        orderBy: {
          assignedAt: 'desc',
        },
      });

      if (!userRole) {
        throw new AuthenticationError('No role assigned to user', 401);
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const assignedRole = user.userRoles?.[0]?.role;
      if (!assignedRole) {
        throw new AuthenticationError('User role assignment not found', 401);
      }

      // Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        tenantId: user.tenantId,
        roleId: userRole.roleId,
        role: assignedRole.slug || assignedRole.name,
        email: user.email,
      });

      // Store refresh token in database
      const refreshTokenData = this.parseTokenExpiry(tokens.refreshToken);
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: refreshTokenData.expiresAt,
        },
      });

      logger.info(`Login successful for user: ${user.id}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: assignedRole.id,
          role: assignedRole.slug || assignedRole.name,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<TokenPair> {
    try {
      logger.info('Token refresh attempt');

      // Verify refresh token signature
      const decoded = verifyRefreshToken(data.refreshToken);

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: data.refreshToken },
      });

      if (!storedToken) {
        throw new AuthenticationError('Refresh token not found', 401);
      }

      // Check if token is revoked
      if (storedToken.revokedAt) {
        throw new AuthenticationError('Refresh token has been revoked', 401);
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        throw new AuthenticationError('Refresh token is expired', 401);
      }

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          isActive: true,
          tenantId: true,
          email: true,
        },
      });

      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive', 401);
      }

      const userRole = await prisma.userRole.findFirst({
        where: {
          userId: user.id,
          tenantId: user.tenantId,
        },
        include: {
          role: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
        orderBy: {
          assignedAt: 'desc',
        },
      });

      if (!userRole || !userRole.role) {
        throw new AuthenticationError('No role assigned to user', 401);
      }

      // Generate new tokens
      const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: user.id,
        tenantId: user.tenantId,
        roleId: userRole.roleId,
        role: userRole.role.slug || userRole.role.name,
        email: user.email,
      };

      if (decoded.permissions) {
        tokenPayload.permissions = decoded.permissions;
      }

      const tokens = generateTokens(tokenPayload);

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { token: data.refreshToken },
        data: { revokedAt: new Date(), revokedReason: 'Token rotated' },
      });

      // Store new refresh token
      const newRefreshTokenData = this.parseTokenExpiry(tokens.refreshToken);
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: newRefreshTokenData.expiresAt,
        },
      });

      logger.info(`Token refresh successful for user: ${user.id}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    try {
      logger.info(`Password change attempt for user: ${userId}`);

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(data.newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError('New password does not meet requirements', passwordValidation.errors);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isValidPassword = await verifyPassword(data.currentPassword, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect', 401);
      }

      // Hash new password
      const hashedPassword = await hashPassword(data.newPassword);

      // Update password and revoke all refresh tokens
      await Promise.all([
        prisma.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }),
        prisma.refreshToken.updateMany({
          where: {
            userId: userId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            revokedReason: 'Password changed',
          },
        }),
      ]);

      logger.info(`Password changed successfully for user: ${userId}`);
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      logger.info('Logout attempt');

      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revokedAt: new Date(), revokedReason: 'User logout' },
      });

      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout failed:', error);
      // Don't throw error on logout failure
    }
  }

  /**
   * Logout all sessions (revoke all refresh tokens)
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      logger.info(`Logout all sessions for user: ${userId}`);

      await prisma.refreshToken.updateMany({
        where: {
          userId: userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'Logout all sessions',
        },
      });

      logger.info(`All sessions logged out for user: ${userId}`);
    } catch (error) {
      logger.error('Logout all sessions failed:', error);
      throw error;
    }
  }

  /**
   * Parse JWT token expiry
   */
  private parseTokenExpiry(token: string): { expiresAt: Date } {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new AppError('Invalid token format', 400);
    }

    try {
      const payload = parts[1];
      if (!payload) {
        throw new AppError('Invalid token payload', 400);
      }
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      return {
        expiresAt: new Date(decoded.exp * 1000),
      };
    } catch (error) {
      throw new AppError('Failed to parse token expiry', 400);
    }
  }
}

export const authService = new AuthService();
