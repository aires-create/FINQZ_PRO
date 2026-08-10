import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OportunidadesPage from '../pages/Oportunidades';
import useAppStore from '../store';
import { opportunitiesApi } from '../api/modules/opportunities.api';

const navigateMock = vi.hoisted(() => vi.fn());
const moveStageMock = vi.hoisted(() => vi.fn());
const opportunityGetAllMock = vi.hoisted(() => vi.fn());
const pipelinesGetAllMock = vi.hoisted(() => vi.fn());
const masterCatalogGetTreeMock = vi.hoisted(() => vi.fn());
const usuariosGetAllMock = vi.hoisted(() => vi.fn());
const partnersGetAllMock = vi.hoisted(() => vi.fn());
const clientesSearchMock = vi.hoisted(() => vi.fn());
const clientesGetByIdMock = vi.hoisted(() => vi.fn());
const runShadowExecutionMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../hooks/useTenantFilter', () => ({
  useTenantFilter: vi.fn((data) => data || []),
}));

vi.mock('../features/simulation-runtime/hooks/useSimulationRuntimeShadow', () => ({
  useSimulationRuntimeShadow: () => ({
    flags: {
      shadowEnabled: false,
      remoteEvidenceEnabled: false,
      evidenceEnabled: false,
    },
    lastComparison: null,
    lastResponse: null,
    lastError: null,
    status: 'disabled',
    runShadowExecution: runShadowExecutionMock,
  }),
}));

vi.mock('../api/modules/opportunities.api', () => ({
  opportunitiesApi: {
    getAll: opportunityGetAllMock,
    getById: vi.fn(),
    create: vi.fn(),
    createIntake: vi.fn(),
    update: vi.fn(),
    moveStage: moveStageMock,
    delete: vi.fn(),
  },
}));

vi.mock('../api/modules/pipelines.api', () => ({
  pipelinesApi: {
    getAll: pipelinesGetAllMock,
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    deletePipeline: vi.fn(),
    createStage: vi.fn(),
    updateStage: vi.fn(),
    deleteStage: vi.fn(),
    reorderStages: vi.fn(),
  },
}));

vi.mock('../api/modules/master-catalog.api', () => ({
  masterCatalogApi: {
    getCatalogTree: masterCatalogGetTreeMock,
    listProducts: vi.fn(),
    listSubproductsByProduct: vi.fn(),
    listModalitiesBySubproduct: vi.fn(),
  },
}));

