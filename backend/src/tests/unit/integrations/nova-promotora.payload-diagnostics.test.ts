import { analyzeNovaPromotoraPayload } from '../../../modules/integrations/providers/nova-promotora/nova-promotora.payload-diagnostics.js';

describe('analyzeNovaPromotoraPayload', () => {
  it('analyzes valid array payload', () => {
    const result = analyzeNovaPromotoraPayload([
      {
        id: 'PROP-1',
        document: '12345678900',
        status: 'LIBERADA',
      },
    ]);

    expect(result.providerKey).toBe('nova-promotora');
    expect(result.totalRecords).toBe(1);
    expect(result.validRecords).toBe(1);
    expect(result.invalidRecords).toBe(0);
    expect(result.unknownStatuses).toEqual([]);
  });

  it('recognizes enveloped payload in propostas', () => {
    const result = analyzeNovaPromotoraPayload({
      propostas: [
        {
          id: 'PROP-2',
          document: '12345678900',
          situacao: 'EM ANALISE',
        },
      ],
    });

    expect(result.totalRecords).toBe(1);
    expect(result.validRecords).toBe(1);
  });

  it('detects invalid primitive payload', () => {
    const result = analyzeNovaPromotoraPayload('invalid');

    expect(result.totalRecords).toBe(0);
    expect(result.issues.some((issue) => issue.code === 'PAYLOAD_INVALID_TYPE')).toBe(true);
  });

  it('detects object payload without recognized array', () => {
    const result = analyzeNovaPromotoraPayload({
      foo: 'bar',
    });

    expect(result.totalRecords).toBe(0);
    expect(result.issues.some((issue) => issue.code === 'PAYLOAD_ARRAY_NOT_FOUND')).toBe(true);
  });

  it('counts invalid record types inside array', () => {
    const result = analyzeNovaPromotoraPayload([
      {
        id: 'PROP-3',
        document: '12345678900',
        status: 'LIBERADA',
      },
      'invalid-record',
    ]);

    expect(result.totalRecords).toBe(2);
    expect(result.validRecords).toBe(1);
    expect(result.invalidRecords).toBe(1);
    expect(result.issues.some((issue) => issue.code === 'RECORD_INVALID_TYPE')).toBe(true);
  });

  it('detects missing id', () => {
    const result = analyzeNovaPromotoraPayload([
      {
        document: '12345678900',
        status: 'LIBERADA',
      },
    ]);

    expect(result.issues.some((issue) => issue.code === 'MISSING_PROPOSAL_ID')).toBe(true);
  });

  it('detects missing document', () => {
    const result = analyzeNovaPromotoraPayload([
      {
        id: 'PROP-4',
        status: 'LIBERADA',
      },
    ]);

    expect(result.issues.some((issue) => issue.code === 'MISSING_CUSTOMER_DOCUMENT')).toBe(true);
  });

  it('detects missing status', () => {
    const result = analyzeNovaPromotoraPayload([
      {
        id: 'PROP-5',
        document: '12345678900',
      },
    ]);

    expect(result.issues.some((issue) => issue.code === 'MISSING_STATUS')).toBe(true);
  });

  it('detects unknown status', () => {
    const result = analyzeNovaPromotoraPayload([
      {
        id: 'PROP-6',
        document: '12345678900',
        status: 'STATUS_XYZ',
      },
    ]);

    expect(result.issues.some((issue) => issue.code === 'UNKNOWN_STATUS')).toBe(true);
    expect(result.unknownStatuses).toEqual(['STATUS_XYZ']);
  });
});
