import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PARTNER_ACQUISITION_HTTP_ROUTE_INVENTORY,
} from '../../../modules/partner-acquisition/http/contracts/partner-acquisition.http.contract.js';
import {
  partnerAcquisitionActionParamsSchema,
  partnerAcquisitionConversionApproveBodySchema,
  partnerAcquisitionConversionDecisionDtoSchema,
  partnerAcquisitionConversionResponseDtoSchema,
  partnerAcquisitionConvertBodySchema,
  partnerAcquisitionDocumentationReceivedBodySchema,
  partnerAcquisitionDocumentationRequestBodySchema,
  partnerAcquisitionErrorSchema,
  partnerAcquisitionHttpHeadersSchema,
  partnerAcquisitionHttpMutatingHeadersSchema,
  partnerAcquisitionLeadCreateBodySchema,
  partnerAcquisitionLeadDtoSchema,
  partnerAcquisitionLeadListQuerySchema,
  partnerAcquisitionLeadIdParamsSchema,
  partnerAcquisitionNegotiationBodySchema,
  partnerAcquisitionProspectCreateBodySchema,
  partnerAcquisitionProspectDtoSchema,
  partnerAcquisitionProspectIdParamsSchema,
  partnerAcquisitionProspectListQuerySchema,
  partnerAcquisitionQualifyBodySchema,
} from '../../../modules/partner-acquisition/http/validators/partner-acquisition.http.validator.js';

const contractPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/http/contracts/partner-acquisition.http.contract.ts',
);

const validatorPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/http/validators/partner-acquisition.http.validator.ts',
);

const contractSource = readFileSync(contractPath, 'utf8');
const validatorSource = readFileSync(validatorPath, 'utf8');