vi.mock('../api/modules/usuarios.api', () => ({
  usuariosApi: {
    getAll: usuariosGetAllMock,
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

vi.mock('../api/modules/partners.api', () => ({
  partnersApi: {
    getAll: partnersGetAllMock,
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../api/modules/clientes.api', () => ({
  clientesApi: {
    getAll: vi.fn(),
    getById: clientesGetByIdMock,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: clientesSearchMock,
    getAuditLogs: vi.fn(),
  },
}));

const pipelineId = '11111111-1111-4111-8111-111111111111';
const stageNovoLeadId = '22222222-2222-4222-8222-222222222222';
const stageNegociacaoId = '33333333-3333-4333-8333-333333333333';

const officialPipeline = {
  id: pipelineId,
  name: 'Consignado',
  stages: [
    {
      id: stageNovoLeadId,
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
    },
    {
      id: stageNegociacaoId,
      name: 'Negociação',
      order: 2,
      isWon: false,
      isLost: false,
    },
  ],
};

const buildOpportunity = (overrides: Record<string, unknown> = {}) => ({
  id: '44444444-4444-4444-8444-444444444444',
  title: 'João Silva',
  amount: 5000,
  produto: 'Consignado',
  status: 'open',
  pipelineId,
  stageId: stageNovoLeadId,
  pipeline: { name: 'Consignado' },
  stage: { name: 'Novo Lead', order: 1 },
  customer: {
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999990000',
  },
  email: 'joao@example.com',
  telefone: '11999990000',
  cpf_cnpj: '12345678900',
  createdAt: '2026-07-30T10:00:00.000Z',
  updatedAt: '2026-07-30T12:00:00.000Z',
  __officialApiSource: true,
  ...overrides,
});

const buildLegacyOpportunity = (overrides: Record<string, unknown> = {}) => ({
  id: '55555555-5555-4555-8555-555555555555',
  title: 'Legacy Lead',
  amount: 7800,
  produto: 'Consignado',
  status: 'open',
  pipelineId,
  stageId: stageNegociacaoId,
  pipeline: { name: 'Consignado' },
  stage: { name: 'Negociação', order: 2 },
  customerName: 'Legacy Lead',
  telefone: '11988887777',
  email: 'legacy@example.com',
  cpf_cnpj: '98765432100',
  createdAt: '2026-07-29T09:00:00.000Z',
  updatedAt: '2026-07-29T11:00:00.000Z',
  ...overrides,
});

const setupWorkspace = async (opportunities: Array<Record<string, unknown>>) => {
  window.localStorage.clear();
  navigateMock.mockReset();
  opportunityGetAllMock.mockReset();
  pipelinesGetAllMock.mockReset();
  masterCatalogGetTreeMock.mockReset();
  usuariosGetAllMock.mockReset();
  partnersGetAllMock.mockReset();
  clientesSearchMock.mockReset();
  clientesGetByIdMock.mockReset();
  runShadowExecutionMock.mockReset();
  moveStageMock.mockReset();

  useAppStore.setState({
    user: {
      id: 'user-1',
      nome: 'Aires Fernandes',
      email: 'aires@example.com',
      role: 'admin',
      permissions: ['*'],
      tenant_id: 'tenant-1',
    } as never,
    userPermissions: {
      '*': ['*'],
    } as never,
    theme: 'dark',
  } as never);

  usuariosGetAllMock.mockResolvedValue([
    {
      id: 'user-1',
      nome: 'Aires Fernandes',
      status: 'ativo',
    },
  ]);
  masterCatalogGetTreeMock.mockResolvedValue({
    segments: [],
    products: [],
  });
  opportunityGetAllMock.mockResolvedValue({
    success: true,
    data: opportunities,
  });
  pipelinesGetAllMock.mockResolvedValue([officialPipeline]);
  partnersGetAllMock.mockResolvedValue({ success: true, data: [] });
  clientesSearchMock.mockResolvedValue([]);
  clientesGetByIdMock.mockResolvedValue(null);

  render(
    <MemoryRouter initialEntries={['/app/crm/oportunidades']}>
      <OportunidadesPage />
    </MemoryRouter>,
  );

  await waitFor(() => expect(pipelinesGetAllMock).toHaveBeenCalledTimes(1), { timeout: 10000 });
  await waitFor(() => expect(opportunityGetAllMock).toHaveBeenCalledTimes(1), { timeout: 10000 });
  const firstOpportunityLabel = String(
    opportunities[0]?.title ??
      opportunities[0]?.nome ??
      opportunities[0]?.cliente_nome ??
      'Oportunidade',
  );
  await screen.findByText(firstOpportunityLabel, {}, { timeout: 10000 });
};

describe('Oportunidades - regressão funcional do card', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('abre, fecha e reabre o mesmo card no modal fullscreen', async () => {
    await setupWorkspace([buildOpportunity()]);

    const card = screen.getByText('João Silva').closest('[role="button"]');
    expect(card).not.toBeNull();

    fireEvent.click(card as HTMLElement);

    await waitFor(() => expect(screen.getByRole('button', { name: /Voltar ao Kanban/i })).toBeInTheDocument(), { timeout: 10000 });
    const modalRoot = document.body.querySelector('div.fixed.inset-0.z-50.flex.flex-col.bg-gray-50.overflow-hidden') as HTMLElement | null;
    expect(modalRoot).not.toBeNull();
    expect(within(modalRoot as HTMLElement).getByText('Novo Lead')).toBeInTheDocument();
    expect(within(modalRoot as HTMLElement).getByText('Cliente').parentElement).toHaveTextContent('João Silva');

    fireEvent.click(screen.getByRole('button', { name: /Voltar ao Kanban/i }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /Voltar ao Kanban/i })).not.toBeInTheDocument());

    fireEvent.click(card as HTMLElement);
    await waitFor(() => expect(screen.getByRole('button', { name: /Voltar ao Kanban/i })).toBeInTheDocument(), { timeout: 10000 });
    const reopenedModalRoot = document.body.querySelector('div.fixed.inset-0.z-50.flex.flex-col.bg-gray-50.overflow-hidden') as HTMLElement | null;
    expect(reopenedModalRoot).not.toBeNull();
    expect(within(reopenedModalRoot as HTMLElement).getByText('Novo Lead')).toBeInTheDocument();
    expect(within(reopenedModalRoot as HTMLElement).getByText('Cliente').parentElement).toHaveTextContent('João Silva');
  }, 20000);

  it('impede que ações internas abram o workspace e preserva a navegação do cliente', async () => {
    await setupWorkspace([buildOpportunity()]);

    const phoneLink = screen.getByTitle('Ligar');
    const whatsappLink = screen.getByTitle('WhatsApp');
    const emailLink = screen.getByTitle('E-mail');
    const clientButton = screen.getByTitle('Cliente');

    expect(phoneLink).toHaveAttribute('href', 'tel:11999990000');
    expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/5511999990000');
    expect(emailLink).toHaveAttribute('href', 'mailto:joao@example.com');

    fireEvent.click(phoneLink);
    fireEvent.click(whatsappLink);
    fireEvent.click(emailLink);

    expect(screen.queryByRole('button', { name: /Voltar ao Kanban/i })).not.toBeInTheDocument();

    fireEvent.click(clientButton);
    expect(navigateMock).toHaveBeenCalledWith('/app/crm/clientes?search=joao%40example.com');
    expect(screen.queryByRole('button', { name: /Voltar ao Kanban/i })).not.toBeInTheDocument();
  });

  it('troca corretamente entre cards de etapas diferentes sem deixar estado residual', async () => {
    await setupWorkspace([
      buildOpportunity(),
      buildLegacyOpportunity({
        id: '66666666-6666-4666-8666-666666666666',
        title: 'Maria Santos',
        customer: {
          name: 'Maria Santos',
          email: 'maria@example.com',
          phone: '11977776666',
        },
        email: 'maria@example.com',
        telefone: '11977776666',
        cpf_cnpj: '11222333000199',
        stageId: stageNegociacaoId,
        stage: { name: 'Negociação', order: 2 },
        customerName: 'Maria Santos',
      }),
    ]);

    const firstCard = screen.getByText('João Silva').closest('[role="button"]');
    expect(firstCard).not.toBeNull();
    fireEvent.click(firstCard as HTMLElement);

    await waitFor(() => expect(screen.getByRole('button', { name: /Voltar ao Kanban/i })).toBeInTheDocument(), { timeout: 10000 });
    const firstModalRoot = document.body.querySelector('div.fixed.inset-0.z-50.flex.flex-col.bg-gray-50.overflow-hidden') as HTMLElement | null;
    expect(firstModalRoot).not.toBeNull();
    expect(within(firstModalRoot as HTMLElement).getByText('Novo Lead')).toBeInTheDocument();
    expect(within(firstModalRoot as HTMLElement).getByText('Cliente').parentElement).toHaveTextContent('João Silva');

    fireEvent.click(screen.getByRole('button', { name: /Voltar ao Kanban/i }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /Voltar ao Kanban/i })).not.toBeInTheDocument());

    const secondCard = screen.getByText('Maria Santos').closest('[role="button"]');
    expect(secondCard).not.toBeNull();
    fireEvent.click(secondCard as HTMLElement);

    await waitFor(() => expect(screen.getByRole('button', { name: /Voltar ao Kanban/i })).toBeInTheDocument(), { timeout: 10000 });
    const secondModalRoot = document.body.querySelector('div.fixed.inset-0.z-50.flex.flex-col.bg-gray-50.overflow-hidden') as HTMLElement | null;
    expect(secondModalRoot).not.toBeNull();
    expect(within(secondModalRoot as HTMLElement).getByText('Negociação')).toBeInTheDocument();
    expect(within(secondModalRoot as HTMLElement).getByText('Cliente').parentElement).toHaveTextContent('Maria Santos');
  });

  it('reconcilia o card e o workspace aberto após a resposta persistida de moveStage', async () => {
    await setupWorkspace([buildOpportunity(), buildLegacyOpportunity({
      id: '66666666-6666-4666-8666-666666666666',
      title: 'Maria Santos',
      customer: {
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11977776666',
      },
      email: 'maria@example.com',
      telefone: '11977776666',
      cpf_cnpj: '11222333000199',
      stageId: stageNegociacaoId,
      stage: { name: 'Negociação', order: 2 },
      customerName: 'Maria Santos',
    })]);

    const card = Array.from(screen.getAllByRole('button')).find((button) => {
      const text = button.textContent ?? '';
      return text.includes('João Silva') && button.getAttribute('draggable') === 'true';
    }) as HTMLElement | undefined;
    expect(card).toBeDefined();

    fireEvent.click(card as HTMLElement);

    await waitFor(() => expect(screen.getByRole('button', { name: /Voltar ao Kanban/i })).toBeInTheDocument(), { timeout: 10000 });

    const dataTransfer = {
      setData: vi.fn((key: string, value: string) => {
        dataTransfer[key] = value;
      }),
      getData: vi.fn((key: string) => dataTransfer[key] || ''),
      effectAllowed: '',
      dropEffect: '',
    } as unknown as DataTransfer;
    dataTransfer.setData('text/plain', '44444444-4444-4444-8444-444444444444');

    moveStageMock.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        id: '44444444-4444-4444-8444-444444444444',
        title: 'João Silva',
        amount: 5000,
        status: 'open',
        pipelineId,
        stageId: stageNegociacaoId,
        leadId: 'lead-1',
        customerId: 'customer-1',
        tenantId: 'tenant-1',
        createdAt: '2026-07-30T10:00:00.000Z',
        updatedAt: '2026-07-30T12:00:00.000Z',
        pipeline: { id: pipelineId, name: 'Consignado' },
        stage: { id: stageNegociacaoId, name: 'Negociação', order: 2 },
        customer: { id: 'customer-1', name: 'João Silva', email: 'joao@example.com', phone: '11999990000' },
      },
    });

    const dropTarget = screen.getByTestId('kanban-column-33333333-3333-4333-8333-333333333333') as HTMLElement;

    fireEvent.dragStart(card as HTMLElement, { dataTransfer });
    fireEvent.dragOver(dropTarget, { dataTransfer });
    fireEvent.drop(dropTarget, { dataTransfer });

    await waitFor(() => expect(moveStageMock).toHaveBeenCalledTimes(1), { timeout: 15000 });
    await waitFor(() => expect(screen.getByRole('button', { name: /Voltar ao Kanban/i })).toBeInTheDocument(), { timeout: 15000 });
    expect(screen.getAllByText('João Silva').length).toBeGreaterThan(0);
  }, 20000);

  it('abre um card com payload parcial e continua exibindo o label canônico da etapa', async () => {
    await setupWorkspace([
      buildOpportunity({
        id: '77777777-7777-4777-8777-777777777777',
        title: 'Payload Parcial',
        customer: {
          name: 'Payload Parcial',
        },
        customerName: 'Payload Parcial',
        telefone: '',
        email: '',
        cpf_cnpj: '00011122233',
        stageId: '',
        stage: { name: 'Novo Lead', order: 1 },
      }),
    ]);

    const card = screen.getByText('Payload Parcial').closest('[role="button"]');
    expect(card).not.toBeNull();

    fireEvent.click(card as HTMLElement);

    await waitFor(() => expect(screen.getByRole('button', { name: /Voltar ao Kanban/i })).toBeInTheDocument(), { timeout: 10000 });
    const partialModalRoot = document.body.querySelector('div.fixed.inset-0.z-50.flex.flex-col.bg-gray-50.overflow-hidden') as HTMLElement | null;
    expect(partialModalRoot).not.toBeNull();
    expect(within(partialModalRoot as HTMLElement).getByText('Novo Lead')).toBeInTheDocument();
    expect(within(partialModalRoot as HTMLElement).getByText('Cliente').parentElement).toHaveTextContent('Payload Parcial');
  });
});
