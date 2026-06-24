import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllMock = vi.hoisted(() => vi.fn());

vi.mock('../api/modules/pipelines.api', () => ({
  pipelinesApi: {
    getAll: getAllMock,
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    deletePipeline: vi.fn(),
    createStage: vi.fn(),
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
          stageId: 'stage-active',
          pipelineId: 'pipeline-1',
          name: 'Qualificação',
          order: 1,
          isWon: false,
          isLost: false,
          isActive: true,
          color: '#2563eb',
        },
        {
          stageId: 'stage-inactive',
          pipelineId: 'pipeline-1',
          name: 'Proposta',
          order: 2,
          isWon: false,
          isLost: false,
          isActive: false,
          color: '#0ea5e9',
        },
      ],
      stageColors: ['#2563eb', '#0ea5e9'],
    },
  ]),
  buildCreatePipelinePayload: vi.fn(),
  buildUpdatePipelinePayload: vi.fn(),
  buildCreateStagePayload: vi.fn(),
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

describe('admin pipelines stage lifecycle visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active and inactive badges for stages', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] });

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(screen.getByText('Ativa')).toBeTruthy();
      expect(screen.getByText('Inativa')).toBeTruthy();
    });
  });
});
