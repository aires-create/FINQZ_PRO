import { describe, expect, it, vi } from 'vitest';
import {
  buildOpportunityEnvelopeUpdatePayload,
  buildCreateOpportunityIntakePayload,
  buildCreateOpportunityPayload,
  buildMoveStagePayload,
  buildUpdateOpportunityPayload,
  buildOpportunityWorkspaceUpdatePayload,
  mapOpportunityApiToWorkspaceInput,
  mergeOpportunityWorkspace,
  persistOpportunityWorkspaceMutation,
  normalizeOpportunityWorkspace,
  resolveOpportunityWorkspaceApiMutationId,
  resolveOpportunityWorkspaceMutationId,
} from '../components/pipeline/workspaceOpportunity';
import type { Opportunity } from '../api/modules/opportunities.api';

const stageCatalog = [
  { id: 'novo_lead', label: 'Novo Lead' },
  { id: 'negociacao', label: 'Negociação' },
  { id: 'pendencia', label: 'Pendência' },
];

const buildApiOpportunity = (
  overrides: Partial<Opportunity> = {},
): Opportunity => ({
  id: 'opp-1',
  title: 'Oportunidade API',
  description: 'Descrição API',
  amount: 1250,
  currency: 'BRL',
  probability: 80,
  status: 'open',
  expectedCloseDate: null,
  actualCloseDate: null,
  tenantId: 'tenant-1',
  partnerId: null,
  leadId: 'lead-1',
  customerId: 'customer-1',
  productId: 'product-1',
  subproductId: 'subproduct-1',
  modalityId: 'modality-1',
  pipelineId: 'pipeline-1',
  stageId: 'negociacao',
  ownerId: 'owner-1',
  deletedAt: null,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T11:00:00.000Z',
  pipeline: {
    id: 'pipeline-1',
    name: 'Pipeline Oficial',
  },
  stage: {
    id: 'negociacao',
    name: 'Negociação',
    order: 2,
    isWon: false,
    isLost: false,
  },
  customer: {
    id: 'customer-1',
    firstName: 'Maria',
    lastName: 'Silva',
    email: 'maria@example.com',
    phone: '11999990000',
  },
  owner: {
    id: 'owner-1',
    firstName: 'Aires',
    lastName: 'Fernandes',
  },
  product: {
    id: 'product-1',
    code: 'PROD-1',
    name: 'Produto Oficial',
  },
  subproduct: {
    id: 'subproduct-1',
    code: 'SUB-1',
    name: 'Subproduto Oficial',
  },
  modality: {
    id: 'modality-1',
    code: 'MOD-1',
    name: 'Modalidade Oficial',
  },
  ...overrides,
});

