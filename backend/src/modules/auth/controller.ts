// ============================================
// FINQZ PRO - Auth Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { authService } from './service';
import { ApiResponse } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type { LoginRequest, RefreshTokenRequest, AuthResponse } from './types';

const logger = createModuleLogger('AuthController');

export class AuthController {
  // Login endpoint
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginRequest = req.body;

      logger.info(`Login request for email: ${data.email}`);

      const result = await authService.login(data);

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: result,
        message: 'Login successful',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Refresh token endpoint
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RefreshTokenRequest = req.body;

      logger.info('Refresh token request');

      const tokens = await authService.refreshToken(data);

      const response: ApiResponse<typeof tokens> = {
        success: true,
        data: tokens,
        message: 'Token refreshed successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Change password endpoint
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;

      logger.info(`Change password request for user: ${userId}`);

      await authService.changePassword(userId, currentPassword, newPassword);

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      // This would typically fetch full user data from service
      // For now, return basic info from token
      const profile = {
        id: req.user!.userId,
        email: req.user!.email,
        companyId: req.user!.companyId,
        roleId: req.user!.roleId,
      };

      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile,
        message: 'Profile retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Logout (client-side token removal)
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      logger.info(`Logout request for user: ${userId}`);

      // In a production app, you might want to blacklist the token
      // or implement token revocation

      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();