// ============================================
// FINQZ PRO - Auth Controller
// ============================================

import { prisma } from '../../database/prisma.js';
import { authService } from './service.js';
import { config } from '../../config/app.js';
import { ApiResponse } from '../../types/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  AuthResponse,
  LogoutRequest,
  SessionResponse,
  SessionRoleResponse,
} from './types.js';
import type { SecurityEventContext } from '../security-events/index.js';

const logger = createModuleLogger('AuthController');

const getHeaderValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

export class AuthController {
  async register(request: any, reply: any): Promise<void> {
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

  async login(request: any, reply: any): Promise<void> {
    const data = request.body as LoginRequest;
    const userAgent = getHeaderValue(request.headers?.['user-agent']);
    const requestId = request.requestId ?? request.id;
    const route = request.routeOptions?.url ?? request.url;
    const securityContext: SecurityEventContext = {
      ...(request.ip ? { ipAddress: request.ip } : {}),
      ...(userAgent ? { userAgent } : {}),
      ...(requestId ? { requestId } : {}),
      ...(route ? { route } : {}),
      ...(request.method ? { method: request.method } : {}),
    };

    logger.info(`Login request for email: ${data.email}`);

    const result = await authService.login(data, securityContext);

    reply.setCookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
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

  async refreshToken(request: any, reply: any): Promise<void> {
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
      secure: config.nodeEnv === 'production',
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

  async changePassword(request: any, reply: any): Promise<void> {
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

  async getProfile(request: any, reply: any): Promise<void> {
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

  async getSession(request: any, reply: any): Promise<void> {
    const currentUser = request.currentUser;

    if (!currentUser) {
      reply.status(401).send({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: currentUser.userId,
        tenantId: currentUser.tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        userRoles: {
          orderBy: {
            assignedAt: 'desc',
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: {
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.tenant.isActive || user.userRoles.length === 0) {
      reply.status(401).send({
        success: false,
        message: 'Invalid or expired access token',
      });
      return;
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

    const sessionUser: SessionResponse['user'] = {
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
    };

    logger.info(`Get session request for user: ${user.id}`);

    const response: ApiResponse<SessionResponse> = {
      success: true,
      data: {
        user: sessionUser,
      },
      message: 'Session retrieved successfully',
    };

    reply.send(response);
  }

  async logout(request: any, reply: any): Promise<void> {
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

  async logoutAll(request: any, reply: any): Promise<void> {
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
