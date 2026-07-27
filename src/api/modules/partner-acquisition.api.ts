import { apiCall, buildQueryString } from './base';

const PARTNER_ACQUISITION_BASE_PATH = '/api/v1/partner-acquisition';

export type PartnerAcquisitionSource = 'MANUAL' | 'HUB' | 'CAMPAIGN' | 'IMPORT' | 'REFERRAL' | 'OTHER';

export type PartnerAcquisitionLeadStatus = 'NEW' | 'ENRICHED' | 'CONTACTED' | 'QUALIFIED' | 'DISCARDED';

export type PartnerProspectStatus =
  | 'NEW'
  | 'ENRICHED'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'NEGOTIATING'
  | 'DOCUMENTATION'
  | 'CONTRACT_PENDING'
  | 'AWAITING_SIGNATURE'
  | 'SIGNED'
  | 'CONVERSION_PENDING'
  | 'CONVERTED'
  | 'LOST'
  | 'ARCHIVED'
  | 'REJECTED';

export interface PartnerAcquisitionMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PartnerAcquisitionLeadRecord {
  tenantId: string;
  leadId: string;
  leadCode: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  document?: string | null;
  source: PartnerAcquisitionSource;
  sourceName?: string | null;
  sourceReference?: string | null;
  campaignId?: string | null;
  hubContextId?: string | null;
  ownerUserId?: string | null;
  status: PartnerAcquisitionLeadStatus;
  score?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerProspectRecord {
  tenantId: string;
  prospectId: string;
  prospectCode: string;
  leadId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  document?: string | null;
  source: PartnerAcquisitionSource;
  sourceName?: string | null;
  sourceReference?: string | null;
  campaignId?: string | null;
  hubContextId?: string | null;
  sdrAgentId?: string | null;
  status: PartnerProspectStatus;
  pipelineId?: string | null;
  stageId?: string | null;
  pipelineCode?: string | null;
  stageCode?: string | null;
  score?: number | null;
  qualificationReason?: string | null;
  assignedUserId?: string | null;
  nextActionAt?: string | null;
  signedAt?: string | null;
  convertedAt?: string | null;
  partnerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListPartnerAcquisitionLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PartnerAcquisitionLeadStatus;
  source?: PartnerAcquisitionSource;
  ownerUserId?: string;
}

export interface ListPartnerProspectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PartnerProspectStatus;
  source?: PartnerAcquisitionSource;
  assignedUserId?: string;
}

export interface ListPartnerAcquisitionLeadsResponse {
  success: boolean;
  data: PartnerAcquisitionLeadRecord[];
  meta?: PartnerAcquisitionMeta;
}

export interface ListPartnerProspectsResponse {
  success: boolean;
  data: PartnerProspectRecord[];
  meta?: PartnerAcquisitionMeta;
}

export interface PartnerAcquisitionLeadResponse {
  success: boolean;
  data: PartnerAcquisitionLeadRecord;
}

export interface PartnerProspectResponse {
  success: boolean;
  data: PartnerProspectRecord;
}

export interface CreatePartnerAcquisitionLeadPayload {
  leadCode?: string;
  fullName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  document?: string;
  source: PartnerAcquisitionSource;
  sourceName?: string;
  sourceReference?: string;
  campaignId?: string;
  hubContextId?: string;
  ownerUserId?: string;
  metadata?: Record<string, unknown>;
  references?: Array<Record<string, unknown>>;
}

export interface TransitionPartnerAcquisitionLeadPayload {
  nextStatus: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED' | 'CONVERTED' | 'ARCHIVED';
  reason?: string;
}

export interface PromotePartnerAcquisitionLeadToProspectPayload {
  source: 'MANUAL';
}

export interface PromotePartnerAcquisitionLeadToProspectResult {
  tenantId: string;
  leadId: string;
  prospectId: string;
  leadStatus: string;
  prospectStatus: string;
  created: boolean;
  replayed: boolean;
}

