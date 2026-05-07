// ============================================
// FINQZ PRO - Auth Service
// ============================================

import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma';
import { config } from '../../config/app';
import { AuthenticationError, AppError } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type { LoginRequest, AuthResponse, RefreshTokenRequest } from './types';

const logger = createModuleLogger('AuthService');

export class AuthService {
  // Generate JWT tokens
  private generateTokens(payload: { userId: string; companyId: string; roleId: string; email: string }) {
    const accessToken = jwt.sign(payload, config.jwt.secret as any, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret as any, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcryptRounds);
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      logger.info(`Login attempt for email: ${data.email}`);

      // Find user with company and role
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: {
          company: true,
          role: true,
        },
      });

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(data.password, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokens = this.generateTokens({
        userId: user.id,
        companyId: user.companyId,
        roleId: user.roleId,
        email: user.email,
      });

      logger.info(`Login successful for user: ${user.id}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          companyId: user.companyId,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(data: RefreshTokenRequest): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      logger.info('Token refresh attempt');

      // Verify refresh token
      const decoded = jwt.verify(data.refreshToken, config.jwt.refreshSecret) as any;

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          isActive: true,
          companyId: true,
          roleId: true,
          email: true,
        },
      });

      if (!user || !user.isActive) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens({
        userId: user.id,
        companyId: user.companyId,
        roleId: user.roleId,
        email: user.email,
      });

      logger.info(`Token refresh successful for user: ${user.id}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      logger.info(`Password change attempt for user: ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      logger.info(`Password changed successfully for user: ${userId}`);
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  // Validate token (for middleware)
  async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          isActive: true,
          companyId: true,
          roleId: true,
          email: true,
        },
      });

      if (!user || !user.isActive) {
        throw new AuthenticationError('Token invalid');
      }

      return decoded;
    } catch (error) {
      throw new AuthenticationError('Token invalid');
    }
  }
}

export const authService = new AuthService();