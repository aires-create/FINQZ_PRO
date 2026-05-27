import { NovaPromotoraProposalMapper } from '../../../modules/integrations/providers/nova-promotora/nova-promotora.proposal-mapper.js';

describe('NovaPromotoraProposalMapper', () => {
  it('maps status LIBERADA to APPROVED with status metadata', () => {
    const mapper = new NovaPromotoraProposalMapper();

    const result = mapper.map({
      id: 'PROP-123',
      document: '12345678901',
      bank: 'BANCO PAN',
      product: 'CONSIGNADO',
      status: 'LIBERADA',
    });

    expect(result.providerKey).toBe('nova-promotora');
    expect(result.externalProposalId).toBe('PROP-123');
    expect(result.customerDocument).toBe('12345678901');
    expect(result.bank).toBe('BANCO PAN');
    expect(result.product).toBe('CONSIGNADO');
    expect(result.status).toBe('APPROVED');
    expect(result.metadata).toMatchObject({
      rawStatus: 'LIBERADA',
      statusMappingConfidence: 'high',
    });
    expect(result.proposalId).toEqual(expect.any(String));
  });

  it('maps status EM ANALISE from situacao to UNDER_REVIEW', () => {
    const mapper = new NovaPromotoraProposalMapper();

    const result = mapper.map({
      id: 'PROP-456',
      document: '12345678901',
      bank: 'BANCO PAN',
      product: 'CONSIGNADO',
      situacao: 'EM ANALISE',
    });

    expect(result.status).toBe('UNDER_REVIEW');
    expect(result.metadata).toMatchObject({
      rawStatus: 'EM ANALISE',
      statusMappingConfidence: 'high',
    });
  });

  it('maps unknown status to ERROR with low confidence', () => {
    const mapper = new NovaPromotoraProposalMapper();

    const result = mapper.map({
      id: 'PROP-789',
      document: '12345678901',
      bank: 'BANCO PAN',
      product: 'CONSIGNADO',
      statusProposta: 'STATUS_NAO_MAPEADO',
    });

    expect(result.status).toBe('ERROR');
    expect(result.metadata).toMatchObject({
      rawStatus: 'STATUS_NAO_MAPEADO',
      statusMappingConfidence: 'low',
    });
  });
});
