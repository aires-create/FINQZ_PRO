import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

type PartnerAcquisitionPermissions =
  | 'partner_acquisition:create'
  | 'partner_acquisition:read'
  | 'partner_acquisition:transition'
  | 'partner_acquisition:promote'
  | 'partner_acquisition:approve'
  | 'partner_prospect:create'
  | 'partner_prospect:read'
  | 'partner_prospect:transition'
  | 'partner_prospect:convert';

const fullPermissions: PartnerAcquisitionPermissions[] = [
  'partner_acquisition:create',
  'partner_acquisition:read',
  'partner_acquisition:transition',
  'partner_acquisition:promote',
  'partner_acquisition:approve',
  'partner_prospect:create',
  'partner_prospect:read',
  'partner_prospect:transition',
  'partner_prospect:convert',
];

let app: FastifyInstance | undefined;
let prisma: typeof import('../../database/prisma.js').prisma;
let createApp: typeof import('../../app.js').createApp;
let generateAccessToken: typeof import('../../utils/jwt.js').generateAccessToken;

const disposableDatabaseUrl =
  'postgresql://finqz_g17_2_user:finqz_g17_2_pass@127.0.0.1:55433/finqz_g17_2_db?schema=public';

const buildToken = (
  tenantId: string,
  userId: string,
  permissions: PartnerAcquisitionPermissions[],
) =>
  generateAccessToken({
    tenantId,
    userId,
    roleId: randomUUID(),
    role: 'TESTER',
    email: `tester-${tenantId}@finqz.test`,
    permissions,
  });

const buildHeaders = (token: string, requestId: string, idempotencyKey?: string) => ({
  authorization: `Bearer ${token}`,
  'x-request-id': requestId,
  ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
});

