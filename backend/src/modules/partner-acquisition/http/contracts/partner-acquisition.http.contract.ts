import type {
  PartnerAcquisitionActionParams,
  PartnerAcquisitionContractRequestBody,
  PartnerAcquisitionContractSignedBody,
  PartnerAcquisitionConversionApproveBody,
  PartnerAcquisitionConversionRejectBody,
  PartnerAcquisitionConversionResponseDto,
  PartnerAcquisitionConvertBody,
  PartnerAcquisitionDisqualifyBody,
  PartnerAcquisitionDocumentationReceivedBody,
  PartnerAcquisitionDocumentationRequestBody,
  PartnerAcquisitionErrorEnvelope,
  PartnerAcquisitionHttpHeaders,
  PartnerAcquisitionHttpMutatingHeaders,
  PartnerAcquisitionLeadCreateBody,
  PartnerAcquisitionLeadDto,
  PartnerAcquisitionLeadIdParams,
  PartnerAcquisitionLeadListQuery,
  PartnerAcquisitionNegotiationBody,
  PartnerAcquisitionPageMeta,
  PartnerAcquisitionPromoteLeadToProspectBody,
  PartnerAcquisitionPromoteLeadToProspectResponseDto,
  PartnerAcquisitionProspectCreateBody,
  PartnerAcquisitionProspectDto,
  PartnerAcquisitionProspectIdParams,
  PartnerAcquisitionProspectListQuery,
  PartnerAcquisitionQualifyBody,
} from '../validators/partner-acquisition.http.validator.js';

export type PartnerAcquisitionHttpHeadersContract = PartnerAcquisitionHttpHeaders;

export type PartnerAcquisitionHttpMutatingHeadersContract =
  PartnerAcquisitionHttpMutatingHeaders;

export type PartnerAcquisitionHttpErrorContract = PartnerAcquisitionErrorEnvelope['error'];

export type PartnerAcquisitionHttpSuccessEnvelope<T> = {
  success: true;
  data: T;
};

export type PartnerAcquisitionHttpListEnvelope<T> = {
  success: true;
  data: T[];
  meta: PartnerAcquisitionPageMeta;
};

export type PartnerAcquisitionHttpErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OPTIMISTIC_LOCK_ERROR'
  | 'IDEMPOTENCY_CONFLICT'
  | 'DOMAIN_RULE_VIOLATION'
  | 'INTERNAL_ERROR';

export type PartnerAcquisitionHttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 500;

export type PartnerAcquisitionHttpPermissionMap = {
  listLeads: 'partner_acquisition:read';
  getLeadById: 'partner_acquisition:read';
  createLead: 'partner_acquisition:create';
  promoteLeadToProspect: 'partner_acquisition:promote';
  listProspects: 'partner_prospect:read';
  getProspectById: 'partner_prospect:read';
  createProspect: 'partner_prospect:create';
  qualifyProspect: 'partner_prospect:transition';
  disqualifyProspect: 'partner_prospect:transition';
  moveProspectToNegotiation: 'partner_prospect:transition';
  requestProspectDocumentation: 'partner_prospect:transition';
  markProspectDocumentationReceived: 'partner_prospect:transition';
  requestProspectContract: 'partner_prospect:transition';
  markProspectContractSigned: 'partner_prospect:transition';
  approveProspectConversion: 'partner_acquisition:approve';
  rejectProspectConversion: 'partner_acquisition:approve';
  convertProspectToPartner: 'partner_prospect:convert';
};

