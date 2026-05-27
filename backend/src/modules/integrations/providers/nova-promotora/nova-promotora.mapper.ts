import type { FinancialProposal } from '../../domain/contracts/financial-proposal/financial-proposal.contract.js';
import { NovaPromotoraProposalMapper } from './nova-promotora.proposal-mapper.js';
import type { IntegrationProposal } from '../../domain/contracts/integration-proposal.contract.js';
import { NOVA_PROMOTORA_PROVIDER_KEY } from './nova-promotora.types.js';

type ExternalProposalRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ExternalProposalRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getNestedRecord = (
  record: ExternalProposalRecord,
  key: string,
): ExternalProposalRecord | undefined => {
  const value = record[key];

  return isRecord(value) ? value : undefined;
};

const getStringValue = (
  record: ExternalProposalRecord,
  keys: readonly string[],
) => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const getNumberValue = (
  record: ExternalProposalRecord,
  keys: readonly string[],
) => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalizedValue = Number(value.replace(',', '.'));

      if (Number.isFinite(normalizedValue)) {
        return normalizedValue;
      }
    }
  }

  return 0;
};

const normalizeDateValue = (
  record: ExternalProposalRecord,
  keys: readonly string[],
) => {
  const value = getStringValue(record, keys);
  const date = value ? new Date(value) : undefined;

  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : value;
};

const getProposalRecords = (payload: unknown): ExternalProposalRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.proposals,
    payload.propostas,
    payload.items,
    payload.data,
    payload.result,
    payload.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
  }

  return [];
};

export function mapNovaPromotoraProposalsPayload(
  payload: unknown,
): IntegrationProposal[] {
  return getProposalRecords(payload).map((proposal) => {
    const emptyRecord: ExternalProposalRecord = {};
    const customer = getNestedRecord(proposal, 'customer') ??
      getNestedRecord(proposal, 'cliente') ??
      emptyRecord;
    const status = getStringValue(proposal, [
      'status',
      'situacao',
      'statusProposta',
    ]);

    return {
      externalId: getStringValue(proposal, [
        'externalId',
        'id',
        'proposalId',
        'propostaId',
        'numeroProposta',
        'codigo',
      ]),
      customerName:
        getStringValue(proposal, ['customerName', 'nomeCliente', 'nome']) ||
        getStringValue(customer, ['name', 'nome', 'customerName']),
      document:
        getStringValue(proposal, ['document', 'cpf', 'cnpj', 'documento']) ||
        getStringValue(customer, ['document', 'cpf', 'cnpj', 'documento']),
      status,
      amount: getNumberValue(proposal, [
        'amount',
        'valor',
        'valorSolicitado',
        'loanAmount',
      ]),
      createdAt: normalizeDateValue(proposal, [
        'createdAt',
        'dataCriacao',
        'criadoEm',
        'created_at',
      ]),
      providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
      rawStatus: status,
    };
  });
}
export function mapNovaPromotoraFinancialProposalsPayload(
  payload: unknown,
): FinancialProposal[] {
  const mapper = new NovaPromotoraProposalMapper();

  return getProposalRecords(payload).map((proposal) => mapper.map(proposal));
}