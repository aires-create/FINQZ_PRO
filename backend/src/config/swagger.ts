import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './app';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: config.swagger.title,
    version: config.swagger.version,
    description: config.swagger.description,
  },
  servers: [
    {
      url: `http://${config.host}:${config.port}`,
      description: 'Local server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'JWT authentication and session lifecycle' },
    { name: 'Organizations', description: 'Tenant organization hierarchy and isolation boundaries' },
    { name: 'Memberships', description: 'User membership management inside tenant organizations' },
    { name: 'Roles', description: 'Tenant-scoped role hierarchy' },
    { name: 'Permissions', description: 'Granular RBAC permission catalog' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { nullable: true },
          meta: { type: 'object', nullable: true },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      AuthenticationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Authentication required' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          companyName: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      AuthResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      email: { type: 'string', format: 'email' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      role: { type: 'string' },
                      tenantId: { type: 'string', format: 'uuid' },
                      tenantName: { type: 'string' },
                    },
                  },
                  tokens: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      CreateOrganizationRequest: {
        type: 'object',
        required: ['name', 'code', 'type'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          code: { type: 'string', maxLength: 50 },
          description: { type: 'string', maxLength: 500 },
          type: { type: 'string', enum: ['department', 'division', 'team', 'unit'] },
          parentId: { type: 'string', format: 'uuid' },
          settings: { type: 'object', additionalProperties: true },
        },
      },
      CreateMembershipRequest: {
        type: 'object',
        required: ['userId', 'organizationId', 'role'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['member', 'manager', 'admin', 'owner'] },
          permissions: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [path.join(process.cwd(), 'src/modules/**/*.ts')],
});
