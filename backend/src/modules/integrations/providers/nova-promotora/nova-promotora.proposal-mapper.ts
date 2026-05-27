import type { FinancialProposal } from '../../domain/contracts/financial-proposal/financial-proposal.contract.js';
import type { FinancialProposalMapper } from '../../domain/contracts/financial-proposal/financial-proposal-mapper.contract.js';
import type { NovaPromotoraRawProposal } from './nova-promotora.proposal.types.js';
import { NovaPromotoraStatusMapper } from './nova-promotora.status-mapper.js';

const readRawStatus = (payload: NovaPromotoraRawProposal): string => {
  const statusCandidates = [payload.status, payload.situacao, payload.statusProposta];

  for (const candidate of statusCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return 'UNKNOWN';
};

export class NovaPromotoraProposalMapper
  implements FinancialProposalMapper<NovaPromotoraRawProposal>
{
  private readonly statusMapper = new NovaPromotoraStatusMapper();

  map(payload: NovaPromotoraRawProposal): FinancialProposal {
    const rawStatus = readRawStatus(payload);
    const statusMapping = this.statusMapper.mapStatus(rawStatus);

    return {
      proposalId: crypto.randomUUID(),

      providerKey: 'nova-promotora',

      externalProposalId: String(
        payload.externalProposalId ?? payload.id ?? 'unknown',
      ),

      customerDocument: String(
        payload.customerDocument ?? payload.document ?? 'unknown',
      ),

      bank: String(payload.bank ?? 'unknown'),

      product: String(payload.product ?? 'unknown'),

      status: statusMapping.status,

      metadata: {
        ...payload,
        rawStatus: statusMapping.rawStatus,
        statusMappingConfidence: statusMapping.confidence,
      },
    };
  }
}