const createTenant = async (name: string) =>
  prisma.tenant.create({
    data: {
      name,
      domain: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.finqz.test`,
    },
  });

const getLeadById = async (tenantId: string, leadId: string) =>
  prisma.partnerAcquisitionLead.findFirst({
    where: {
      tenantId,
      id: leadId,
    },
  });

const getProspectById = async (tenantId: string, prospectId: string) =>
  prisma.partnerAcquisitionProspect.findFirst({
    where: {
      tenantId,
      id: prospectId,
    },
  });

beforeAll(async () => {
  vi.resetModules();
  vi.stubEnv('DATABASE_URL', disposableDatabaseUrl);
  vi.stubEnv('DIRECT_URL', disposableDatabaseUrl);
  vi.stubEnv('REDIS_URL', 'redis://127.0.0.1:6379');
  const appModule = await import('../../app.js');
  const prismaModule = await import('../../database/prisma.js');
  const jwtModule = await import('../../utils/jwt.js');

  createApp = appModule.createApp;
  prisma = prismaModule.prisma;
  generateAccessToken = jwtModule.generateAccessToken;

  await prisma.$connect();
  app = await createApp();
  await app.ready();
});

afterAll(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }

  await prisma.$disconnect();
});

describe('partner-acquisition integration', () => {
  it('persists audit trail, outbox and idempotent conversion to partner in a real PostgreSQL flow', async () => {
    if (!app) {
      throw new Error('Application not initialized');
    }

    const tenant = await createTenant(`Tenant-${randomUUID()}`);
    const actorUserId = randomUUID();
    const token = buildToken(tenant.id, actorUserId, fullPermissions);

    const leadCode = `lead-${randomUUID()}`;
    const sourceReference = `ref-${randomUUID()}`;
    const leadRequestId = `req-lead-${randomUUID()}`;
    const transitionRequestId = `req-transition-${randomUUID()}`;
    const promoteRequestId = `req-promote-${randomUUID()}`;
    const approveRequestId = `req-approve-${randomUUID()}`;
    const convertRequestId = `req-convert-${randomUUID()}`;

    const createLeadResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/partner-acquisition/leads',
      headers: buildHeaders(token, leadRequestId, `idem-${leadRequestId}`),
      payload: {
        leadCode,
        fullName: 'Parceiro Auditado',
        email: 'auditoria.partner@example.test',
        source: 'CAMPAIGN',
        sourceName: 'Campanha G17.2',
        sourceReference,
      },
    });

    expect(createLeadResponse.statusCode).toBe(201);
    const createdLeadId = createLeadResponse.json().data.leadId as string;
    expect(createdLeadId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const transitionResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${createdLeadId}/transition`,
      headers: buildHeaders(token, transitionRequestId, `idem-${transitionRequestId}`),
      payload: {
        nextStatus: 'QUALIFIED',
      },
    });

    expect(transitionResponse.statusCode).toBe(200);

    const promoteResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${createdLeadId}/promote-to-prospect`,
      headers: buildHeaders(token, promoteRequestId, `idem-${promoteRequestId}`),
      payload: {
        source: 'MANUAL',
      },
    });

    expect(promoteResponse.statusCode).toBe(201);
    const createdProspectId = promoteResponse.json().data.prospectId as string;

    const prospectBeforeApproval = await getProspectById(tenant.id, createdProspectId);
    expect(prospectBeforeApproval).not.toBeNull();
    expect(prospectBeforeApproval?.status).toBe('NEW');

    const approveResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/prospects/${createdProspectId}/conversion/approve`,
      headers: buildHeaders(token, approveRequestId, `idem-${approveRequestId}`),
      payload: {
        expectedVersion: prospectBeforeApproval?.version ?? 0,
        approvalNotes: 'Aprovado no G17.2',
      },
    });

    expect(approveResponse.statusCode).toBe(200);

    const prospectAfterApproval = await getProspectById(tenant.id, createdProspectId);
    expect(prospectAfterApproval).not.toBeNull();
    expect(prospectAfterApproval?.status).toBe('CONVERSION_PENDING');
    expect(prospectAfterApproval?.version).toBe((prospectBeforeApproval?.version ?? 0) + 1);

    const partnerCode = `partner-${randomUUID().replace(/-/g, '')}`;
    const convertBody = {
      expectedVersion: prospectAfterApproval?.version ?? 0,
      partnerId: randomUUID(),
      partnerCode,
      partnerName: 'Parceiro Auditado LTDA',
      partnerType: 'COMPANY' as const,
    };

    const convertResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/prospects/${createdProspectId}/convert`,
      headers: buildHeaders(token, convertRequestId, `idem-${convertRequestId}`),
      payload: convertBody,
    });

    expect(convertResponse.statusCode).toBe(200);
    const convertPayload = convertResponse.json().data;
    expect(convertPayload.conversionDecision.approved).toBe(true);
    expect(convertPayload.prospect.status).toBe('CONVERTED');
    const convertedPartnerId = convertPayload.conversionDecision.partnerId as string;
    expect(convertedPartnerId).toBeDefined();

    const replayConvertResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/prospects/${createdProspectId}/convert`,
      headers: buildHeaders(token, convertRequestId, `idem-${convertRequestId}`),
      payload: convertBody,
    });

    expect(replayConvertResponse.statusCode).toBe(200);
    expect(replayConvertResponse.json().data).toMatchObject({
      prospect: {
        prospectId: createdProspectId,
        status: 'CONVERTED',
      },
      conversionDecision: {
        prospectId: createdProspectId,
        partnerId: convertedPartnerId,
        approved: true,
      },
    });

    const persistedLead = await getLeadById(tenant.id, createdLeadId);
    expect(persistedLead?.status).toBe('QUALIFIED');

    const persistedProspect = await getProspectById(tenant.id, createdProspectId);
    expect(persistedProspect?.status).toBe('CONVERTED');
    expect(persistedProspect?.partnerId).toBe(convertedPartnerId);

    const partner = await prisma.partner.findFirst({
      where: {
        tenantId: tenant.id,
        code: partnerCode,
      },
    });

    expect(partner).not.toBeNull();
    expect(partner?.id).toBe(convertedPartnerId);
    expect(partner?.name).toBe('Parceiro Auditado LTDA');

    const events = await prisma.partnerAcquisitionEvent.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(events).toHaveLength(4);
    expect(events.map((event) => event.eventType)).toEqual([
      'PartnerLeadCreated',
      'PartnerLeadStatusChanged',
      'PartnerProspectConversionApproved',
      'PartnerProspectConvertedToPartner',
    ]);
    expect(events.every((event) => event.tenantId === tenant.id)).toBe(true);
    expect(events.every((event) => event.actorUserId === actorUserId)).toBe(true);
    expect(events.every((event) => event.requestId && event.correlationId && event.idempotencyKey)).toBe(true);
    expect(events.every((event) => event.occurredAt instanceof Date)).toBe(true);

    const outboxRows = await prisma.partnerAcquisitionOutbox.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(outboxRows).toHaveLength(4);
    expect(outboxRows.map((row) => row.eventId)).toEqual(events.map((event) => event.eventId));

    const inboxRows = await prisma.partnerAcquisitionCommandInbox.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(inboxRows).toHaveLength(5);
    expect(inboxRows.every((row) => row.status === 'PROCESSED')).toBe(true);

    const conversionDecisions = await prisma.partnerAcquisitionConversionDecision.findMany({
      where: {
        tenantId: tenant.id,
      },
    });

    expect(conversionDecisions).toHaveLength(1);
    expect(conversionDecisions[0]).toMatchObject({
      tenantId: tenant.id,
      prospectId: createdProspectId,
      partnerId: convertedPartnerId,
      approved: true,
      decidedByUserId: actorUserId,
    });
  });

  it('isolates two tenants and blocks cross-tenant lookups, list leakage and manual-id bypass', async () => {
    if (!app) {
      throw new Error('Application not initialized');
    }

    const tenantA = await createTenant(`Tenant-A-${randomUUID()}`);
    const tenantB = await createTenant(`Tenant-B-${randomUUID()}`);

    const userA = randomUUID();
    const userB = randomUUID();
    const tokenA = buildToken(tenantA.id, userA, [
      'partner_acquisition:create',
      'partner_acquisition:read',
      'partner_acquisition:transition',
      'partner_acquisition:promote',
      'partner_prospect:read',
      'partner_prospect:convert',
    ]);
    const tokenB = buildToken(tenantB.id, userB, [
      'partner_acquisition:create',
      'partner_acquisition:read',
      'partner_acquisition:transition',
      'partner_acquisition:promote',
      'partner_prospect:read',
      'partner_prospect:convert',
    ]);

    const leadAResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/partner-acquisition/leads',
      headers: buildHeaders(tokenA, `req-a-${randomUUID()}`, `idem-a-${randomUUID()}`),
      payload: {
        leadCode: `tenant-a-${randomUUID()}`,
        fullName: 'Parceiro Tenant A',
        source: 'MANUAL',
      },
    });
    expect(leadAResponse.statusCode).toBe(201);
    const leadAId = leadAResponse.json().data.leadId as string;

    const leadBResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/partner-acquisition/leads',
      headers: buildHeaders(tokenB, `req-b-${randomUUID()}`, `idem-b-${randomUUID()}`),
      payload: {
        leadCode: `tenant-b-${randomUUID()}`,
        fullName: 'Parceiro Tenant B',
        source: 'MANUAL',
      },
    });
    expect(leadBResponse.statusCode).toBe(201);
    const leadBId = leadBResponse.json().data.leadId as string;

    const listAResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/partner-acquisition/leads',
      headers: buildHeaders(tokenA, `req-list-a-${randomUUID()}`),
    });
    expect(listAResponse.statusCode).toBe(200);
    expect(listAResponse.json().data.map((item: { leadId: string }) => item.leadId)).toContain(leadAId);
    expect(listAResponse.json().data.map((item: { leadId: string }) => item.leadId)).not.toContain(leadBId);

    const listBResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/partner-acquisition/leads',
      headers: buildHeaders(tokenB, `req-list-b-${randomUUID()}`),
    });
    expect(listBResponse.statusCode).toBe(200);
    expect(listBResponse.json().data.map((item: { leadId: string }) => item.leadId)).toContain(leadBId);
    expect(listBResponse.json().data.map((item: { leadId: string }) => item.leadId)).not.toContain(leadAId);

    const leadAFromTenantB = await app.inject({
      method: 'GET',
      url: `/api/v1/partner-acquisition/leads/${leadAId}`,
      headers: buildHeaders(tokenB, `req-cross-a-${randomUUID()}`),
    });
    expect(leadAFromTenantB.statusCode).toBe(404);

    const leadBFromTenantA = await app.inject({
      method: 'GET',
      url: `/api/v1/partner-acquisition/leads/${leadBId}`,
      headers: buildHeaders(tokenA, `req-cross-b-${randomUUID()}`),
    });
    expect(leadBFromTenantA.statusCode).toBe(404);

    const promoteLeadAFromTenantB = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadAId}/promote-to-prospect`,
      headers: buildHeaders(tokenB, `req-cross-promote-${randomUUID()}`, `idem-cross-promote-${randomUUID()}`),
      payload: {
        source: 'MANUAL',
      },
    });
    expect(promoteLeadAFromTenantB.statusCode).toBe(404);

    const promoteLeadBFromTenantA = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadBId}/promote-to-prospect`,
      headers: buildHeaders(tokenA, `req-cross-promote-2-${randomUUID()}`, `idem-cross-promote-2-${randomUUID()}`),
      payload: {
        source: 'MANUAL',
      },
    });
    expect(promoteLeadBFromTenantA.statusCode).toBe(404);

    const leadARecord = await getLeadById(tenantA.id, leadAId);
    const leadBRecord = await getLeadById(tenantB.id, leadBId);
    expect(leadARecord?.tenantId).toBe(tenantA.id);
    expect(leadBRecord?.tenantId).toBe(tenantB.id);
    expect(await getLeadById(tenantA.id, leadBId)).toBeNull();
    expect(await getLeadById(tenantB.id, leadAId)).toBeNull();
  });
});