describe('mapOpportunityApiToWorkspaceInput', () => {
  it('mapeia o DTO oficial para o contrato canônico de entrada sem mutar o DTO', () => {
    const dto = buildApiOpportunity();
    const snapshot = JSON.parse(JSON.stringify(dto));

    const input = mapOpportunityApiToWorkspaceInput(dto);

    expect(input).toEqual({
      source: 'backend',
      id: 'opp-1',
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      customerId: 'customer-1',
      pipelineId: 'pipeline-1',
      pipelineName: 'Pipeline Oficial',
      stageId: 'negociacao',
      stageName: 'Negociação',
      title: 'Oportunidade API',
      amount: 1250,
      productId: 'product-1',
      ownerId: 'owner-1',
      status: 'open',
      description: 'Descrição API',
      cliente_nome: 'Maria Silva',
      produto: 'Produto Oficial',
      responsavel_nome: 'Aires Fernandes',
      telefone: '11999990000',
      email: 'maria@example.com',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T11:00:00.000Z',
    });
    expect(dto).toEqual(snapshot);
  });

  it('preserva amount zero e não gera nomes inválidos quando relações ausentes', () => {
    const input = mapOpportunityApiToWorkspaceInput(buildApiOpportunity({
      amount: 0,
      customerId: null,
      productId: null,
      ownerId: null,
      customer: null,
      product: null,
      owner: null,
      pipeline: null,
      stage: null,
      description: null,
    }));

    expect(input.amount).toBe(0);
    expect(input.customerId).toBeNull();
    expect(input.productId).toBeNull();
    expect(input.ownerId).toBeNull();
    expect(input.cliente_nome).toBeUndefined();
    expect(input.responsavel_nome).toBeUndefined();
    expect(input.pipelineName).toBeUndefined();
    expect(input.stageName).toBeUndefined();
    expect(String(input)).not.toContain('undefined undefined');
  });

  it('resolve o nome do cliente com precedência determinística sem sobrescrever o título', () => {
    const firstLast = mapOpportunityApiToWorkspaceInput(buildApiOpportunity({
      title: 'Título Oficial',
      customer: {
        id: 'customer-1',
        firstName: 'Joana',
        lastName: 'Souza',
      },
    }));
    expect(firstLast.cliente_nome).toBe('Joana Souza');
    expect(firstLast.title).toBe('Título Oficial');

    const firstOnly = mapOpportunityApiToWorkspaceInput(buildApiOpportunity({
      customer: {
        id: 'customer-1',
        firstName: 'Joana',
        lastName: '',
      },
    }));
    expect(firstOnly.cliente_nome).toBe('Joana');

    const named = mapOpportunityApiToWorkspaceInput(buildApiOpportunity({
      customer: {
        id: 'customer-1',
        name: 'Cliente Pronto',
        firstName: 'Ignorado',
        lastName: 'Também',
      },
    }));
    expect(named.cliente_nome).toBe('Cliente Pronto');
  });

  it('encadeia DTO oficial -> input canônico -> ViewModel único preservando labels e aliases', () => {
    const dto = buildApiOpportunity();

    const input = mapOpportunityApiToWorkspaceInput(dto);
    const normalized = normalizeOpportunityWorkspace(input, {
      source: 'backend',
      stageCatalog,
      pipelineLabel: dto.pipeline?.name ?? null,
    });

    expect(normalized.id).toBe(dto.id);
    expect(normalized.pipelineId).toBe(dto.pipelineId);
    expect(normalized.stageId).toBe(dto.stageId);
    expect(normalized.title).toBe(dto.title);
    expect(normalized.amount).toBe(dto.amount);
    expect(normalized.customerId).toBe(dto.customerId);
    expect(normalized.productId).toBe(dto.productId);
    expect(normalized.ownerId).toBe(dto.ownerId);
    expect(normalized.status).toBe(dto.status);
    expect(normalized.description).toBe(dto.description);
    expect(normalized.stageLabel).toBe('Negociação');
    expect(normalized.pipelineLabel).toBe('Pipeline Oficial');
    expect(normalized.valor).toBe(dto.amount);
    expect(normalized.cliente_nome).toBe('Maria Silva');
    expect(normalized.responsavel_nome).toBe('Aires Fernandes');
    expect(normalized.pipeline_id).toBe(dto.pipelineId);
    expect(normalized.stage_id).toBe(dto.stageId);
  });
});

