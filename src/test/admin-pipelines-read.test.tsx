import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllMock = vi.hoisted(() => vi.fn());

vi.mock('../api/modules/pipelines.api', () => ({
  pipelinesApi: {
    getAll: getAllMock,
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    deletePipeline: vi.fn(),
    createStage: vi.fn(),
    updateStage: vi.fn(),
    deleteStage: vi.fn(),
    reorderStages: vi.fn(),
  },
}));

vi.mock('../pages/admin/pipelines.adapter', () => ({
  mapOfficialPipelinesToAdminViewModels: vi.fn(() => []),
  buildCreatePipelinePayload: vi.fn(),
  buildUpdatePipelinePayload: vi.fn(),
  buildCreateStagePayload: vi.fn(),
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

describe('admin pipelines read contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads pipelines with includeInactive=true', async () => {
    getAllMock.mockResolvedValueOnce({ data: [] });

    render(<PipelinesPage />);

    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalledWith({ includeInactive: true });
    });
  });
});
