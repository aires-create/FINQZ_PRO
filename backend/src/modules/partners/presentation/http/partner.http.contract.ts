import type { Partner } from '@prisma/client';

import type {
  PartnerCreateBody,
  PartnerIdParams,
  PartnerListQuery,
  PartnerUpdateBody,
} from '../../validators/partner.http.schema.js';

export type PartnerHttpHeadersContract = {
  tenantId?: string;
  requestId?: string | null;
  correlationId?: string | null;
};

export type PartnerHttpErrorContract = {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown> | null;
};

export type PartnerHttpPermissionMap = {
  readPartner: 'partner:read';
  createPartner: 'partner:create';
  updatePartner: 'partner:update';
  deletePartner: 'partner:delete';
};

export type PartnerHttpRouteContract =
  | {
      method: 'GET';
      path: '/partners';
      permission: PartnerHttpPermissionMap['readPartner'];
      query?: PartnerListQuery;
      response: { data: Partner[]; meta: { page: number; limit: number; total: number; totalPages: number } };
      headers?: PartnerHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/partners/:id';
      permission: PartnerHttpPermissionMap['readPartner'];
      params: PartnerIdParams;
      response: Partner;
      headers?: PartnerHttpHeadersContract;
    }
  | {
      method: 'POST';
      path: '/partners';
      permission: PartnerHttpPermissionMap['createPartner'];
      body: PartnerCreateBody;
      response: Partner;
      headers?: PartnerHttpHeadersContract;
    }
  | {
      method: 'PUT';
      path: '/partners/:id';
      permission: PartnerHttpPermissionMap['updatePartner'];
      params: PartnerIdParams;
      body: PartnerUpdateBody;
      response: Partner;
      headers?: PartnerHttpHeadersContract;
    }
  | {
      method: 'DELETE';
      path: '/partners/:id';
      permission: PartnerHttpPermissionMap['deletePartner'];
      params: PartnerIdParams;
      response: { success: true; message: string };
      headers?: PartnerHttpHeadersContract;
    };

export type PartnerHttpRouteInventory = ReadonlyArray<
  Pick<PartnerHttpRouteContract, 'method' | 'path' | 'permission'>
>;

export const PARTNER_HTTP_ROUTE_INVENTORY = [
  {
    method: 'GET',
    path: '/partners',
    permission: 'partner:read',
  },
  {
    method: 'GET',
    path: '/partners/:id',
    permission: 'partner:read',
  },
  {
    method: 'POST',
    path: '/partners',
    permission: 'partner:create',
  },
  {
    method: 'PUT',
    path: '/partners/:id',
    permission: 'partner:update',
  },
  {
    method: 'DELETE',
    path: '/partners/:id',
    permission: 'partner:delete',
  },
] as const satisfies PartnerHttpRouteInventory;

export type PartnerListRequest = {
  headers?: PartnerHttpHeadersContract;
  query?: PartnerListQuery;
};

export type PartnerReadRequest = {
  headers?: PartnerHttpHeadersContract;
  params: PartnerIdParams;
};

export type PartnerCreateRequest = {
  headers?: PartnerHttpHeadersContract;
  body: PartnerCreateBody;
};

export type PartnerUpdateRequest = {
  headers?: PartnerHttpHeadersContract;
  params: PartnerIdParams;
  body: PartnerUpdateBody;
};
