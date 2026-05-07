// ============================================
// FINQZ PRO - Auth Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { authService } from './service';
import { ApiResponse } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  AuthResponse,
  LogoutRequest,
} from './types';

const logger = createModuleLogger('AuthController');

export class AuthController {
  /**
   * Register endpoint
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterRequest = req.body;

      logger.info(`Registration request for email: ${data.email}`);

      const result = await authService.register(data);

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: result,
        message: 'User registered successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login endpoint
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginRequest = req.body;

      logger.info(`Login request for email: ${data.email}`);

      const result = await authService.login(data);

      // Set refresh token in secure cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

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

  /**
   * Refresh token endpoint
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let refreshToken = req.body.refreshToken;

      // If not in body, try to get from cookies
      if (!refreshToken && req.cookies?.refreshToken) {
        refreshToken = req.cookies.refreshToken;
      }

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token required',
        });
        return;
      }

      const data: RefreshTokenRequest = { refreshToken };

      logger.info('Refresh token request');

      const tokens = await authService.refreshToken(data);

      // Update refresh token in cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

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

  /**
   * Change password endpoint
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data: ChangePasswordRequest = req.body;

      logger.info(`Change password request for user: ${userId}`);

      await authService.changePassword(userId, data);

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      logger.info(`Get profile request for user: ${userId}`);

      const profile = {
        id: req.user!.userId,
        email: req.user!.email,
        tenantId: req.user!.tenantId,
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

  /**
   * Logout endpoint (revoke refresh token)
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let refreshToken = req.body.refreshToken;

      // If not in body, try to get from cookies
      if (!refreshToken && req.cookies?.refreshToken) {
        refreshToken = req.cookies.refreshToken;
      }

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear cookie
      res.clearCookie('refreshToken');

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout all sessions endpoint
   */
  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      logger.info(`Logout all sessions for user: ${userId}`);

      await authService.logoutAll(userId);

      // Clear cookie
      res.clearCookie('refreshToken');

      const response: ApiResponse = {
        success: true,
        message: 'All sessions logged out successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
