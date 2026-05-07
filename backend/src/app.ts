// ============================================
// FINQZ PRO - Express Application Setup
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/app';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestLogger } from './shared/logger';
import { testDatabaseConnection } from './database/prisma';
import { setupSwagger } from './config/swagger';

// Import routes (will be created later)
import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import crmRoutes from './modules/crm/routes';
import partnerRoutes from './modules/partners/routes';
import proposalRoutes from './modules/proposals/routes';
import commissionRoutes from './modules/commissions/routes';
import financialRoutes from './modules/financial/routes';
import analyticsRoutes from './modules/analytics/routes';
import bankingRoutes from './modules/banking/routes';

// Create Express application
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

// Parse JSON bodies
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// Parse URL-encoded bodies
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// ============================================
// LOGGING MIDDLEWARE
// ============================================

// Request logging
app.use(requestLogger);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', async (req, res) => {
  const dbStatus = await testDatabaseConnection();

  res.json({
    success: true,
    message: 'FINQZ PRO API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0',
    services: {
      database: dbStatus ? 'healthy' : 'unhealthy',
    },
  });
});

// ============================================
// API ROUTES
// ============================================

// API versioning
const API_PREFIX = '/api/v1';

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/crm`, crmRoutes);
app.use(`${API_PREFIX}/partners`, partnerRoutes);
app.use(`${API_PREFIX}/proposals`, proposalRoutes);
app.use(`${API_PREFIX}/commissions`, commissionRoutes);
app.use(`${API_PREFIX}/financial`, financialRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/banking`, bankingRoutes);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler
// ============================================
// DEVELOPMENT HELPERS & API DOCUMENTATION
// ============================================

if (config.nodeEnv === 'development') {
  console.log('🔧 Setting up Swagger API documentation...');
  setupSwagger(app);
  console.log('✅ Swagger API documentation setup complete');
}

app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;