describe('normalizeOpportunityWorkspace', () => {
  it('formaliza uma saída canônica completa sem perder derivados e compatibilidade', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'canonical-1',
      pipelineId: 'pipeline-oficial',
      stageId: 'negociacao',
      title: 'Oportunidade Oficial',
      amount: 1250,
      customerId: 'customer-oficial',
      productId: 'product-oficial',
      ownerId: 'owner-oficial',
      status: 'ganha',
      description: 'Descrição oficial',
      cliente_nome: 'Cliente Oficial',
      produto: 'Produto Oficial',
      responsavel_nome: 'Owner Oficial',
    }, {
      stageCatalog,
      pipelineLabel: 'Pipeline Oficial',
    });

    expect(normalized.id).toBe('canonical-1');
    expect(normalized.pipelineId).toBe('pipeline-oficial');
    expect(normalized.stageId).toBe('negociacao');
    expect(normalized.title).toBe('Oportunidade Oficial');
    expect(normalized.amount).toBe(1250);
    expect(normalized.customerId).toBe('customer-oficial');
    expect(normalized.productId).toBe('product-oficial');
    expect(normalized.ownerId).toBe('owner-oficial');
    expect(normalized.status).toBe('ganha');
    expect(normalized.description).toBe('Descrição oficial');
    expect(normalized.displayId).toBe('canonical-1');
    expect(normalized.stageLabel).toBe('Negociação');
    expect(normalized.pipelineLabel).toBe('Pipeline Oficial');
    expect(normalized.formattedValue).toBe(normalized.derived.formattedValue);
    expect(normalized.displayName).toBe('Cliente Oficial');
    expect(normalized.initials).toBe('CO');
    expect(normalized.pipeline_id).toBe('pipeline-oficial');
    expect(normalized.stage_id).toBe('negociacao');
    expect(normalized.valor).toBe(1250);
    expect(normalized.cliente_id).toBe('customer-oficial');
    expect(normalized.cliente_nome).toBe('Cliente Oficial');
    expect(normalized.produto_id).toBe('product-oficial');
    expect(normalized.produto).toBe('Produto Oficial');
    expect(normalized.responsavel_id).toBe('owner-oficial');
    expect(normalized.responsavel_nome).toBe('Owner Oficial');
    expect(normalized.observacoes).toBe('Descrição oficial');
  });

  it('prioriza amount canônico sobre valor legado', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'amount-1',
      amount: 1000,
      valor: 900,
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.amount).toBe(1000);
    expect(normalized.valor).toBe(1000);
    expect(normalized.persisted.valor).toBe(1000);
    expect(normalized.formattedValue).toBe(normalized.derived.formattedValue);
  });

  it('preserva amount zero sem cair no alias valor', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'amount-0',
      amount: 0,
      valor: 900,
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.amount).toBe(0);
    expect(normalized.valor).toBe(0);
    expect(normalized.persisted.valor).toBe(0);
    expect(normalized.formattedValue).toBe(normalized.derived.formattedValue);
  });

  it('mantém fallback legado de valor quando amount não existe', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'amount-fallback',
      valor: 900,
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.amount).toBe(900);
    expect(normalized.valor).toBe(900);
    expect(normalized.persisted.valor).toBe(900);
  });

  it('preserva o id canônico e separa displayId do id', () => {
    const input = Object.freeze({
      id: 'a1e2f3d4-1111-2222-3333-444455556666',
      cliente_nome: 'João Silva',
      valor: 15000,
      etapa_id: 'negociacao',
    });

    const normalized = normalizeOpportunityWorkspace(input, {
      stageCatalog,
      source: 'snapshot',
    });

    expect(normalized.id).toBe('a1e2f3d4-1111-2222-3333-444455556666');
    expect(normalized.identity.id).toBe(normalized.id);
    expect(normalized.displayId).toBe('Sem código');
    expect(normalized.identity.displayId).toBe('Sem código');
    expect(normalized.resolution.displayIdSource).toBe('missing');
    expect(normalized.stageLabel).toBe('Negociação');
  });

  it('normaliza lead projetado sem perder leadId ou customerId', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 12,
      leadId: 'lead-10',
      customerId: 'customer-20',
      cliente_nome: 'Maria Santos',
      produto: 'Crédito Consignado',
      valor: '25000',
      etapa_id: 'novo_lead',
      pipelineId: 'credito_consignado',
      source: 'backend',
    }, {
      stageCatalog,
      source: 'backend',
      pipelineLabel: 'Consignado',
    });

    expect(normalized.id).toBe('12');
    expect(normalized.leadId).toBe('lead-10');
    expect(normalized.customerId).toBe('customer-20');
    expect(normalized.persisted.clienteNome).toBe('Maria Santos');
    expect(normalized.persisted.valor).toBe(25000);
    expect(normalized.derived.pipelineLabel).toBe('Consignado');
    expect(normalized.derived.displayName).toBe('Maria Santos');
  });

  it('respeita a prioridade stageId > stage_id > etapa_id > etapa > missing', () => {
    const stageIdPreferred = normalizeOpportunityWorkspace({
      id: '1',
      stageId: 'stage-oficial',
      stage_id: 'stage-snake',
      etapa_id: 'stage-legado',
    }, {
      stageCatalog,
    });

    expect(stageIdPreferred.resolution.stageSource).toBe('stageId');
    expect(stageIdPreferred.resolution.stageId).toBe('stage-oficial');
    expect(stageIdPreferred.stageId).toBe('stage-oficial');

    const stageIdCompatPreferred = normalizeOpportunityWorkspace({
      id: '2',
      stage_id: 'stage-snake',
      etapa_id: 'stage-legado',
    }, {
      stageCatalog,
    });

    expect(stageIdCompatPreferred.resolution.stageSource).toBe('stage_id');
    expect(stageIdCompatPreferred.resolution.stageId).toBe('stage-snake');
    expect(stageIdCompatPreferred.stageId).toBe('stage-snake');

    const etapaIdPreferred = normalizeOpportunityWorkspace({
      id: '3',
      etapa_id: 'pendencia',
      etapa: 'Negociação',
    }, {
      stageCatalog,
    });

    expect(etapaIdPreferred.resolution.stageSource).toBe('etapa_id');
    expect(etapaIdPreferred.resolution.stageId).toBe('pendencia');
    expect(etapaIdPreferred.stageLabel).toBe('Pendência');

    const etapaTextPreferred = normalizeOpportunityWorkspace({
      id: '4',
      etapa: 'Negociação',
    }, {
      stageCatalog,
    });

    expect(etapaTextPreferred.resolution.stageSource).toBe('etapa');
    expect(etapaTextPreferred.resolution.stageId).toBe('negociacao');
    expect(etapaTextPreferred.stageLabel).toBe('Negociação');
  });

  it('retorna Etapa não identificada quando não há stage', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: '4',
      cliente_nome: 'Sem etapa',
    });

    expect(normalized.resolution.stageSource).toBe('missing');
    expect(normalized.resolution.stageId).toBeNull();
    expect(normalized.stageLabel).toBe('Etapa não identificada');
  });

  it('não promove identificadores técnicos desconhecidos para stageLabel', () => {
    const cases = [
      {
        input: {
          id: '4b2e8f7c-1111-2222-3333-444455556666',
          cliente_nome: 'UUID desconhecido',
          stageId: '9f2a7d3e-5555-6666-7777-888899990000',
        },
      },
      {
        input: {
          id: '4b2e8f7c-1111-2222-3333-444455556666',
          cliente_nome: 'stage técnico',
          stage_id: 'stage_92817',
        },
      },
      {
        input: {
          id: '4b2e8f7c-1111-2222-3333-444455556666',
          cliente_nome: 'etapa técnica',
          etapa_id: 'ETP-009',
        },
      },
      {
        input: {
          id: '4b2e8f7c-1111-2222-3333-444455556666',
          cliente_nome: 'sem etapa',
        },
      },
    ];

    for (const testCase of cases) {
      const normalized = normalizeOpportunityWorkspace(testCase.input, { stageCatalog });
      expect(normalized.stageLabel).toBe('Etapa não identificada');
      expect(normalized.derived.stageLabel).toBe('Etapa não identificada');
    }
  });

  it('mantém o label quando o stage existe no catálogo', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: '4b2e8f7c-1111-2222-3333-444455556666',
      cliente_nome: 'Etapa válida',
      stageId: 'negociacao',
    }, {
      stageCatalog,
    });

    expect(normalized.resolution.stageSource).toBe('stageId');
    expect(normalized.resolution.stageId).toBe('negociacao');
    expect(normalized.stageLabel).toBe('Negociação');
  });

  it('prioriza customerId canônico sobre cliente_id legado', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'customer-1',
      customerId: 'customer-oficial',
      cliente_id: 'customer-legado',
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.customerId).toBe('customer-oficial');
    expect(normalized.identity.customerId).toBe('customer-oficial');
    expect(normalized.cliente_id).toBe('customer-oficial');
  });

  it('prioriza ownerId canônico sobre responsavel_id legado', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'owner-1',
      ownerId: 'owner-oficial',
      responsavel_id: 'owner-legado',
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.ownerId).toBe('owner-oficial');
    expect(normalized.responsavel_id).toBe('owner-oficial');
  });

  it('prioriza pipelineId canônico sobre pipeline_id legado', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'pipeline-1',
      pipelineId: 'pipeline-oficial',
      pipeline_id: 'pipeline-legado',
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.pipelineId).toBe('pipeline-oficial');
    expect(normalized.pipeline_id).toBe('pipeline-oficial');
    expect(normalized.resolution.pipelineSource).toBe('pipelineId');
  });

  it('prioriza description canônica sobre observacoes legadas', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'description-1',
      description: 'Descrição oficial',
      observacoes: 'Descrição legada',
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.description).toBe('Descrição oficial');
    expect(normalized.observacoes).toBe('Descrição oficial');
    expect(normalized.persisted.observacoes).toBe('Descrição oficial');
  });

  it('mantém aliases equivalentes espelhando a saída canônica final', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'equivalence-1',
      pipelineId: 'pipeline-oficial',
      stageId: 'negociacao',
      amount: 1000,
      customerId: 'customer-oficial',
      productId: 'product-oficial',
      ownerId: 'owner-oficial',
      description: 'Descrição oficial',
    }, {
      stageCatalog,
    });

    expect(normalized.pipeline_id).toBe(normalized.pipelineId);
    expect(normalized.stage_id).toBe(normalized.stageId);
    expect(normalized.valor).toBe(normalized.amount);
    expect(normalized.cliente_id).toBe(normalized.customerId);
    expect(normalized.produto_id).toBe(normalized.productId);
    expect(normalized.responsavel_id).toBe(normalized.ownerId);
    expect(normalized.observacoes).toBe(normalized.description);
  });

  it('continua normalizando um objeto composto apenas por aliases', () => {
    const normalized = normalizeOpportunityWorkspace({
      opportunityId: 'legacy-10',
      nome: 'Maria Legada',
      valor: '900',
      pipeline_id: 'pipeline-legado',
      etapa_id: 'negociacao',
      cliente_id: 'customer-legado',
      produto_id: 'product-legado',
      responsavel_id: 'owner-legado',
      observacoes: 'Observação legada',
    }, {
      stageCatalog,
    });

    expect(normalized.id).toBe('legacy-10');
    expect(normalized.nome).toBe('Maria Legada');
    expect(normalized.valor).toBe(900);
    expect(normalized.pipelineId).toBe('pipeline-legado');
    expect(normalized.pipeline_id).toBe('pipeline-legado');
    expect(normalized.stageId).toBe('negociacao');
    expect(normalized.stage_id).toBe('negociacao');
    expect(normalized.customerId).toBe('customer-legado');
    expect(normalized.cliente_id).toBe('customer-legado');
    expect(normalized.productId).toBe('product-legado');
    expect(normalized.produto_id).toBe('product-legado');
    expect(normalized.ownerId).toBe('owner-legado');
    expect(normalized.responsavel_id).toBe('owner-legado');
    expect(normalized.amount).toBe(900);
    expect(normalized.observacoes).toBe('Observação legada');
    expect(normalized.description).toBe('Observação legada');
  });

  it('permite fallback para aliases quando o canônico está undefined', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'undefined-fallback',
      amount: undefined,
      valor: 900,
      customerId: undefined,
      cliente_id: 'customer-legado',
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.valor).toBe(900);
    expect(normalized.customerId).toBe('customer-legado');
    expect(normalized.cliente_id).toBe('customer-legado');
  });

  it('trata null no canônico como ausência e mantém a semântica atual de fallback', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'null-fallback',
      amount: null,
      valor: 900,
      description: null,
      observacoes: 'Observação legada',
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.valor).toBe(900);
    expect(normalized.observacoes).toBe('Observação legada');
    expect(normalized.amount).toBe(900);
    expect(normalized.description).toBe('Observação legada');
  });

  it('não gera strings literais null ou undefined nos aliases espelhados', () => {
    const normalized = normalizeOpportunityWorkspace({
      id: 'null-mirror',
      customerId: null,
      productId: undefined,
      ownerId: null,
      description: undefined,
      etapa_id: 'novo_lead',
    }, {
      stageCatalog,
    });

    expect(normalized.cliente_id).toBeNull();
    expect(normalized.produto_id).toBeNull();
    expect(normalized.responsavel_id).toBeNull();
    expect(normalized.observacoes).toBe('');
  });

  it('não muta o objeto de entrada', () => {
    const input = {
      id: '5',
      cliente_nome: 'Input original',
      amount: 0,
      valor: 900,
      customerId: 'customer-oficial',
      cliente_id: 'customer-legado',
      etapa_id: 'novo_lead',
      tags: ['vip'],
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    normalizeOpportunityWorkspace(input, { stageCatalog });

    expect(input).toEqual(snapshot);
  });
});

