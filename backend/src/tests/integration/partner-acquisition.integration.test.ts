import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { prisma } from '../../core/prisma/client.js';
import { hashPassword } from '../../utils/password.js';
import { generateAccessToken } from '../../utils/jwt.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TEST_PERMISSIONS = [
  'partner_acquisition:create',
  'partner_acquisition:read',
  'partner_acquisition:transition',
  'partner_acquisition:promote',
  'partner_prospect:create',
  'partner_prospect:read',
] as const;

type ActorContext = {
  tenant: Awaited<ReturnType<typeof createTenant>>;
  role: {
    id: string;
    slug: string;
  };
  user: {
    id: string;
  };
};

const buildAuthHeaders = (
  actor: ActorContext,
  permissions = TEST_PERMISSIONS,
) => ({
  authorization: `Bearer ${generateAccessToken({
    userId: actor.user.id,
    tenantId: actor.tenant.id,
    roleId: actor.role.id,
    role: actor.role.slug,
    email: 'integration.partner@finqz.com.br',
    permissions: [...permissions],
  })}`,
});

const createTenant = (name: string) =>
  prisma.tenant.create({
    data: {
      id: randomUUID(),
      name,
      domain: null,
    },
  });

const createActorContext = async (name: string): Promise<ActorContext> => {
  const tenant = await createTenant(name);
  const role = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Admin Sistema',
      slug: 'ROLE_ADMIN_SISTEMA',
      type: 'SYSTEM',
    },
  });
  const password = await hashPassword('StrongPass123!');
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: `integration.${name}@finqz.com.br`,
      emailNormalized: `integration.${name}@finqz.com.br`,
      password,
      firstName: 'Integration',
      lastName: 'User',
      isActive: true,
      userRoles: {
        create: {
          tenant: {
            connect: {
              id: tenant.id,
            },
          },
          role: {
            connect: {
              id: role.id,
            },
          },
        },
      },
    },
  });

  return {
    tenant,
    role: {
      id: role.id,
      slug: role.slug,
    },
    user: {
      id: user.id,
    },
  };
};

const deleteTenants = async (...tenantIds: string[]) => {
  if (tenantIds.length === 0) {
    return;
  }

  await prisma.tenant.deleteMany({
    where: {
      id: {
        in: tenantIds,
      },
    },
  });
};

const createLeadViaHttp = async (
  server: FastifyInstance,
  actor: ActorContext,
  leadCode: string,
) => {
  const response = await server.inject({
    method: 'POST',
    url: '/api/v1/partner-acquisition/leads',
    headers: {
      ...buildAuthHeaders(actor),
      'idempotency-key': randomUUID(),
    },
    payload: {
      leadCode,
      fullName: `Lead ${leadCode}`,
      source: 'CAMPAIGN',
    },
  });

  return response;
};

const createProspectViaHttp = async (
  server: FastifyInstance,
  actor: ActorContext,
  prospectCode: string,
  leadId: string,
) => {
  const response = await server.inject({
    method: 'POST',
    url: '/api/v1/partner-acquisition/prospects',
    headers: {
      ...buildAuthHeaders(actor),
      'idempotency-key': randomUUID(),
    },
    payload: {
      prospectCode,
      leadId,
      fullName: `Prospect ${prospectCode}`,
      source: 'CAMPAIGN',
    },
  });

  return response;
};

const promoteLeadViaHttp = async (
  server: FastifyInstance,
  actor: ActorContext,
  leadId: string,
) => {
  const response = await server.inject({
    method: 'POST',
    url: `/api/v1/partner-acquisition/leads/${leadId}/promote-to-prospect`,
    headers: {
      ...buildAuthHeaders(actor),
      'idempotency-key': randomUUID(),
    },
    payload: {
      source: 'CAMPAIGN',
    },
  });

  return response;
};

const transitionLeadViaHttp = async (
  server: FastifyInstance,
  actor: ActorContext,
  leadId: string,
) => {
  return server.inject({
    method: 'POST',
    url: `/api/v1/partner-acquisition/leads/${leadId}/transition`,
    headers: {
      ...buildAuthHeaders(actor),
      'idempotency-key': randomUUID(),
    },
    payload: {
      nextStatus: 'QUALIFIED',
    },
  });
};

let app: FastifyInstance;

beforeAll(async () => {
  await prisma.$connect();
  app = await createApp();
  await app.ready();
});

afterAll(async () => {
  if (app) {
    await app.close();
  }

  await prisma.$disconnect();
});

