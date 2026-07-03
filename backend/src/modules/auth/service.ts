// ============================================
// FINQZ PRO - Auth Service
// ============================================

import crypto from 'node:crypto';

import { AppError, AuthenticationError, ValidationError } from '../../types/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import {
  generateTokens,
  generateAccessToken,
  verifyRefreshToken,
  JWTPayload,
  TokenPair,
} from '../../utils/jwt.js';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  isCommonPassword,
} from '../../utils/password.js';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  SessionResponse,
  SessionRoleResponse,
} from './types.js';
import {
  recordSecurityEvent,
  type SecurityEventContext,
  type SecurityEventMetadata,
} from '../security-events/index.js';
import { authRepository } from './repositories/auth.repository.js';

const logger = createModuleLogger('AuthService');

const hashSecurityIdentifier = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

const getLoginFailureReason = (error: unknown) => {
  if (!(error instanceof AuthenticationError)) {
    return 'unexpected_error';
  }

  switch (error.message) {
    case 'Account is deactivated':
      return 'account_deactivated';
    case 'Tenant is not active':
      return 'tenant_inactive';
    case 'No role assigned to user':
    case 'User role assignment not found':
      return 'role_missing';
    default:
      return 'invalid_credentials';
  }
};

const buildLoginMetadata = (
  emailNormalized: string,
  reason?: string,
): SecurityEventMetadata => ({
  emailHash: hashSecurityIdentifier(emailNormalized),
  ...(reason ? { reason } : {}),
});

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
      const existingUser = await authRepository.findUserByEmail(data.email);

      if (existingUser) {
        throw new ValidationError('User already exists', ['Email already registered']);
      }

      // Get or create tenant
      let tenant = await authRepository.findActiveTenant();

      if (!tenant) {
        // Create default tenant if none exists
        const domain = emailNormalized.split('@')[1] || null;
        tenant = await authRepository.createTenant({
          name: data.companyName || 'Default Company',
          domain,
          isActive: true,
        });
      }

      // Get default role
      let role = await authRepository.findRoleByTenantAndSlug(tenant.id, 'user');

      if (!role) {
        // Create default role if it doesn't exist
        role = await authRepository.createRole({
          name: 'User',
          slug: 'user',
          tenantId: tenant.id,
          isSystem: true,
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user with primary role assignment through userRoles
      const user = await authRepository.createUserWithRole({
        email: data.email,
        emailNormalized,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName || '',
        tenantId: tenant.id,
        roleId: role.id,
        isActive: true,
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
      await authRepository.createRefreshToken({
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshTokenData.expiresAt,
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
  async login(
    data: LoginRequest,
    securityContext: SecurityEventContext = {},
  ): Promise<AuthResponse> {
    const emailNormalized = data.email.toLowerCase().trim();
    let resolvedTenantId: string | null = null;
    let resolvedUserId: string | null = null;

    try {
      logger.info(`Login attempt for email: ${data.email}`);

      // Find user with tenant and assigned roles
      // Find user with tenant information
      const user = await authRepository.findActiveUserByEmail(data.email);

      if (user) {
        resolvedTenantId = user.tenantId;
        resolvedUserId = user.id;
      }

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

      const userRole = await authRepository.findUserRoleByUserId(user.id, user.tenantId);

      if (!userRole) {
        throw new AuthenticationError('No role assigned to user', 401);
      }

      const permissions =
        userRole.role.rolePermissions
          ?.map((rp) => rp.permission?.slug)
          .filter((slug): slug is string => Boolean(slug)) ?? [];

      // Update last login
      await authRepository.touchUserLastLogin(user.id);

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
        permissions,
      });

      // Store refresh token in database
      const refreshTokenData = this.parseTokenExpiry(tokens.refreshToken);
      await authRepository.createRefreshToken({
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshTokenData.expiresAt,
      });

      logger.info(`Login successful for user: ${user.id}`);

      void recordSecurityEvent({
        ...securityContext,
        tenantId: user.tenantId,
        userId: user.id,
        eventType: 'AUTH_LOGIN_SUCCEEDED',
        severity: 'LOW',
        outcome: 'SUCCESS',
        metadata: buildLoginMetadata(emailNormalized),
      });

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
          permissions,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        void recordSecurityEvent({
          ...securityContext,
          tenantId: resolvedTenantId,
          userId: resolvedUserId,
          eventType: 'AUTH_LOGIN_FAILED',
          severity: 'MEDIUM',
          outcome: 'FAILURE',
          metadata: buildLoginMetadata(
            emailNormalized,
            getLoginFailureReason(error),
          ),
        });
      }

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
      const storedToken = await authRepository.findRefreshToken(data.refreshToken);

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
      const user = await authRepository.findUserById(decoded.userId);

      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive', 401);
      }

      const userRole = await authRepository.findUserRoleByUserId(user.id, user.tenantId);

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
      await authRepository.revokeRefreshToken(data.refreshToken, 'Token rotated');

      // Store new refresh token
      const newRefreshTokenData = this.parseTokenExpiry(tokens.refreshToken);
      await authRepository.createRefreshToken({
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: newRefreshTokenData.expiresAt,
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

      const user = await authRepository.findUserById(userId);

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
        authRepository.updateUserPassword(userId, hashedPassword),
        authRepository.revokeRefreshTokensForUser(userId, 'Password changed'),
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

      await authRepository.revokeRefreshToken(refreshToken, 'User logout');

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

      await authRepository.revokeRefreshTokensForUser(userId, 'Logout all sessions');

      logger.info(`All sessions logged out for user: ${userId}`);
    } catch (error) {
      logger.error('Logout all sessions failed:', error);
      throw error;
    }
  }

  async getSession(currentUser: {
    userId: string;
    tenantId: string;
    roleId: string;
    role: string;
    email: string;
  }): Promise<SessionResponse | null> {
    const user = await authRepository.findUserForSession(
      currentUser.userId,
      currentUser.tenantId,
    );

    if (!user || !user.tenant.isActive || user.userRoles.length === 0) {
      return null;
    }

    const roleEntries = user.userRoles
      .map<SessionRoleResponse | null>((userRole) => {
        const role = userRole.role;

        if (!role) {
          return null;
        }

        return {
          id: role.id,
          name: role.name,
          slug: role.slug,
          type: role.type,
        };
      })
      .filter((role): role is SessionRoleResponse => role !== null);

    const primaryRoleAssignment =
      user.userRoles.find((userRole) => userRole.roleId === currentUser.roleId) ??
      user.userRoles[0];
    const primaryRole = primaryRoleAssignment?.role;
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((userRole) =>
          userRole.role?.rolePermissions.map((rolePermission) => rolePermission.permission.slug) ?? [],
        ),
      ),
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: primaryRole?.id ?? currentUser.roleId,
        role: primaryRole?.slug ?? primaryRole?.name ?? currentUser.role ?? '',
        perfil: primaryRole?.slug ?? primaryRole?.name ?? currentUser.role ?? '',
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        roles: roleEntries,
        permissions,
      },
    };
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
