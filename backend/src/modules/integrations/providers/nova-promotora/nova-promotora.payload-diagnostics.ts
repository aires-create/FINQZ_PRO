import { NOVA_PROMOTORA_PROVIDER_KEY } from './nova-promotora.types.js';
import { NovaPromotoraStatusMapper } from './nova-promotora.status-mapper.js';

type DiagnosticsIssue = {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  path?: string;
};

type DiagnosticsResult = {
  providerKey: 'nova-promotora';
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  issues: DiagnosticsIssue[];
  unknownStatuses: string[];
};

type ExternalProposalRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ExternalProposalRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
): string => {
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

const recordStatus = (
  record: ExternalProposalRecord,
  customer: ExternalProposalRecord,
) =>
  getStringValue(record, ['status', 'situacao', 'statusProposta']) ||
  getStringValue(customer, ['status', 'situacao', 'statusProposta']);

const getArrayCandidate = (
  payload: ExternalProposalRecord,
): { path: string; value: unknown[] } | undefined => {
  const keys = ['proposals', 'propostas', 'items', 'data', 'result', 'results'];
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return { path: key, value };
    }
  }
  return undefined;
};

export const analyzeNovaPromotoraPayload = (payload: unknown): DiagnosticsResult => {
  const statusMapper = new NovaPromotoraStatusMapper();
  const issues: DiagnosticsIssue[] = [];
  const unknownStatuses = new Set<string>();

  let records: unknown[] = [];
  let sourcePath = '$';

  if (Array.isArray(payload)) {
    records = payload;
  } else if (isRecord(payload)) {
    const candidate = getArrayCandidate(payload);
    if (candidate) {
      records = candidate.value;
      sourcePath = `$.${candidate.path}`;
    } else {
      issues.push({
        code: 'PAYLOAD_ARRAY_NOT_FOUND',
        severity: 'error',
        message: 'Payload object does not contain a recognized proposal array',
        path: '$',
      });
      return {
        providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        issues,
        unknownStatuses: [],
      };
    }
  } else {
    issues.push({
      code: 'PAYLOAD_INVALID_TYPE',
      severity: 'error',
      message: 'Payload is neither an object nor an array',
      path: '$',
    });
    return {
      providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      issues,
      unknownStatuses: [],
    };
  }

  if (records.length === 0) {
    issues.push({
      code: 'PAYLOAD_EMPTY_ARRAY',
      severity: 'info',
      message: 'Recognized payload array is empty',
      path: sourcePath,
    });
  }

  let validRecords = 0;
  let invalidRecords = 0;

  for (const [index, item] of records.entries()) {
    const recordPath = `${sourcePath}[${index}]`;
    if (!isRecord(item)) {
      invalidRecords += 1;
      issues.push({
        code: 'RECORD_INVALID_TYPE',
        severity: 'error',
        message: 'Record is not an object',
        path: recordPath,
      });
      continue;
    }

    validRecords += 1;
    const customer = getNestedRecord(item, 'customer') ?? getNestedRecord(item, 'cliente') ?? {};

    const proposalId = getStringValue(item, [
      'externalId',
      'id',
      'proposalId',
      'propostaId',
      'numeroProposta',
      'codigo',
      'externalProposalId',
    ]);
    if (!proposalId) {
      issues.push({
        code: 'MISSING_PROPOSAL_ID',
        severity: 'warning',
        message: 'Record does not contain a recognized proposal identifier',
        path: recordPath,
      });
    }

    const document =
      getStringValue(item, ['document', 'cpf', 'cnpj', 'documento', 'customerDocument']) ||
      getStringValue(customer, ['document', 'cpf', 'cnpj', 'documento', 'customerDocument']);
    if (!document) {
      issues.push({
        code: 'MISSING_CUSTOMER_DOCUMENT',
        severity: 'warning',
        message: 'Record does not contain a recognized customer document',
        path: recordPath,
      });
    }

    const rawStatus = recordStatus(item, customer);
    if (!rawStatus) {
      issues.push({
        code: 'MISSING_STATUS',
        severity: 'warning',
        message: 'Record does not contain a recognized status field',
        path: recordPath,
      });
      continue;
    }

    const statusMapping = statusMapper.mapStatus(rawStatus);
    if (statusMapping.confidence === 'low') {
      unknownStatuses.add(statusMapping.rawStatus);
      issues.push({
        code: 'UNKNOWN_STATUS',
        severity: 'warning',
        message: 'Record contains a status that is not recognized by canonical mapping',
        path: recordPath,
      });
    }
  }

  return {
    providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
    totalRecords: records.length,
    validRecords,
    invalidRecords,
    issues,
    unknownStatuses: Array.from(unknownStatuses),
  };
};