export type PartnerAcquisitionHttpRouteContract =
  | {
      method: 'GET';
      path: '/partner-acquisition/leads';
      permission: PartnerAcquisitionHttpPermissionMap['listLeads'];
      query?: PartnerAcquisitionLeadListQuery;
      headers?: PartnerAcquisitionHttpHeadersContract;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpListEnvelope<PartnerAcquisitionLeadDto>;
    }
  | {
      method: 'GET';
      path: '/partner-acquisition/leads/:leadId';
      permission: PartnerAcquisitionHttpPermissionMap['getLeadById'];
      params: PartnerAcquisitionLeadIdParams;
      headers?: PartnerAcquisitionHttpHeadersContract;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionLeadDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/leads';
      permission: PartnerAcquisitionHttpPermissionMap['createLead'];
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionLeadCreateBody;
      successStatusCode: 201;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionLeadDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/leads/:leadId/promote-to-prospect';
      permission: PartnerAcquisitionHttpPermissionMap['promoteLeadToProspect'];
      params: PartnerAcquisitionLeadIdParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionPromoteLeadToProspectBody;
      successStatusCode: 201;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionPromoteLeadToProspectResponseDto>;
    }
  | {
      method: 'GET';
      path: '/partner-acquisition/prospects';
      permission: PartnerAcquisitionHttpPermissionMap['listProspects'];
      query?: PartnerAcquisitionProspectListQuery;
      headers?: PartnerAcquisitionHttpHeadersContract;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpListEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'GET';
      path: '/partner-acquisition/prospects/:prospectId';
      permission: PartnerAcquisitionHttpPermissionMap['getProspectById'];
      params: PartnerAcquisitionProspectIdParams;
      headers?: PartnerAcquisitionHttpHeadersContract;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects';
      permission: PartnerAcquisitionHttpPermissionMap['createProspect'];
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionProspectCreateBody;
      successStatusCode: 201;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/qualify';
      permission: PartnerAcquisitionHttpPermissionMap['qualifyProspect'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionQualifyBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/disqualify';
      permission: PartnerAcquisitionHttpPermissionMap['disqualifyProspect'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionDisqualifyBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/negotiation';
      permission: PartnerAcquisitionHttpPermissionMap['moveProspectToNegotiation'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionNegotiationBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/documentation/request';
      permission: PartnerAcquisitionHttpPermissionMap['requestProspectDocumentation'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionDocumentationRequestBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/documentation/received';
      permission: PartnerAcquisitionHttpPermissionMap['markProspectDocumentationReceived'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionDocumentationReceivedBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/contract/request';
      permission: PartnerAcquisitionHttpPermissionMap['requestProspectContract'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionContractRequestBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/contract/signed';
      permission: PartnerAcquisitionHttpPermissionMap['markProspectContractSigned'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionContractSignedBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/conversion/approve';
      permission: PartnerAcquisitionHttpPermissionMap['approveProspectConversion'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionConversionApproveBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/conversion/reject';
      permission: PartnerAcquisitionHttpPermissionMap['rejectProspectConversion'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionConversionRejectBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionProspectDto>;
    }
  | {
      method: 'POST';
      path: '/partner-acquisition/prospects/:id/convert';
      permission: PartnerAcquisitionHttpPermissionMap['convertProspectToPartner'];
      params: PartnerAcquisitionActionParams;
      headers: PartnerAcquisitionHttpMutatingHeadersContract;
      body: PartnerAcquisitionConvertBody;
      successStatusCode: 200;
      errorStatusCodes: readonly PartnerAcquisitionHttpStatusCode[];
      response: PartnerAcquisitionHttpSuccessEnvelope<PartnerAcquisitionConversionResponseDto>;
    };

export type PartnerAcquisitionHttpRouteInventory = ReadonlyArray<
  Pick<PartnerAcquisitionHttpRouteContract, 'method' | 'path' | 'permission'>
>;

export const PARTNER_ACQUISITION_HTTP_ROUTE_INVENTORY = [
  {
    method: 'GET',
    path: '/partner-acquisition/leads',
    permission: 'partner_acquisition:read',
  },
  {
    method: 'GET',
    path: '/partner-acquisition/leads/:leadId',
    permission: 'partner_acquisition:read',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/leads',
    permission: 'partner_acquisition:create',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/leads/:leadId/promote-to-prospect',
    permission: 'partner_acquisition:promote',
  },
  {
    method: 'GET',
    path: '/partner-acquisition/prospects',
    permission: 'partner_prospect:read',
  },
  {
    method: 'GET',
    path: '/partner-acquisition/prospects/:prospectId',
    permission: 'partner_prospect:read',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects',
    permission: 'partner_prospect:create',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/qualify',
    permission: 'partner_prospect:transition',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/disqualify',
    permission: 'partner_prospect:transition',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/negotiation',
    permission: 'partner_prospect:transition',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/documentation/request',
    permission: 'partner_prospect:transition',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/documentation/received',
    permission: 'partner_prospect:transition',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/contract/request',
    permission: 'partner_prospect:transition',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/contract/signed',
    permission: 'partner_prospect:transition',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/conversion/approve',
    permission: 'partner_acquisition:approve',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/conversion/reject',
    permission: 'partner_acquisition:approve',
  },
  {
    method: 'POST',
    path: '/partner-acquisition/prospects/:id/convert',
    permission: 'partner_prospect:convert',
  },
] as const satisfies PartnerAcquisitionHttpRouteInventory;

export type PartnerAcquisitionLeadListRequest = {
  headers?: PartnerAcquisitionHttpHeadersContract;
  query?: PartnerAcquisitionLeadListQuery;
};

export type PartnerAcquisitionLeadReadRequest = {
  headers?: PartnerAcquisitionHttpHeadersContract;
  params: PartnerAcquisitionLeadIdParams;
};

export type PartnerAcquisitionLeadCreateRequest = {
  headers: PartnerAcquisitionHttpMutatingHeadersContract;
  body: PartnerAcquisitionLeadCreateBody;
};

export type PartnerAcquisitionProspectListRequest = {
  headers?: PartnerAcquisitionHttpHeadersContract;
  query?: PartnerAcquisitionProspectListQuery;
};

export type PartnerAcquisitionProspectReadRequest = {
  headers?: PartnerAcquisitionHttpHeadersContract;
  params: PartnerAcquisitionProspectIdParams;
};

export type PartnerAcquisitionProspectCreateRequest = {
  headers: PartnerAcquisitionHttpMutatingHeadersContract;
  body: PartnerAcquisitionProspectCreateBody;
};

export type PartnerAcquisitionTransitionRequest<TBody> = {
  headers: PartnerAcquisitionHttpMutatingHeadersContract;
  params: PartnerAcquisitionActionParams;
  body: TBody;
};

export type PartnerAcquisitionConversionRequest = PartnerAcquisitionTransitionRequest<PartnerAcquisitionConvertBody>;

export type PartnerAcquisitionListResponse = PartnerAcquisitionHttpListEnvelope<
  PartnerAcquisitionLeadDto | PartnerAcquisitionProspectDto
>;

export type PartnerAcquisitionSwaggerExposure = {
  futureTag: 'Partner Acquisition';
  routes: PartnerAcquisitionHttpRouteInventory;
  exposed: false;
  notes: string;
};

export type PartnerAcquisitionHttpContractAudit = {
  basePath: '/partner-acquisition';
  version: 'v1';
  noRuntimeRegistration: true;
  noFastifyCoupling: true;
  noRepositoryCoupling: true;
  noPrismaCoupling: true;
  noOpportunityCoupling: true;
  noPartnerCoupling: true;
  noPipelineOwnership: true;
};