export interface PromotePartnerAcquisitionLeadToProspectResponse {
  success: boolean;
  data: PromotePartnerAcquisitionLeadToProspectResult;
}

export interface CreatePartnerProspectPayload {
  prospectCode?: string;
  leadId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  document?: string;
  source: PartnerAcquisitionSource;
  sourceName?: string;
  sourceReference?: string;
  campaignId?: string;
  hubContextId?: string;
  sdrAgentId?: string;
  pipelineId?: string;
  stageId?: string;
  pipelineCode?: string;
  stageCode?: string;
  score?: number;
  qualificationReason?: string;
  assignedUserId?: string;
  nextActionAt?: string;
  metadata?: Record<string, unknown>;
  references?: Array<Record<string, unknown>>;
}

const withIdempotencyKey = (idempotencyKey: string): HeadersInit => ({
  'idempotency-key': idempotencyKey,
});

export const partnerAcquisitionApi = {
  async getLeads(params?: ListPartnerAcquisitionLeadsParams): Promise<ListPartnerAcquisitionLeadsResponse> {
    const query = params ? buildQueryString(params as Record<string, unknown>) : '';
    return apiCall<ListPartnerAcquisitionLeadsResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/leads${query}`);
  },

  async getLeadById(leadId: string): Promise<PartnerAcquisitionLeadResponse> {
    return apiCall<PartnerAcquisitionLeadResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/leads/${leadId}`);
  },

  async createLead(
    payload: CreatePartnerAcquisitionLeadPayload,
    idempotencyKey: string,
  ): Promise<PartnerAcquisitionLeadResponse> {
    return apiCall<PartnerAcquisitionLeadResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/leads`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
      body: JSON.stringify(payload),
    });
  },

async transitionLead(
  leadId: string,
  payload: TransitionPartnerAcquisitionLeadPayload,
  idempotencyKey: string,
): Promise<PartnerAcquisitionLeadResponse> {
  return apiCall<PartnerAcquisitionLeadResponse>(
    `${PARTNER_ACQUISITION_BASE_PATH}/leads/${leadId}/transition`,
    {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
      body: JSON.stringify(payload),
    },
  );
},

async promoteLeadToProspect(
  leadId: string,
  payload: PromotePartnerAcquisitionLeadToProspectPayload,
  idempotencyKey: string,
): Promise<PromotePartnerAcquisitionLeadToProspectResponse> {
  return apiCall<PromotePartnerAcquisitionLeadToProspectResponse>(
    `${PARTNER_ACQUISITION_BASE_PATH}/leads/${leadId}/promote-to-prospect`,
    {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
      body: JSON.stringify(payload),
    },
  );
},
  async getProspects(params?: ListPartnerProspectsParams): Promise<ListPartnerProspectsResponse> {
    const query = params ? buildQueryString(params as Record<string, unknown>) : '';
    return apiCall<ListPartnerProspectsResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects${query}`);
  },

  async getProspectById(prospectId: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}`);
  },

  async createProspect(
    payload: CreatePartnerProspectPayload,
    idempotencyKey: string,
  ): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
      body: JSON.stringify(payload),
    });
  },

  async qualifyProspect(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/qualify`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async disqualifyProspect(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/disqualify`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async moveProspectToNegotiation(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/negotiation`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async requestProspectDocumentation(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/documentation/request`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async markProspectDocumentationReceived(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/documentation/received`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async requestProspectContract(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/contract/request`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async markProspectContractSigned(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/contract/signed`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async approveProspectConversion(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/conversion/approve`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async rejectProspectConversion(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/conversion/reject`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },

  async convertProspect(prospectId: string, idempotencyKey: string): Promise<PartnerProspectResponse> {
    return apiCall<PartnerProspectResponse>(`${PARTNER_ACQUISITION_BASE_PATH}/prospects/${prospectId}/convert`, {
      method: 'POST',
      headers: withIdempotencyKey(idempotencyKey),
    });
  },
};
