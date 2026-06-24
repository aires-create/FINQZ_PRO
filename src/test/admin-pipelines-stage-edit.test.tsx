import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllMock = vi.hoisted(() => vi.fn());
const updateStageMock = vi.hoisted(() => vi.fn());

vi.mock('../api/modules/pipelines.api', () => ({
  pipelinesApi: {
    getAll: getAllMock,
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    deletePipeline: vi.fn(),
    createStage: vi.fn(),
    updateStage: updateStageMock,
    deleteStage: vi.fn(),
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
  buildUpdateStagePayload: vi.fn((draft) => ({
    ...(draft.name !== undefined ? { name: draft.name } : {}),
    ...(draft.order !== undefined ? { order: draft.order } : {}),
    ...(draft.isWon !== undefined ? { isWon: draft.isWon } : {}),
    ...(draft.isLost !== undefined ? { isLost: draft.isLost } : {}),
    ...(draft.isActive !== undefined ? { isActive: draft.isActive } : {}),
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
  Input: ({
    label,
    value,
    onChange,
    type = 'text',
    disabled,
  }: {
    label: string;
    value?: string | number;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    type?: string;
    disabled?: boolean;
  }) => (
    <label>
      {label}
      <input aria-label={label} type={type} value={value} onChange={onChange} disabled={disabled} />
    </label>
  ),
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
  TextArea: () => null,
  Toggle: ({ checked, onChange, disabled }: { checked?: boolean; onChange?: (value: boolean) => void; disabled?: boolean }) => (
    <input
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(event) => onChange?.(event.target.checked)}
      disabled={disabled}
    />
  ),
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

describe('admin pipelines stage edit modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens edit modal and sends updateStage payload including isActive, name and order', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] });
    updateStageMock.mockResolvedValueOnce({});

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Qualificação')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Editar etapa Qualificação' }));

    expect(screen.getByText('Etapa selecionada')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Prospecção' } });
    fireEvent.change(screen.getByLabelText('Ordem'), { target: { value: '3' } });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(updateStageMock).toHaveBeenCalledWith('stage-1', {
        name: 'Prospecção',
        order: 3,
        isWon: false,
        isLost: false,
        isActive: false,
      });
    });
  });
});
