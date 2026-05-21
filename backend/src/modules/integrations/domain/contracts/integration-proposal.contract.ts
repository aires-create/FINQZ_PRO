export type IntegrationProposal = {
  externalId: string;
  customerName: string;
  document: string;
  status: string;
  amount: number;
  createdAt: string;
  providerKey: string;
  rawStatus: string;
};

export interface IntegrationProposalReader {
  listProposals(): Promise<IntegrationProposal[]>;
}

export const hasIntegrationProposalReader = (
  provider: unknown,
): provider is IntegrationProposalReader => {
  const candidate = provider as { listProposals?: unknown };

  return (
    typeof provider === 'object' &&
    provider !== null &&
    typeof candidate.listProposals === 'function'
  );
};
