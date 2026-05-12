// ============================================
// FINQZ PRO - Auth Controller
// ============================================

import type { FastifyReply, FastifyRequest } from 'fastify';
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
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = request.body as RegisterRequest;

    logger.info(`Registration request for email: ${data.email}`);

    const result = await authService.register(data);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'User registered successfully',
    };

    reply.code(201).send(response);
  }

  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = request.body as LoginRequest;

    logger.info(`Login request for email: ${data.email}`);

    const result = await authService.login(data);

    reply.setCookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Login successful',
    };

    reply.send(response);
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    let refreshToken = (request.body as RefreshTokenRequest)?.refreshToken;

    if (!refreshToken && request.cookies?.refreshToken) {
      refreshToken = request.cookies.refreshToken;
    }

    if (!refreshToken) {
      reply.status(401).send({
        success: false,
        message: 'Refresh token required',
      });
      return;
    }

    logger.info('Refresh token request');

    const tokens = await authService.refreshToken({ refreshToken });

    reply.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    const response: ApiResponse<typeof tokens> = {
      success: true,
      data: tokens,
      message: 'Token refreshed successfully',
    };

    reply.send(response);
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.currentUser;
    const data = request.body as ChangePasswordRequest;

    logger.info(`Change password request for user: ${user?.userId}`);

    await authService.changePassword(user!.userId, data);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    reply.send(response);
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.currentUser;

    logger.info(`Get profile request for user: ${user?.userId}`);

    const profile = {
      id: user!.userId,
      email: user!.email,
      tenantId: user!.tenantId,
      roleId: user!.roleId,
      role: user!.role,
    };

    const response: ApiResponse<typeof profile> = {
      success: true,
      data: profile,
      message: 'Profile retrieved successfully',
    };

    reply.send(response);
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    let refreshToken = (request.body as LogoutRequest)?.refreshToken;

    if (!refreshToken && request.cookies?.refreshToken) {
      refreshToken = request.cookies.refreshToken;
    }

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    reply.clearCookie('refreshToken');

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    reply.send(response);
  }

  async logoutAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.currentUser;

    logger.info(`Logout all sessions for user: ${user?.userId}`);

    await authService.logoutAll(user!.userId);

    reply.clearCookie('refreshToken');

    const response: ApiResponse = {
      success: true,
      message: 'All sessions logged out successfully',
    };

    reply.send(response);
  }
}

export const authController = new AuthController();
