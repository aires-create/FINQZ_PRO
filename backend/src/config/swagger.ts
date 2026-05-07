// ============================================
// FINQZ PRO - Swagger/OpenAPI Configuration
// ============================================

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './app';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'FINQZ PRO API',
    version: '1.0.0',
    description: 'Enterprise SaaS Fintech Backend API for FINQZ PRO',
    contact: {
      name: 'FINQZ PRO Team',
      email: 'support@finqzpro.com',
    },
    license: {
      name: 'UNLICENSED',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://api.finqzpro.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
      },
    },
    schemas: {
      // Common response schemas
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the request was successful',
          },
          data: {
            description: 'Response data',
          },
          message: {
            type: 'string',
            description: 'Response message',
          },
          errors: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Error messages if any',
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
      // Auth schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@company.com',
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'User password',
            example: 'SecurePass123!',
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@company.com',
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'User password (must be strong)',
            example: 'SecurePass123!',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          companyName: {
            type: 'string',
            description: 'Company name (optional, creates new tenant)',
            example: 'My Company Ltd',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'uuid-string' },
                  email: { type: 'string', example: 'user@company.com' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  role: { type: 'string', example: 'user' },
                  tenantId: { type: 'string', example: 'uuid-string' },
                  tenantName: { type: 'string', example: 'My Company Ltd' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string', description: 'JWT access token' },
                  refreshToken: { type: 'string', description: 'JWT refresh token' },
                },
              },
            },
          },
          message: { type: 'string', example: 'Login successful' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token',
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            description: 'Current password',
          },
          newPassword: {
            type: 'string',
            minLength: 8,
            description: 'New password (must be strong)',
          },
        },
      },
      // Error schemas
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Email is required', 'Password must be at least 8 characters'],
          },
        },
      },
      AuthenticationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid credentials' },
        },
      },
      AuthorizationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Insufficient permissions' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/modules/auth/routes.ts',
    './src/modules/roles/routes.ts',
    './src/modules/permissions/routes.ts',
    './src/modules/users/routes.ts',
    './src/server.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'arta',
    },
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Add any custom request interceptors here
      return req;
    },
    responseInterceptor: (res: any) => {
      // Add any custom response interceptors here
      return res;
    },
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1f2937 }
  `,
  customSiteTitle: 'FINQZ PRO API Documentation',
  customfavIcon: '/favicon.ico',
};

export const setupSwagger = (app: any) => {
  // Swagger UI route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Swagger JSON route
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
