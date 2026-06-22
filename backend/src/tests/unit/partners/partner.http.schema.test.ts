import { describe, expect, it } from 'vitest';

import {
  createPartnerRouteSchema,
  deletePartnerRouteSchema,
  getPartnerRouteSchema,
  listPartnersRouteSchema,
  updatePartnerRouteSchema,
  PartnerCreateBodySchema,
  PartnerIdParamsSchema,
  PartnerListQuerySchema,
  PartnerUpdateBodySchema,
} from '../../../modules/partners/validators/partner.http.schema.js';

describe('partner.http.schema', () => {
  it('list schema exposes Partners tag and bearer auth', () => {
    expect(listPartnersRouteSchema.tags).toEqual(['Partners']);
    expect(listPartnersRouteSchema.security).toEqual([{ bearerAuth: [] }]);
  });

  it('route schemas expose the expected parameter shapes', () => {
    expect(getPartnerRouteSchema.params).toBeDefined();
    expect(updatePartnerRouteSchema.params).toBeDefined();
    expect(deletePartnerRouteSchema.params).toBeDefined();
  });

  it('PartnerIdParamsSchema accepts valid uuid and rejects invalid uuid', () => {
    expect(
      PartnerIdParamsSchema.parse({
        id: '11111111-1111-1111-1111-111111111111',
      }),
    ).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
    });

    expect(() =>
      PartnerIdParamsSchema.parse({
        id: 'invalid',
      }),
    ).toThrow();
  });

  it('PartnerCreateBodySchema rejects empty body and accepts canonical payload', () => {
    expect(() => PartnerCreateBodySchema.parse({})).toThrow();

    expect(
      PartnerCreateBodySchema.parse({
        code: 'P-001',
        name: 'Partner One',
        type: 'COMPANY',
        status: 'ativo',
      }),
    ).toEqual({
      code: 'P-001',
      name: 'Partner One',
      type: 'COMPANY',
      status: 'ativo',
    });
  });

  it('PartnerUpdateBodySchema requires at least one field', () => {
    expect(() => PartnerUpdateBodySchema.parse({})).toThrow();
  });

  it('PartnerListQuerySchema validates page, limit and search', () => {
    expect(
      PartnerListQuerySchema.parse({
        page: '3',
        limit: '15',
        search: ' Acme ',
      }),
    ).toEqual({
      page: 3,
      limit: 15,
      search: 'Acme',
    });
  });

  it('create/update/delete schemas expose Partners tag', () => {
    expect(createPartnerRouteSchema.tags).toEqual(['Partners']);
    expect(updatePartnerRouteSchema.tags).toEqual(['Partners']);
    expect(deletePartnerRouteSchema.tags).toEqual(['Partners']);
  });
});

