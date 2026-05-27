import crypto from 'node:crypto';
import type { FinancialProposal } from '../../domain/contracts/financial-proposal/financial-proposal.contract.js';
import type { FinancialProposalMapper } from '../../domain/contracts/financial-proposal/financial-proposal-mapper.contract.js';
import type { NovaPromotoraRawProposal } from './nova-promotora.proposal.types.js';
import { NovaPromotoraStatusMapper } from './nova-promotora.status-mapper.js';

const PROVIDER_KEY = 'nova-promotora';

const SENSITIVE_METADATA_KEYS = new Set([
  'cpf',
  'cnpj',
  'document',
  'documento',
  'customerdocument',
  'customerdocument',
  'email',
  'telefone',
  'phone',
  'celular',
  'whatsapp',
  'bankdata',
  'dadosbancarios',
  'conta',
  'agencia',
  'pix',
  'pixkey',
]);

const readRawStatus = (payload: NovaPromotoraRawProposal): string => {
  const statusCandidates = [payload.status, payload.situacao, payload.statusProposta];

  for (const candidate of statusCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return 'UNKNOWN';
};

const sanitizeOperationalMetadata = (
  payload: NovaPromotoraRawProposal,
): Record<string, string | number | boolean | null> => {
  const metadata: Record<string, string | number | boolean | null> = {};

  for (const [rawKey, rawValue] of Object.entries(payload)) {
    const normalizedKey = rawKey.toLowerCase().replace(/[_\s]/g, '');

    if (SENSITIVE_METADATA_KEYS.has(normalizedKey)) {
      continue;
    }

    if (
      typeof rawValue === 'string' ||
      typeof rawValue === 'number' ||
      typeof rawValue === 'boolean' ||
      rawValue === null
    ) {
      metadata[rawKey] = rawValue;
    }
  }

  return metadata;
};

const buildStableHash = (...parts: string[]): string => {
  const hash = crypto.createHash('sha256');
  hash.update(parts.join('|'));
  return hash.digest('hex').slice(0, 24);
};

const resolveExternalProposalId = (payload: NovaPromotoraRawProposal) => {
  const candidates = [
    payload.externalProposalId,
    payload.id,
    payload.proposalId,
    payload.propostaId,
    payload.numeroProposta,
    payload.codigo,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return {
        externalProposalId: candidate.trim(),
        hasMissingExternalProposalId: false,
      };
    }

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return {
        externalProposalId: String(candidate),
        hasMissingExternalProposalId: false,
      };
    }
  }

  return {
    externalProposalId: `missing-${buildStableHash(
      String(payload.customerDocument ?? payload.document ?? ''),
      String(payload.bank ?? ''),
      String(payload.product ?? ''),
      String(payload.status ?? payload.situacao ?? payload.statusProposta ?? ''),
    )}`,
    hasMissingExternalProposalId: true,
  };
};

const buildProposalId = (externalProposalId: string): string => {
  return buildStableHash(PROVIDER_KEY, externalProposalId);
};

export class NovaPromotoraProposalMapper
  implements FinancialProposalMapper<NovaPromotoraRawProposal>
{
  private readonly statusMapper = new NovaPromotoraStatusMapper();

  map(payload: NovaPromotoraRawProposal): FinancialProposal {
    const rawStatus = readRawStatus(payload);
    const statusMapping = this.statusMapper.mapStatus(rawStatus);
    const { externalProposalId, hasMissingExternalProposalId } = resolveExternalProposalId(payload);

    return {
      proposalId: buildProposalId(externalProposalId),

      providerKey: PROVIDER_KEY,

      externalProposalId,

      customerDocument: String(
        payload.customerDocument ?? payload.document ?? 'unknown',
      ),

      bank: String(payload.bank ?? 'unknown'),

      product: String(payload.product ?? 'unknown'),

      status: statusMapping.status,

      metadata: {
        ...sanitizeOperationalMetadata(payload),
        hasMissingExternalProposalId,
        rawStatus: statusMapping.rawStatus,
        statusMappingConfidence: statusMapping.confidence,
      },
    };
  }
}
