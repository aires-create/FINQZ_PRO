import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllMock = vi.hoisted(() => vi.fn());
const deleteStageMock = vi.hoisted(() => vi.fn());

vi.mock('../api/modules/pipelines.api', () => ({
  pipelinesApi: {
    getAll: getAllMock,
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    deletePipeline: vi.fn(),
    createStage: vi.fn(),
    updateStage: vi.fn(),
    deleteStage: deleteStageMock,
    reorderStages: vi.fn(),
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
      ],
      stageColors: ['#2563eb'],
    },
  ]),
  buildCreatePipelinePayload: vi.fn(),
  buildUpdatePipelinePayload: vi.fn(),
  buildCreateStagePayload: vi.fn(),
  buildUpdateStagePayload: vi.fn(),
  buildReorderStagesPayload: vi.fn(),
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

describe('admin pipelines stage archive modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens archive modal and calls deleteStage on confirm', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] });
    deleteStageMock.mockResolvedValueOnce({});

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Qualificação')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Arquivar etapa Qualificação' }));

    expect(screen.getByText('Arquivar esta etapa?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar arquivamento' }));

    await waitFor(() => {
      expect(deleteStageMock).toHaveBeenCalledWith('stage-1');
    });
  });

  it('does not call deleteStage when cancelled', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] });

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Qualificação')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Arquivar etapa Qualificação' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(deleteStageMock).not.toHaveBeenCalled();
  });

  it('shows backend error message returned by deleteStage failure', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] });
    deleteStageMock.mockRejectedValueOnce({
      status: 409,
      message: 'Default pipeline cannot be archived',
      body: { error: { message: 'Default pipeline cannot be archived' } },
    });

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Qualificação')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Arquivar etapa Qualificação' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar arquivamento' }));

    await waitFor(() => {
      expect(screen.getByText('Default pipeline cannot be archived')).toBeTruthy();
    });
  });
});
