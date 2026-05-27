import { NovaPromotoraProposalMapper } from '../../../modules/integrations/providers/nova-promotora/nova-promotora.proposal-mapper.js';

describe('NovaPromotoraProposalMapper', () => {
  it('generates deterministic proposalId for same externalProposalId', () => {
    const mapper = new NovaPromotoraProposalMapper();
    const payload = {
      id: 'PROP-DET-1',
      document: '12345678901',
      bank: 'BANCO PAN',
      product: 'CONSIGNADO',
      status: 'LIBERADA',
    };

    const first = mapper.map(payload);
    const second = mapper.map(payload);

    expect(first.proposalId).toBe(second.proposalId);
  });

  it('generates different proposalId for different externalProposalId', () => {
    const mapper = new NovaPromotoraProposalMapper();

    const first = mapper.map({
      id: 'PROP-DET-A',
      document: '12345678901',
      status: 'LIBERADA',
    });
    const second = mapper.map({
      id: 'PROP-DET-B',
      document: '12345678901',
      status: 'LIBERADA',
    });

    expect(first.proposalId).not.toBe(second.proposalId);
  });

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
      hasMissingExternalProposalId: false,
    });
    expect(result.proposalId).toEqual(expect.any(String));
  });

  it('uses a safe fallback when externalProposalId is missing', () => {
    const mapper = new NovaPromotoraProposalMapper();

    const result = mapper.map({
      document: '12345678901',
      bank: 'BANCO PAN',
      product: 'CONSIGNADO',
      status: 'LIBERADA',
    });

    expect(result.externalProposalId.startsWith('missing-')).toBe(true);
    expect(result.metadata).toMatchObject({
      hasMissingExternalProposalId: true,
    });
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

  it('sanitizes metadata and does not keep sensitive fields', () => {
    const mapper = new NovaPromotoraProposalMapper();

    const result = mapper.map({
      id: 'PROP-SAN-1',
      document: '12345678901',
      cpf: '12345678901',
      email: 'cliente@teste.com',
      telefone: '11999999999',
      bankData: 'sensitive',
      status: 'LIBERADA',
      bank: 'BANCO PAN',
      product: 'CONSIGNADO',
    });

    expect(result.metadata).not.toHaveProperty('document');
    expect(result.metadata).not.toHaveProperty('cpf');
    expect(result.metadata).not.toHaveProperty('email');
    expect(result.metadata).not.toHaveProperty('telefone');
    expect(result.metadata).not.toHaveProperty('bankData');
    expect(result.metadata).toMatchObject({
      bank: 'BANCO PAN',
      product: 'CONSIGNADO',
      rawStatus: 'LIBERADA',
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