describe.sequential('partner-acquisition.integration', () => {
  it('creates a lead with an internal leadId and a public leadCode, then isolates it by tenant', async () => {
    const primaryActor = await createActorContext('g23-1-lead-primary');
    const otherActor = await createActorContext('g23-1-lead-other');
    const leadCode = randomUUID();

    try {
      const response = await createLeadViaHttp(app, primaryActor, leadCode);
      const payload = response.json();

      expect(response.statusCode).toBe(201);
      expect(payload.success).toBe(true);
      expect(payload.data.leadId).toMatch(UUID_PATTERN);
      expect(payload.data.leadCode).toBe(leadCode);
      expect(payload.data.leadId).not.toBe(payload.data.leadCode);

      const leadById = await prisma.partnerAcquisitionLead.findFirst({
        where: {
          tenantId: primaryActor.tenant.id,
          id: payload.data.leadId,
          deletedAt: null,
        },
      });
      const leadByCode = await prisma.partnerAcquisitionLead.findFirst({
        where: {
          tenantId: primaryActor.tenant.id,
          leadCode,
          deletedAt: null,
        },
      });
      const leadLookupResponse = await app.inject({
        method: 'GET',
        url: `/api/v1/partner-acquisition/leads/${payload.data.leadId}`,
        headers: {
          authorization: buildAuthHeaders(primaryActor).authorization,
        },
      });

      expect(leadById).toMatchObject({
        id: payload.data.leadId,
        leadCode,
        tenantId: primaryActor.tenant.id,
      });
      expect(leadByCode).toMatchObject({
        id: payload.data.leadId,
        leadCode,
        tenantId: primaryActor.tenant.id,
      });
      expect(leadLookupResponse.statusCode).toBe(200);
      expect(leadLookupResponse.json().data).toMatchObject({
        leadId: payload.data.leadId,
        leadCode,
        tenantId: primaryActor.tenant.id,
      });

      const crossTenantById = await prisma.partnerAcquisitionLead.findFirst({
        where: {
          tenantId: otherActor.tenant.id,
          id: payload.data.leadId,
          deletedAt: null,
        },
      });
      const crossTenantByCode = await prisma.partnerAcquisitionLead.findFirst({
        where: {
          tenantId: otherActor.tenant.id,
          leadCode,
          deletedAt: null,
        },
      });
      const crossTenantLookupResponse = await app.inject({
        method: 'GET',
        url: `/api/v1/partner-acquisition/leads/${payload.data.leadId}`,
        headers: {
          ...buildAuthHeaders(otherActor),
          'idempotency-key': randomUUID(),
        },
      });

      expect(crossTenantById).toBeNull();
      expect(crossTenantByCode).toBeNull();
      expect(crossTenantLookupResponse.statusCode).toBe(404);
    } finally {
      await deleteTenants(primaryActor.tenant.id, otherActor.tenant.id);
    }
  });

  it('creates a prospect with an internal prospectId and a public prospectCode, then isolates it by tenant', async () => {
    const primaryActor = await createActorContext('g23-1-prospect-primary');
    const otherActor = await createActorContext('g23-1-prospect-other');
    const leadCode = randomUUID();
    const prospectCode = randomUUID();

    try {
      const leadResponse = await createLeadViaHttp(app, primaryActor, leadCode);
      const leadPayload = leadResponse.json();
      const prospectResponse = await createProspectViaHttp(
        app,
        primaryActor,
        prospectCode,
        leadPayload.data.leadId,
      );
      const prospectPayload = prospectResponse.json();

      expect(prospectResponse.statusCode).toBe(201);
      expect(prospectPayload.success).toBe(true);
      expect(prospectPayload.data.prospectId).toMatch(UUID_PATTERN);
      expect(prospectPayload.data.prospectCode).toBe(prospectCode);
      expect(prospectPayload.data.prospectId).not.toBe(prospectPayload.data.prospectCode);

      const prospectById = await prisma.partnerAcquisitionProspect.findFirst({
        where: {
          tenantId: primaryActor.tenant.id,
          id: prospectPayload.data.prospectId,
          deletedAt: null,
        },
      });
      const prospectByCode = await prisma.partnerAcquisitionProspect.findFirst({
        where: {
          tenantId: primaryActor.tenant.id,
          prospectCode,
          deletedAt: null,
        },
      });
      const prospectLookupResponse = await app.inject({
        method: 'GET',
        url: `/api/v1/partner-acquisition/prospects/${prospectPayload.data.prospectId}`,
        headers: {
          authorization: buildAuthHeaders(primaryActor).authorization,
        },
      });

      expect(prospectById).toMatchObject({
        id: prospectPayload.data.prospectId,
        prospectCode,
        tenantId: primaryActor.tenant.id,
        leadId: leadPayload.data.leadId,
      });
      expect(prospectByCode).toMatchObject({
        id: prospectPayload.data.prospectId,
        prospectCode,
        tenantId: primaryActor.tenant.id,
      });
      expect(prospectLookupResponse.statusCode).toBe(200);
      expect(prospectLookupResponse.json().data).toMatchObject({
        prospectId: prospectPayload.data.prospectId,
        prospectCode,
        tenantId: primaryActor.tenant.id,
      });

      const crossTenantById = await prisma.partnerAcquisitionProspect.findFirst({
        where: {
          tenantId: otherActor.tenant.id,
          id: prospectPayload.data.prospectId,
          deletedAt: null,
        },
      });
      const crossTenantByCode = await prisma.partnerAcquisitionProspect.findFirst({
        where: {
          tenantId: otherActor.tenant.id,
          prospectCode,
          deletedAt: null,
        },
      });
      const crossTenantLookupResponse = await app.inject({
        method: 'GET',
        url: `/api/v1/partner-acquisition/prospects/${prospectPayload.data.prospectId}`,
        headers: {
          ...buildAuthHeaders(otherActor),
          'idempotency-key': randomUUID(),
        },
      });

      expect(crossTenantById).toBeNull();
      expect(crossTenantByCode).toBeNull();
      expect(crossTenantLookupResponse.statusCode).toBe(404);
    } finally {
      await deleteTenants(primaryActor.tenant.id, otherActor.tenant.id);
    }
  });

  it('promotes a qualified lead to a prospect using lead.leadCode and keeps the result idempotent', async () => {
    const primaryActor = await createActorContext('g23-1-promotion-primary');
    const otherActor = await createActorContext('g23-1-promotion-other');
    const leadCode = randomUUID();

    try {
      const leadResponse = await createLeadViaHttp(app, primaryActor, leadCode);
      const leadPayload = leadResponse.json();
      await prisma.partnerAcquisitionLead.updateMany({
        where: {
          tenantId: primaryActor.tenant.id,
          id: leadPayload.data.leadId,
          deletedAt: null,
        },
        data: {
          status: 'QUALIFIED',
        },
      });
      const firstPromotionResponse = await promoteLeadViaHttp(
        app,
        primaryActor,
        leadPayload.data.leadId,
      );
      const firstPromotionPayload = firstPromotionResponse.json();
      const persistedProspect = await prisma.partnerAcquisitionProspect.findFirst({
        where: {
          tenantId: primaryActor.tenant.id,
          leadId: leadPayload.data.leadId,
          deletedAt: null,
        },
      });
      const secondPromotionResponse = await promoteLeadViaHttp(
        app,
        primaryActor,
        leadPayload.data.leadId,
      );
      const secondPromotionPayload = secondPromotionResponse.json();
      const prospectCount = await prisma.partnerAcquisitionProspect.count({
        where: {
          tenantId: primaryActor.tenant.id,
          leadId: leadPayload.data.leadId,
          deletedAt: null,
        },
      });
      const crossTenantPromotionResponse = await app.inject({
        method: 'POST',
        url: `/api/v1/partner-acquisition/leads/${leadPayload.data.leadId}/promote-to-prospect`,
        headers: {
          ...buildAuthHeaders(otherActor),
          'idempotency-key': randomUUID(),
        },
        payload: {
          source: 'CAMPAIGN',
        },
      });
      const crossTenantProspectCount = await prisma.partnerAcquisitionProspect.count({
        where: {
          tenantId: otherActor.tenant.id,
          leadId: leadPayload.data.leadId,
          deletedAt: null,
        },
      });
      expect(firstPromotionResponse.statusCode).toBe(201);
      expect(firstPromotionPayload.success).toBe(true);
      expect(firstPromotionPayload.data.leadId).toBe(leadPayload.data.leadId);
      expect(firstPromotionPayload.data.prospectId).toMatch(UUID_PATTERN);
      expect(firstPromotionPayload.data.leadStatus).toBe('QUALIFIED');
      expect(firstPromotionPayload.data.prospectStatus).toBe('NEW');
      expect(firstPromotionPayload.data.prospectId).not.toBe(leadPayload.data.leadId);
      expect(persistedProspect).toMatchObject({
        tenantId: primaryActor.tenant.id,
        leadId: leadPayload.data.leadId,
        prospectCode: leadPayload.data.leadCode,
      });
      expect(secondPromotionResponse.statusCode).toBe(200);
      expect(secondPromotionPayload.data.created).toBe(false);
      expect(secondPromotionPayload.data.replayed).toBe(true);
      expect(secondPromotionPayload.data.prospectId).toBe(
        firstPromotionPayload.data.prospectId,
      );
      expect(prospectCount).toBe(1);
      expect(crossTenantPromotionResponse.statusCode).toBe(404);
      expect(crossTenantProspectCount).toBe(0);
    } finally {
      await deleteTenants(primaryActor.tenant.id, otherActor.tenant.id);
    }
  });
});
