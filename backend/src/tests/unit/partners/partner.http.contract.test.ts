import { describe, expect, it } from 'vitest';

import {
  PARTNER_HTTP_ROUTE_INVENTORY,
} from '../../../modules/partners/presentation/http/partner.http.contract.js';
import type { PartnerHttpPermissionMap } from '../../../modules/partners/presentation/http/partner.http.contract.js';
import {
  PartnerCreateBodySchema,
  PartnerIdParamsSchema,
  PartnerListQuerySchema,
  PartnerUpdateBodySchema,
} from '../../../modules/partners/validators/partner.http.schema.js';

describe('partner.http.contract', () => {
  it('permission map contains official Partner actions', () => {
    const permissions: PartnerHttpPermissionMap = {
      readPartner: 'partner:read',
      createPartner: 'partner:create',
      updatePartner: 'partner:update',
      deletePartner: 'partner:delete',
    };

    expect(permissions).toEqual({
      readPartner: 'partner:read',
      createPartner: 'partner:create',
      updatePartner: 'partner:update',
      deletePartner: 'partner:delete',
    });
  });

  it('route inventory has the exact 5 Partner endpoints', () => {
    expect(PARTNER_HTTP_ROUTE_INVENTORY).toHaveLength(5);
    expect(PARTNER_HTTP_ROUTE_INVENTORY.map((route) => route.method)).toEqual([
      'GET',
      'GET',
      'POST',
      'PUT',
      'DELETE',
    ]);
    expect(PARTNER_HTTP_ROUTE_INVENTORY.map((route) => route.path)).toEqual([
      '/partners',
      '/partners/:id',
      '/partners',
      '/partners/:id',
      '/partners/:id',
    ]);
    expect(PARTNER_HTTP_ROUTE_INVENTORY.map((route) => route.permission)).toEqual([
      'partner:read',
      'partner:read',
      'partner:create',
      'partner:update',
      'partner:delete',
    ]);
  });

  it('PartnerListQuerySchema accepts canonical pagination and filters', () => {
    const result = PartnerListQuerySchema.parse({
      page: '2',
      limit: '25',
      status: 'ativo',
      parentId: '11111111-1111-1111-1111-111111111111',
      search: ' Parceiro ',
    });

    expect(result).toEqual({
      page: 2,
      limit: 25,
      status: 'ativo',
      parentId: '11111111-1111-1111-1111-111111111111',
      search: 'Parceiro',
    });
  });

  it('PartnerIdParamsSchema rejects invalid uuid', () => {
    expect(() =>
      PartnerIdParamsSchema.parse({
        id: 'invalid',
      }),
    ).toThrow();
  });

  it('PartnerCreateBodySchema rejects missing required fields', () => {
    expect(() => PartnerCreateBodySchema.parse({})).toThrow();
  });

  it('PartnerUpdateBodySchema requires at least one field', () => {
    expect(() => PartnerUpdateBodySchema.parse({})).toThrow();
  });
});
