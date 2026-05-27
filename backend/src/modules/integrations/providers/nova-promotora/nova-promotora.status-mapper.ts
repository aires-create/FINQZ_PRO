import type {
  FinancialProposalStatusMapper,
  FinancialProposalStatusMappingResult,
} from '../../domain/contracts/financial-proposal/financial-proposal-status-mapper.contract.js';
import { normalizeFinancialProposalRawStatus } from '../../domain/contracts/financial-proposal/financial-proposal-status-normalizer.js';

const statusMap = new Map<string, FinancialProposalStatusMappingResult['status']>([
  ['RECEBIDA', 'RECEIVED'],
  ['EM ANALISE', 'UNDER_REVIEW'],
  ['ANALISE', 'UNDER_REVIEW'],
  ['PENDENTE', 'PENDING_DOCUMENTS'],
  ['PENDENCIA', 'PENDING_DOCUMENTS'],
  ['DIGITACAO', 'DIGITATION'],
  ['FORMALIZACAO', 'FORMALIZATION'],
  ['AVERBACAO', 'AVERBATION'],
  ['LIBERADA', 'APPROVED'],
  ['APROVADA', 'APPROVED'],
  ['REPROVADA', 'REJECTED'],
  ['CANCELADA', 'CANCELED'],
  ['PAGA', 'PAID'],
  ['PAGO', 'PAID'],
  ['ERRO', 'ERROR'],
]);

export class NovaPromotoraStatusMapper implements FinancialProposalStatusMapper {
  mapStatus(rawStatus: string): FinancialProposalStatusMappingResult {
    const normalized = normalizeFinancialProposalRawStatus(rawStatus);
    const status = statusMap.get(normalized);

    return {
      status: status ?? 'ERROR',
      rawStatus,
      confidence: status ? 'high' : 'low',
    };
  }
}