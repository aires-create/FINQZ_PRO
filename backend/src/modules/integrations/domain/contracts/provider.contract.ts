import type { IntegrationProposalReader } from './integration-proposal.contract.js';

export type IntegrationConnectionStatus = {
  connected: boolean;
  status?: number;
  message?: string;
  error?: string;
};

export interface IntegrationProvider {
  healthCheck(): Promise<boolean>;
  testConnection(): Promise<IntegrationConnectionStatus>;
  listProposals?: IntegrationProposalReader['listProposals'];
}
