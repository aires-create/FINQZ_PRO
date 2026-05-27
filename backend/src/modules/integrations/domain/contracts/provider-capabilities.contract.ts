export type {
  MarginInquiryInput,
  MarginInquiryProvider,
  MarginInquiryResult,
  ProviderMetadata,
} from './margin-inquiry.contract.js';
export type {
  CommissionPayoutInput,
  CommissionPayoutProvider,
  CommissionPayoutResult,
} from './commission-payout.contract.js';
export type {
  FinancialExecutionContext,
  FinancialExecutionDecision,
  FinancialExecutionDiagnostics,
  FinancialExecutionPolicy,
  FinancialExecutionRiskLevel,
  FinancialExecutionStatus,
  FinancialExecutionType,
} from './financial-execution.contract.js';
export type {
  WebhookCapableProvider,
  WebhookEvent,
  WebhookValidationInput,
} from './webhook-capable.contract.js';

import type { ProviderMetadata } from './margin-inquiry.contract.js';

export type RateTableFilters = {
  productCode?: string;
  channel?: string;
  asOfDate?: string;
  metadata?: ProviderMetadata;
};

export type RateTable = {
  id: string;
  name: string;
  productCode?: string;
  providerKey: string;
  metadata?: ProviderMetadata;
};

export type CoefficientEntry = {
  termMonths: number;
  coefficient: number;
  rate?: number;
  metadata?: ProviderMetadata;
};

export interface RateTableProvider {
  listRateTables(filters?: RateTableFilters): Promise<RateTable[]>;
  listCoefficients(tableId: string): Promise<CoefficientEntry[]>;
}

export type ProposalCreateInput = {
  customerName: string;
  document: string;
  amount: number;
  productCode?: string;
  metadata?: ProviderMetadata;
};

export type ProposalRef = {
  externalId: string;
  providerKey: string;
  createdAt?: string;
  metadata?: ProviderMetadata;
};

export type ProposalStatusResult = {
  externalId: string;
  status: string;
  statusDate?: string;
  providerKey: string;
  rawStatus?: string;
  metadata?: ProviderMetadata;
};

export interface ProposalPipelineProvider {
  createProposal(input: ProposalCreateInput): Promise<ProposalRef>;
  getProposalStatus(externalId: string): Promise<ProposalStatusResult>;
}

export type CommissionListFilters = {
  periodStart?: string;
  periodEnd?: string;
  partnerCode?: string;
  proposalExternalId?: string;
  metadata?: ProviderMetadata;
};

export type CommissionEntry = {
  externalId: string;
  amount: number;
  status: string;
  referenceDate?: string;
  providerKey: string;
  metadata?: ProviderMetadata;
};

export type CommissionSummary = {
  totalAmount: number;
  paidAmount?: number;
  pendingAmount?: number;
  periodStart?: string;
  periodEnd?: string;
  providerKey: string;
  metadata?: ProviderMetadata;
};

export interface CommissionProvider {
  listCommissions(filters?: CommissionListFilters): Promise<CommissionEntry[]>;
  getCommissionSummary(filters?: CommissionListFilters): Promise<CommissionSummary>;
}

export type DataEnrichmentInput = {
  document?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  metadata?: ProviderMetadata;
};

export type DataEnrichmentResult = {
  score?: number;
  classification?: string;
  sanitizedData?: ProviderMetadata;
  providerKey: string;
  raw?: unknown;
};

export interface DataEnrichmentProvider {
  enrichData(input: DataEnrichmentInput): Promise<DataEnrichmentResult>;
}

export type MessageSendInput = {
  to: string;
  channel: 'whatsapp' | 'sms' | 'email';
  body: string;
  templateId?: string;
  metadata?: ProviderMetadata;
};

export type MessageSendResult = {
  messageId: string;
  status: string;
  providerKey: string;
  metadata?: ProviderMetadata;
};

export interface MessageSenderProvider {
  sendMessage(input: MessageSendInput): Promise<MessageSendResult>;
}

export type BulkDispatchInput = {
  campaignName?: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipients: string[];
  body: string;
  templateId?: string;
  metadata?: ProviderMetadata;
};

export type BulkDispatchResult = {
  campaignId: string;
  accepted: number;
  rejected?: number;
  status: string;
  providerKey: string;
  metadata?: ProviderMetadata;
};

export interface BulkMessagingProvider {
  dispatchBulk(input: BulkDispatchInput): Promise<BulkDispatchResult>;
}
