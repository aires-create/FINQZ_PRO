import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { IntegrationsController } from './integrations.controller.js';
import { authenticate, tenantContextMiddleware } from '../../../../core/http/middleware.js';
import { requirePermissions } from '../../../rbac/rbac.guard.js';

const marginInquiryBodySchema = z.object({
  document: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  metadata: z.object({
    convenioCnpj: z.string().trim().min(1),
    enrollmentId: z.string().trim().min(1),
    requestId: z.string().trim().optional(),
  }),
}).refine((body) => Boolean(body.document || body.cpf), {
  message: 'document or cpf is required',
});

const validateBody = (schema: z.ZodTypeAny) => async (request: any, reply: any) => {
  const result = schema.safeParse(request.body);

  if (!result.success) {
    reply.status(400).send({
      success: false,
      error: {
        code: 'INTEGRATION_VALIDATION_ERROR',
        message: 'Invalid margin inquiry payload',
      },
    });
    return;
  }

  request.body = result.data;
};

export const createIntegrationsRoutes = (
  integrationsController: IntegrationsController,
) => {
  return async function integrationsRoutes(app: FastifyInstance): Promise<void> {
    app.get(
      '/providers/capabilities',
      integrationsController.listProviderCapabilities,
    );

    app.get(
      '/providers/:providerKey/test',
      integrationsController.testProviderConnection,
    );

    app.get(
      '/providers/:providerKey/proposals',
      integrationsController.listProviderProposals,
    );

    app.get(
      '/providers/:providerKey/financial-proposals',
      {
        preHandler: [
          authenticate,
          tenantContextMiddleware,
          requirePermissions('tenant:read'),
        ],
      },
      integrationsController.getFinancialProviderProposals,
    );

    app.get(
      '/providers/:providerKey/payload-diagnostics',
      {
        preHandler: [
          authenticate,
          tenantContextMiddleware,
          requirePermissions('tenant:read'),
        ],
      },
      integrationsController.getProviderPayloadDiagnostics,
    );

    app.post(
      '/providers/sos-bolso/margin-inquiry/test',
      {
        preHandler: [
          authenticate,
          tenantContextMiddleware,
          requirePermissions('tenant:read'),
          validateBody(marginInquiryBodySchema),
        ],
      },
      integrationsController.testProviderMarginInquiry,
    );

    app.get(
      '/runtime/summary',
      {
        preHandler: [
          authenticate,
          tenantContextMiddleware,
          requirePermissions('tenant:read'),
        ],
      },
      integrationsController.getProviderRuntimeSummary,
    );

    app.get(
      '/runtime/issues',
      {
        preHandler: [
          authenticate,
          tenantContextMiddleware,
          requirePermissions('tenant:read'),
        ],
      },
      integrationsController.getProviderRuntimeIssues,
    );

    app.get(
      '/runtime/providers/:providerKey',
      {
        preHandler: [
          authenticate,
          tenantContextMiddleware,
          requirePermissions('tenant:read'),
        ],
      },
      integrationsController.getProviderRuntimeDiagnostics,
    );
  };
};

/**
 * @swagger
 * /api/v1/integrations/providers/sos-bolso/margin-inquiry/test:
 *   post:
 *     tags:
 *       - Integrations
 *     summary: Testa operacionalmente a consulta de margem do provider SOS BOLSO
 *     description: Endpoint operacional protegido para validar conectividade e normalização do MarginInquiryProvider sem persistência.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *             properties:
 *               document:
 *                 type: string
 *                 description: CPF do cliente (aceita document ou cpf).
 *                 example: "12345678901"
 *               cpf:
 *                 type: string
 *                 description: Alias de document.
 *                 example: "12345678901"
 *               metadata:
 *                 type: object
 *                 required:
 *                   - convenioCnpj
 *                   - enrollmentId
 *                 properties:
 *                   convenioCnpj:
 *                     type: string
 *                     example: "12345678000190"
 *                   enrollmentId:
 *                     type: string
 *                     example: "98765"
 *                   requestId:
 *                     type: string
 *                     example: "req-123"
 *     responses:
 *       200:
 *         description: Consulta de margem processada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *       400:
 *         description: Payload inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão RBAC
 *       500:
 *         description: Erro interno
 */
