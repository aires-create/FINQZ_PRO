import type {
  CreateOperationBody,
  OperationFinancialSummaryQuery,
  OperationIdParams,
  OperationListQuery,
  OperationStatusTransitionBody,
  OperationTimelineQuery,
} from '../../validators/operation.schema.js';
import type {
  OperationDTO,
  OperationFinancialSummaryDTO,
  OperationSummaryDTO,
  OperationTimelineDTO,
} from '../../dto/operation.dto.js';
import type { OperationStatus } from '../../domain/operation-status.js';

// ARCH-025 to ARCH-026: HTTP contracts only, no routes, controllers, or bootstrap hooks.
export type OperationHttpHeadersContract = {
  tenantId?: string;
  requestId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  actorId?: string | null;
  auditActorId?: string | null;
};

export type OperationHttpErrorContract = {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown> | null;
};

export type OperationHttpPermissionMap = {
  createOperation: string;
  getOperationById: string;
  getOperationByNumber: string;
  listOperations: string;
  listOperationsByOpportunity: string;
  transitionOperationStatus: string;
  getOperationTimeline: string;
  getOperationFinancialSummary: string;
};

export type OperationHttpRouteContract =
  | {
      method: 'POST';
      path: '/operations';
      permission: OperationHttpPermissionMap['createOperation'];
      body: CreateOperationBody;
      response: OperationDTO;
      headers?: OperationHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/operations/:id';
      permission: OperationHttpPermissionMap['getOperationById'];
      params: OperationIdParams;
      response: OperationDTO;
      headers?: OperationHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/operations/by-number/:operationNumber';
      permission: OperationHttpPermissionMap['getOperationByNumber'];
      params: { operationNumber: string; tenantId?: string };
      response: OperationDTO;
      headers?: OperationHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/operations';
      permission: OperationHttpPermissionMap['listOperations'];
      query: OperationListQuery;
      response: { items: OperationSummaryDTO[]; total: number; page: number; limit: number };
      headers?: OperationHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/operations/opportunity/:opportunityId';
      permission: OperationHttpPermissionMap['listOperationsByOpportunity'];
      params: { opportunityId: string; tenantId?: string };
      response: OperationSummaryDTO[];
      headers?: OperationHttpHeadersContract;
    }
  | {
      method: 'PATCH';
      path: '/operations/:id/status';
      permission: OperationHttpPermissionMap['transitionOperationStatus'];
      params: OperationIdParams;
      body: OperationStatusTransitionBody;
      response: OperationDTO;
      headers?: OperationHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/operations/:id/timeline';
      permission: OperationHttpPermissionMap['getOperationTimeline'];
      params: OperationIdParams;
      query: OperationTimelineQuery | OperationFinancialSummaryQuery;
      response: OperationTimelineDTO | OperationFinancialSummaryDTO;
      headers?: OperationHttpHeadersContract;
    };

export type OperationHttpRouteInventory = Array<
  OperationHttpRouteContract & {
    statusTransition?: OperationStatus;
  }
>;

export type OperationHttpCreateRequest = {
  headers?: OperationHttpHeadersContract;
  body: CreateOperationBody;
};

export type OperationHttpReadRequest = {
  headers?: OperationHttpHeadersContract;
  params: OperationIdParams;
};

export type OperationHttpTimelineRequest = {
  headers?: OperationHttpHeadersContract;
  params: OperationIdParams;
  query: OperationTimelineQuery;
};

export type OperationHttpFinancialSummaryRequest = {
  headers?: OperationHttpHeadersContract;
  params: OperationIdParams;
  query: OperationFinancialSummaryQuery;
};