describe('partner-acquisition.http.contract', () => {
  it('defines the complete HTTP route inventory and RBAC matrix', () => {
    expect(PARTNER_ACQUISITION_HTTP_ROUTE_INVENTORY).toHaveLength(16);
    expect(PARTNER_ACQUISITION_HTTP_ROUTE_INVENTORY.map((route) => `${route.method} ${route.path}`)).toEqual([
      'GET /partner-acquisition/leads',
      'GET /partner-acquisition/leads/:leadId',
      'POST /partner-acquisition/leads',
      'GET /partner-acquisition/prospects',
      'GET /partner-acquisition/prospects/:prospectId',
      'POST /partner-acquisition/prospects',
      'POST /partner-acquisition/prospects/:id/qualify',
      'POST /partner-acquisition/prospects/:id/disqualify',
      'POST /partner-acquisition/prospects/:id/negotiation',
      'POST /partner-acquisition/prospects/:id/documentation/request',
      'POST /partner-acquisition/prospects/:id/documentation/received',
      'POST /partner-acquisition/prospects/:id/contract/request',
      'POST /partner-acquisition/prospects/:id/contract/signed',
      'POST /partner-acquisition/prospects/:id/conversion/approve',
      'POST /partner-acquisition/prospects/:id/conversion/reject',
      'POST /partner-acquisition/prospects/:id/convert',
    ]);
    expect(PARTNER_ACQUISITION_HTTP_ROUTE_INVENTORY.map((route) => route.permission)).toEqual([
      'partner_acquisition:read',
      'partner_acquisition:read',
      'partner_acquisition:create',
      'partner_prospect:read',
      'partner_prospect:read',
      'partner_prospect:create',
      'partner_prospect:transition',
      'partner_prospect:transition',
      'partner_prospect:transition',
      'partner_prospect:transition',
      'partner_prospect:transition',
      'partner_prospect:transition',
      'partner_prospect:transition',
      'partner_acquisition:approve',
      'partner_acquisition:approve',
      'partner_prospect:convert',
    ]);
  });

  it('validates required headers for read and mutating requests', () => {
    expect(
      partnerAcquisitionHttpHeadersSchema.parse({
        tenantId: '11111111-1111-1111-1111-111111111111',
        requestId: 'req-1',
        correlationId: 'corr-1',
        actorUserId: '22222222-2222-2222-2222-222222222222',
      }),
    ).toMatchObject({
      tenantId: '11111111-1111-1111-1111-111111111111',
      requestId: 'req-1',
    });

    expect(() =>
      partnerAcquisitionHttpMutatingHeadersSchema.parse({
        tenantId: '11111111-1111-1111-1111-111111111111',
        requestId: 'req-1',
        correlationId: 'corr-1',
        actorUserId: '22222222-2222-2222-2222-222222222222',
      }),
    ).toThrow();

    expect(
      partnerAcquisitionHttpMutatingHeadersSchema.parse({
        tenantId: '11111111-1111-1111-1111-111111111111',
        requestId: 'req-1',
        correlationId: 'corr-1',
        actorUserId: '22222222-2222-2222-2222-222222222222',
        idempotencyKey: 'idem-1',
      }),
    ).toMatchObject({
      idempotencyKey: 'idem-1',
    });
  });

  it('validates list queries, params and mutation bodies', () => {
    expect(
      partnerAcquisitionLeadListQuerySchema.parse({
        page: '1',
        limit: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: 'parceiro',
        source: 'CAMPAIGN',
      }),
    ).toMatchObject({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
    });

    expect(
      partnerAcquisitionProspectListQuerySchema.parse({
        page: '1',
        limit: '20',
        sortBy: 'updatedAt',
        sortOrder: 'asc',
        status: 'QUALIFIED',
        source: 'SDR_IA',
        pipelineCode: 'parceiros_comerciais',
        stageCode: 'documentacao',
      }),
    ).toMatchObject({
      status: 'QUALIFIED',
      sortOrder: 'asc',
    });

    expect(partnerAcquisitionLeadIdParamsSchema.parse({ leadId: '11111111-1111-1111-1111-111111111111' })).toMatchObject({
      leadId: '11111111-1111-1111-1111-111111111111',
    });
    expect(partnerAcquisitionProspectIdParamsSchema.parse({ prospectId: '11111111-1111-1111-1111-111111111111' })).toMatchObject({
      prospectId: '11111111-1111-1111-1111-111111111111',
    });
    expect(partnerAcquisitionActionParamsSchema.parse({ id: '11111111-1111-1111-1111-111111111111' })).toMatchObject({
      id: '11111111-1111-1111-1111-111111111111',
    });

    expect(
      partnerAcquisitionLeadCreateBodySchema.parse({
        leadCode: 'lead-001',
        fullName: 'Parceiro Exemplo',
        source: 'CAMPAIGN',
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
        email: 'parceiro@example.com',
      }),
    ).toMatchObject({
      leadCode: 'lead-001',
      sourceName: 'H16T Smoke',
      sourceReference: 'h16t-smoke',
    });

    expect(
      partnerAcquisitionProspectCreateBodySchema.parse({
        prospectCode: 'prospect-001',
        leadId: '11111111-1111-1111-1111-111111111111',
        fullName: 'Parceiro Exemplo',
        source: 'SDR_IA',
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
        status: 'NEW',
      }),
    ).toMatchObject({
      prospectCode: 'prospect-001',
      sourceName: 'H16T Smoke',
      sourceReference: 'h16t-smoke',
    });

    expect(partnerAcquisitionQualifyBodySchema.parse({ expectedVersion: 1, score: 90 })).toMatchObject({ expectedVersion: 1 });
    expect(partnerAcquisitionDocumentationRequestBodySchema.parse({ expectedVersion: 1, requestedDocuments: ['CNPJ'] })).toMatchObject({ expectedVersion: 1 });
    expect(partnerAcquisitionDocumentationReceivedBodySchema.parse({ expectedVersion: 1, receivedDocuments: ['CNPJ'] })).toMatchObject({ expectedVersion: 1 });
    expect(partnerAcquisitionNegotiationBodySchema.parse({ expectedVersion: 1 })).toMatchObject({ expectedVersion: 1 });
    expect(partnerAcquisitionConversionApproveBodySchema.parse({ expectedVersion: 1 })).toMatchObject({ expectedVersion: 1 });
    expect(partnerAcquisitionConvertBodySchema.parse({
      expectedVersion: 1,
      partnerId: '11111111-1111-1111-1111-111111111111',
      partnerCode: 'P-001',
      partnerName: 'Parceiro Exemplo LTDA',
      partnerType: 'COMPANY',
    })).toMatchObject({ partnerCode: 'P-001' });
  });

  it('validates response DTOs and error envelopes', () => {
    expect(
      partnerAcquisitionLeadDtoSchema.parse({
        tenantId: '11111111-1111-1111-1111-111111111111',
        leadId: '22222222-2222-2222-2222-222222222222',
        leadCode: 'lead-001',
        fullName: 'Parceiro Exemplo',
        source: 'CAMPAIGN',
        status: 'QUALIFIED',
        createdAt: '2026-06-25T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      }),
    ).toMatchObject({ leadId: '22222222-2222-2222-2222-222222222222' });

    expect(
      partnerAcquisitionProspectDtoSchema.parse({
        tenantId: '11111111-1111-1111-1111-111111111111',
        prospectId: '22222222-2222-2222-2222-222222222222',
        prospectCode: 'prospect-001',
        leadId: '33333333-3333-3333-3333-333333333333',
        fullName: 'Parceiro Exemplo',
        source: 'SDR_IA',
        status: 'SIGNED',
        createdAt: '2026-06-25T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      }),
    ).toMatchObject({ prospectCode: 'prospect-001' });

    expect(
      partnerAcquisitionConversionDecisionDtoSchema.parse({
        tenantId: '11111111-1111-1111-1111-111111111111',
        prospectId: '22222222-2222-2222-2222-222222222222',
        approved: false,
        decidedByUserId: '44444444-4444-4444-4444-444444444444',
        decidedAt: '2026-06-25T00:00:00.000Z',
      }),
    ).toMatchObject({
      approved: false,
    });

    expect(
      partnerAcquisitionConversionResponseDtoSchema.parse({
        prospect: {
          tenantId: '11111111-1111-1111-1111-111111111111',
          prospectId: '22222222-2222-2222-2222-222222222222',
          prospectCode: 'prospect-001',
          leadId: '33333333-3333-3333-3333-333333333333',
          fullName: 'Parceiro Exemplo',
          source: 'SDR_IA',
          status: 'CONVERTED',
          createdAt: '2026-06-25T00:00:00.000Z',
          updatedAt: '2026-06-25T00:00:00.000Z',
        },
        conversionDecision: {
          tenantId: '11111111-1111-1111-1111-111111111111',
          prospectId: '22222222-2222-2222-2222-222222222222',
          approved: true,
          decidedByUserId: '44444444-4444-4444-4444-444444444444',
          decidedAt: '2026-06-25T00:00:00.000Z',
        },
      }),
    ).toMatchObject({
      conversionDecision: {
        approved: true,
      },
    });

    expect(
      partnerAcquisitionErrorSchema.parse({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation error',
        },
      }),
    ).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it('keeps the HTTP surface free from runtime coupling and Opportunity references', () => {
    expect(contractSource).not.toMatch(/from ['"]fastify['"]/i);
    expect(contractSource).not.toMatch(/\bFastify(Request|Reply|Instance|Plugin)?\b/);
    expect(contractSource).not.toMatch(/from ['"][^'"]*prisma[^'"]*['"]/i);
    expect(contractSource).not.toMatch(/from ['"][^'"]*opportunit(y|ies)[^'"]*['"]/i);
    expect(validatorSource).not.toMatch(/from ['"]fastify['"]/i);
    expect(validatorSource).not.toMatch(/\bFastify(Request|Reply|Instance|Plugin)?\b/);
    expect(validatorSource).not.toMatch(/from ['"][^'"]*prisma[^'"]*['"]/i);
    expect(validatorSource).not.toMatch(/from ['"][^'"]*opportunit(y|ies)[^'"]*['"]/i);
  });
});