describe('opportunity workspace API builders', () => {
  const createCanonicalViewModel = () => normalizeOpportunityWorkspace({
    id: 'vm-1',
    title: 'Oportunidade Canonica',
    amount: 1500,
    valor: 900,
    pipelineId: 'pipeline-oficial',
    pipeline_id: 'pipeline-legado',
    stageId: 'negociacao',
    stage_id: 'stage-legado',
    customerId: 'customer-oficial',
    cliente_id: 'customer-legado',
    productId: 'product-oficial',
    produto_id: 'product-legado',
    ownerId: 'owner-oficial',
    responsavel_id: 'owner-legado',
    status: 'ativo',
    description: 'Descrição oficial',
    observacoes: 'Descrição legada',
    cliente_nome: 'Cliente Canonico',
    responsavel_nome: 'Owner Canonico',
    produto: 'Produto Canonico',
    leadId: 'lead-10',
  }, {
    stageCatalog,
    pipelineLabel: 'Pipeline Oficial',
  });

  it('buildCreateOpportunityPayload produz o DTO oficial usando o ViewModel canônico', () => {
    const viewModel = createCanonicalViewModel();
    const snapshot = JSON.parse(JSON.stringify(viewModel));

    const payload = buildCreateOpportunityPayload(viewModel, {
      catalog: {
        subproductId: 'subproduct-oficial',
        modalityId: 'modality-oficial',
      },
      overrides: {
        expectedCloseDate: '2026-12-31',
      },
    });

    expect(payload).toEqual({
      title: 'Oportunidade Canonica',
      amount: 1500,
      pipelineId: 'pipeline-oficial',
      stageId: 'negociacao',
      productId: 'product-oficial',
      subproductId: 'subproduct-oficial',
      modalityId: 'modality-oficial',
      customerId: 'customer-oficial',
      leadId: 'lead-10',
      ownerId: 'owner-oficial',
      description: 'Descrição oficial',
      expectedCloseDate: '2026-12-31',
    });
    expect(viewModel).toEqual(snapshot);
  });

  it('buildCreateOpportunityIntakePayload consolida customer e opportunity em uma única camada', () => {
    const viewModel = createCanonicalViewModel();
    const payload = buildCreateOpportunityIntakePayload(viewModel, {
      catalog: {
        subproductId: 'subproduct-oficial',
        modalityId: 'modality-oficial',
      },
      customer: {
        id: 'customer-oficial',
        fullName: 'Cliente Canonico',
        email: 'cliente@example.com',
        cpfCnpj: '12345678900',
        phone: '11999990000',
        birthDate: null,
        documentType: 'CPF',
        address: null,
        bankData: null,
        profession: null,
        maritalStatus: null,
        gender: null,
      },
      options: {
        allowCreateCustomer: true,
        updateExistingCustomer: false,
      },
    });

    expect(payload).toEqual({
      customer: {
        id: 'customer-oficial',
        firstName: 'Cliente',
        lastName: 'Canonico',
        email: 'cliente@example.com',
        cpfCnpj: '12345678900',
        phone: '11999990000',
        birthDate: null,
        documentType: 'CPF',
        address: null,
        bankData: null,
        profession: null,
        maritalStatus: null,
        gender: null,
      },
      opportunity: {
        title: 'Oportunidade Canonica',
        amount: 1500,
        pipelineId: 'pipeline-oficial',
        stageId: 'negociacao',
        productId: 'product-oficial',
        subproductId: 'subproduct-oficial',
        modalityId: 'modality-oficial',
        ownerId: 'owner-oficial',
        description: 'Descrição oficial',
      },
      options: {
        allowCreateCustomer: true,
        updateExistingCustomer: false,
      },
    });
  });

  it('buildUpdateOpportunityPayload envia apenas os campos selecionados e ignora aliases divergentes', () => {
    const viewModel = createCanonicalViewModel();

    const payload = buildUpdateOpportunityPayload(viewModel, {
      catalog: {
        subproductId: 'subproduct-oficial',
        modalityId: 'modality-oficial',
      },
      include: ['title', 'amount', 'customerId', 'ownerId', 'productId', 'subproductId', 'modalityId', 'status', 'description'],
    });

    expect(payload).toEqual({
      title: 'Oportunidade Canonica',
      amount: 1500,
      customerId: 'customer-oficial',
      ownerId: 'owner-oficial',
      productId: 'product-oficial',
      subproductId: 'subproduct-oficial',
      modalityId: 'modality-oficial',
      status: 'ativo',
      description: 'Descrição oficial',
    });
  });

  it('buildUpdateOpportunityPayload preserva zero, omite undefined e não gera strings literais de null', () => {
    const viewModel = normalizeOpportunityWorkspace({
      id: 'vm-zero',
      title: 'Zero',
      amount: 0,
      customerId: null,
      ownerId: null,
      productId: null,
      description: '',
      stageId: 'novo_lead',
      pipelineId: 'pipeline-oficial',
    }, {
      stageCatalog,
    });

    const payload = buildUpdateOpportunityPayload(viewModel, {
      include: ['amount', 'customerId', 'ownerId', 'productId', 'description'],
    });

    expect(payload).toEqual({
      amount: 0,
      productId: null,
      description: '',
    });
    expect(String(payload)).not.toContain('undefined');
    expect(String(payload)).not.toContain('null');
  });

  it('buildMoveStagePayload centraliza a tradução de stageId e pipelineId', () => {
    const viewModel = createCanonicalViewModel();
    const snapshot = JSON.parse(JSON.stringify(viewModel));

    const payload = buildMoveStagePayload(viewModel, {
      stageId: 'stage-destino',
      pipelineId: 'pipeline-destino',
    });

    expect(payload).toEqual({
      stageId: 'stage-destino',
      pipelineId: 'pipeline-destino',
    });
    expect(viewModel).toEqual(snapshot);
  });

  it('buildOpportunityEnvelopeUpdatePayload centraliza patches auxiliares sem mutar a entrada', () => {
    const input = {
      envelopeId: 'env-1',
      envelopeStatus: 'sent',
      envelopeUrl: 'https://example.com/sign',
      envelopeProvider: 'clicksign',
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    const payload = buildOpportunityEnvelopeUpdatePayload(input);

    expect(payload).toEqual({
      envelopeId: 'env-1',
      envelopeStatus: 'sent',
      envelopeUrl: 'https://example.com/sign',
      envelopeProvider: 'clicksign',
    });
    expect(input).toEqual(snapshot);
  });
});

describe('mergeOpportunityWorkspace', () => {
  it('prioriza backend sobre snapshot local', () => {
    const backend = {
      id: '10',
      source: 'backend',
      cliente_nome: 'Backend primeiro',
      etapa_id: 'negociacao',
      updatedAt: '2026-07-28T10:00:00.000Z',
    };
    const snapshot = {
      id: '10',
      source: 'snapshot',
      cliente_nome: 'Snapshot depois',
      etapa_id: 'pendencia',
      updatedAt: '2026-07-29T10:00:00.000Z',
    };

    const merged = mergeOpportunityWorkspace(backend, snapshot, { stageCatalog });

    expect(merged?.source).toBe('backend');
    expect(merged?.persisted.clienteNome).toBe('Backend primeiro');
    expect(merged?.stageLabel).toBe('Negociação');
  });
});

describe('buildOpportunityWorkspaceUpdatePayload', () => {
  it('remove campos derivados do payload de atualização', () => {
    const payload = buildOpportunityWorkspaceUpdatePayload({
      nome: 'Ana',
      cliente_nome: 'Ana',
      telefone: '(11) 99999-0000',
      celular: '(11) 99999-0000',
      email: 'ana@example.com',
      cpf_cnpj: '12345678900',
      tipoPessoa: 'CPF',
      produto: 'Crédito Consignado',
      valor: 12000,
      etapa_id: 'negociacao',
      status: 'ativo',
      tags: ['vip'],
      displayId: 'L-9999',
      stageLabel: 'Negociação',
      pipelineLabel: 'Consignado',
      formattedValue: 'R$ 12.000,00',
      initials: 'AS',
      source: 'snapshot',
    }, {
      etapaId: 'negociacao',
      status: 'ativo',
    });

    expect(payload.etapa_id).toBe('negociacao');
    expect(payload.status).toBe('ativo');
    expect(payload.nome).toBe('Ana');
    expect((payload as Record<string, unknown>).displayId).toBeUndefined();
    expect((payload as Record<string, unknown>).stageLabel).toBeUndefined();
    expect((payload as Record<string, unknown>).pipelineLabel).toBeUndefined();
    expect((payload as Record<string, unknown>).formattedValue).toBeUndefined();
    expect((payload as Record<string, unknown>).initials).toBeUndefined();
  });
});

describe('resolveOpportunityWorkspaceMutationId', () => {
  it('não aceita displayId nem IDs técnicos de lead/customer como ID remoto da oportunidade', () => {
    expect(resolveOpportunityWorkspaceMutationId({
      id: 'a1e2f3d4-1111-2222-3333-444455556666',
      displayId: '42',
    })).toBeNull();

    expect(resolveOpportunityWorkspaceMutationId({
      id: 'a1e2f3d4-1111-2222-3333-444455556666',
      leadId: 77,
    })).toBeNull();

    expect(resolveOpportunityWorkspaceMutationId({
      id: 'a1e2f3d4-1111-2222-3333-444455556666',
      customerId: 88,
    })).toBeNull();
  });

  it('aceita opportunityId numérico e id numérico compatível', () => {
    expect(resolveOpportunityWorkspaceMutationId({
      id: 'a1e2f3d4-1111-2222-3333-444455556666',
      opportunityId: 42,
    })).toBe(42);

    expect(resolveOpportunityWorkspaceMutationId({
      id: 42,
    })).toBe(42);
  });

  it('rejeita displayId isolado', () => {
    expect(resolveOpportunityWorkspaceMutationId({
      displayId: 42,
    })).toBeNull();
  });

  it('valida IDs remotos seguros e positivos na API', () => {
    expect(resolveOpportunityWorkspaceApiMutationId(1)).toBe(1);
    expect(resolveOpportunityWorkspaceApiMutationId('7')).toBe(7);

    const invalidValues = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '0', '-1', '1.5', 'abc123', '42abc', 'a1e2f3d4-1111-2222-3333-444455556666'];
    for (const value of invalidValues) {
      expect(resolveOpportunityWorkspaceApiMutationId(value)).toBeNull();
    }
  });
});

describe('persistOpportunityWorkspaceMutation', () => {
  it('não chama commit local quando o backend falha', async () => {
    const onSuccess = vi.fn();
    const updateRemote = vi.fn().mockRejectedValue(new Error('backend indisponível'));

    const result = await persistOpportunityWorkspaceMutation({
      mutationId: 42,
      payload: { status: 'ativo' },
      updateRemote,
      onSuccess,
    });

    expect(result).toBe('failed');
    expect(updateRemote).toHaveBeenCalledWith(42, { status: 'ativo' });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('não chama commit local quando o ID remoto é inválido', async () => {
    const onSuccess = vi.fn();
    const updateRemote = vi.fn();

    const result = await persistOpportunityWorkspaceMutation({
      mutationId: 'L-0042',
      payload: { status: 'ativo' },
      updateRemote,
      onSuccess,
    });

    expect(result).toBe('failed');
    expect(updateRemote).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
