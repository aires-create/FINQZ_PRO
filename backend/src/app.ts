import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/app';
import { swaggerSpec } from './config/swagger';
import { requestLogger } from './shared/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestContext } from './middlewares/requestContext';

import authRoutes from './modules/auth/routes';
import analyticsRoutes from './modules/analytics/routes';
import bankingRoutes from './modules/banking/routes';
import commissionsRoutes from './modules/commissions/routes';
import crmRoutes from './modules/crm/routes';
import financialRoutes from './modules/financial/routes';
import partnersRoutes from './modules/partners/routes';
import permissionsRoutes from './modules/permissions/routes';
import proposalsRoutes from './modules/proposals/routes';
import rolesRoutes from './modules/roles/routes';
import usersRoutes from './modules/users/routes';
import organizationsRoutes from './modules/organizations/routes';
import membershipsRoutes from './modules/memberships/routes';

const app = express();
const apiPrefix = '/api/v1';

app.use(requestContext);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: config.cors.origin, methods: config.cors.methods, credentials: config.cors.credentials }));
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

if (config.nodeEnv !== 'test') {
  app.use(requestLogger);
}

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

if (config.nodeEnv === 'development') {
  app.use(config.swagger.path, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);
app.use(`${apiPrefix}/banking`, bankingRoutes);
app.use(`${apiPrefix}/commissions`, commissionsRoutes);
app.use(`${apiPrefix}/crm`, crmRoutes);
app.use(`${apiPrefix}/financial`, financialRoutes);
app.use(`${apiPrefix}/partners`, partnersRoutes);
app.use(`${apiPrefix}/permissions`, permissionsRoutes);
app.use(`${apiPrefix}/proposals`, proposalsRoutes);
app.use(`${apiPrefix}/roles`, rolesRoutes);
app.use(`${apiPrefix}/users`, usersRoutes);
app.use(`${apiPrefix}/organizations`, organizationsRoutes);
app.use(`${apiPrefix}/memberships`, membershipsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
