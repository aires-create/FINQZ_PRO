import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllMock = vi.hoisted(() => vi.fn());
const reorderStagesMock = vi.hoisted(() => vi.fn());

vi.mock('../api/modules/pipelines.api', () => ({
  pipelinesApi: {
    getAll: getAllMock,
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    deletePipeline: vi.fn(),
    createStage: vi.fn(),
    updateStage: vi.fn(),
    deleteStage: vi.fn(),
    reorderStages: reorderStagesMock,
  },
}));

vi.mock('../pages/admin/pipelines.adapter', () => ({
  mapOfficialPipelinesToAdminViewModels: vi.fn(() => [
    {
      pipelineId: 'pipeline-1',
      pipelineName: 'Pipeline Oficial',
      description: null,
      active: true,
      isDefault: false,
      stages: [
        {
          stageId: 'stage-1',
          pipelineId: 'pipeline-1',
          name: 'Qualificação',
          order: 1,
          isWon: false,
          isLost: false,
          isActive: true,
          color: '#2563eb',
        },
        {
          stageId: 'stage-2',
          pipelineId: 'pipeline-1',
          name: 'Proposta',
          order: 2,
          isWon: false,
          isLost: false,
          isActive: true,
          color: '#0ea5e9',
        },
        {
          stageId: 'stage-3',
          pipelineId: 'pipeline-1',
          name: 'Fechamento',
          order: 3,
          isWon: false,
          isLost: false,
          isActive: false,
          color: '#7c3aed',
        },
      ],
      stageColors: ['#2563eb', '#0ea5e9', '#7c3aed'],
    },
  ]),
  buildCreatePipelinePayload: vi.fn(),
  buildUpdatePipelinePayload: vi.fn(),
  buildCreateStagePayload: vi.fn(),
  buildUpdateStagePayload: vi.fn(),
  buildReorderStagesPayload: vi.fn((stages) => ({
    stages,
  })),
}));

vi.mock('../components/layout/PageHeader', () => ({
  PageHeader: () => null,
}));

vi.mock('../components/ui', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Input: () => null,
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
  TextArea: () => null,
  Toggle: () => null,
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => null,
  CheckCircle2: () => null,
  Pencil: () => null,
  RefreshCw: () => null,
  Trash2: () => null,
  TrendingUp: () => null,
}));

import { PipelinesPage } from '../pages/admin/Pipelines';

describe('admin pipelines stage reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enters reorder mode, moves a stage locally, and saves the full payload', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
    reorderStagesMock.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Oficial')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reordenar etapas' }));

    expect(screen.getByText('Reordenação local ativa')).toBeTruthy();

    const initialRows = Array.from(
      document.querySelectorAll('[data-testid^="reorder-stage-row-"]'),
    );
    expect(initialRows[0]?.getAttribute('data-testid')).toBe('reorder-stage-row-stage-1');

    fireEvent.click(screen.getByRole('button', { name: 'Mover etapa Qualificação para baixo' }));

    const movedRows = Array.from(
      document.querySelectorAll('[data-testid^="reorder-stage-row-"]'),
    );
    expect(movedRows[0]?.getAttribute('data-testid')).toBe('reorder-stage-row-stage-2');
    expect(movedRows[1]?.getAttribute('data-testid')).toBe('reorder-stage-row-stage-1');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar ordem' }));

    await waitFor(() => {
      expect(reorderStagesMock).toHaveBeenCalledWith('pipeline-1', {
        stages: [
          { stageId: 'stage-2', order: 1 },
          { stageId: 'stage-1', order: 2 },
          { stageId: 'stage-3', order: 3 },
        ],
      });
    });

    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalledTimes(2);
    });
  });

  it('cancels reorder without calling the API', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] });

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Oficial')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reordenar etapas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mover etapa Qualificação para baixo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(reorderStagesMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Reordenação local ativa')).toBeNull();
    expect(screen.getByRole('button', { name: 'Editar etapa Qualificação' })).toBeTruthy();
  });

  it('shows API errors and keeps the user in control', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] });
    reorderStagesMock.mockRejectedValueOnce({
      status: 409,
      message: 'Stage order conflict',
      body: { error: { message: 'Stage order conflict' } },
    });

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Oficial')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reordenar etapas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mover etapa Qualificação para baixo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar ordem' }));

    await waitFor(() => {
      expect(screen.getByText('Stage order conflict')).toBeTruthy();
    });

    expect(screen.getByText('Reordenação local ativa')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salvar ordem' })).toBeTruthy();
  });
});
