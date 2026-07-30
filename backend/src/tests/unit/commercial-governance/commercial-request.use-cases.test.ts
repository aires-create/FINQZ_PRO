import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApproveCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/approve-commercial-request.contract.js';
import type { CloseCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/close-commercial-request.contract.js';
import type { CreateCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/create-commercial-request.contract.js';
import type { GetCommercialRequestByIdInput } from '../../../modules/commercial-governance/requests/contracts/get-commercial-request-by-id.contract.js';
import type { ListCommercialRequestsInput } from '../../../modules/commercial-governance/requests/contracts/list-commercial-requests.contract.js';
import type { RejectCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/reject-commercial-request.contract.js';
import type { SubmitCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/submit-commercial-request.contract.js';
import { CommercialRequestStatus } from '../../../modules/commercial-governance/requests/enums/commercial-request-status.enum.js';
import type { CommercialRequestService } from '../../../modules/commercial-governance/requests/interfaces/commercial-request-service.interface.js';
import type { CommercialRequest } from '../../../modules/commercial-governance/requests/types/commercial-request.types.js';
import { ApproveCommercialRequestUseCase } from '../../../modules/commercial-governance/requests/use-cases/approve-commercial-request.use-case.js';
import { CloseCommercialRequestUseCase } from '../../../modules/commercial-governance/requests/use-cases/close-commercial-request.use-case.js';
import { CreateCommercialRequestUseCase } from '../../../modules/commercial-governance/requests/use-cases/create-commercial-request.use-case.js';
import { GetCommercialRequestByIdUseCase } from '../../../modules/commercial-governance/requests/use-cases/get-commercial-request-by-id.use-case.js';
import { ListCommercialRequestsUseCase } from '../../../modules/commercial-governance/requests/use-cases/list-commercial-requests.use-case.js';
import { RejectCommercialRequestUseCase } from '../../../modules/commercial-governance/requests/use-cases/reject-commercial-request.use-case.js';
import { SubmitCommercialRequestUseCase } from '../../../modules/commercial-governance/requests/use-cases/submit-commercial-request.use-case.js';

type MockCommercialRequestService = {
  [Method in keyof CommercialRequestService]: ReturnType<typeof vi.fn>;
};

const commercialRequest: CommercialRequest = {
  id: 'request-1',
  tenantId: 'tenant-1',
  requestNumber: 'CR-TENANT-2026-000001',
  status: CommercialRequestStatus.Draft,
  requestedByUserId: 'user-1',
  requestedAt: '2026-05-31T12:00:00.000Z',
  reason: 'Campaign update',
  justification: 'Commercial condition needs approval',
  createdAt: '2026-05-31T12:00:00.000Z',
  updatedAt: '2026-05-31T12:00:00.000Z',
};

const createInput: CreateCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestedByUserId: 'user-1',
  reason: 'Campaign update',
  justification: 'Commercial condition needs approval',
};

const submitInput: SubmitCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
  submittedByUserId: 'user-2',
};

const approveInput: ApproveCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
  approvedByUserId: 'user-3',
};

const rejectInput: RejectCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
  rejectedByUserId: 'user-3',
};

const closeInput: CloseCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
  closedByUserId: 'user-4',
};

const getByIdInput: GetCommercialRequestByIdInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
};

const listInput: ListCommercialRequestsInput = {
  tenantId: 'tenant-1',
  page: 1,
  pageSize: 20,
};

const createServiceMock = (): MockCommercialRequestService => ({
  createCommercialRequest: vi.fn(),
  submitCommercialRequest: vi.fn(),
  approveCommercialRequest: vi.fn(),
  rejectCommercialRequest: vi.fn(),
  closeCommercialRequest: vi.fn(),
  getCommercialRequestById: vi.fn(),
  listCommercialRequests: vi.fn(),
});

describe('CommercialRequest use cases', () => {
  let service: MockCommercialRequestService;

  beforeEach(() => {
    service = createServiceMock();
  });

  it('CreateCommercialRequestUseCase delegates to service and returns its result', async () => {
    service.createCommercialRequest.mockResolvedValueOnce(commercialRequest);
    const useCase = new CreateCommercialRequestUseCase(
      service as unknown as CommercialRequestService,
    );

    const result = await useCase.execute(createInput);

    expect(service.createCommercialRequest).toHaveBeenCalledWith(createInput);
    expect(result).toBe(commercialRequest);
  });

  it('SubmitCommercialRequestUseCase delegates to service and returns its result', async () => {
    const submittedRequest = {
      ...commercialRequest,
      status: CommercialRequestStatus.Submitted,
    };
    service.submitCommercialRequest.mockResolvedValueOnce(submittedRequest);
    const useCase = new SubmitCommercialRequestUseCase(
      service as unknown as CommercialRequestService,
    );

    const result = await useCase.execute(submitInput);

    expect(service.submitCommercialRequest).toHaveBeenCalledWith(submitInput);
    expect(result).toBe(submittedRequest);
  });

  it('ApproveCommercialRequestUseCase delegates to service and returns its result', async () => {
    const approvedRequest = {
      ...commercialRequest,
      status: CommercialRequestStatus.Approved,
    };
    service.approveCommercialRequest.mockResolvedValueOnce(approvedRequest);
    const useCase = new ApproveCommercialRequestUseCase(
      service as unknown as CommercialRequestService,
    );

    const result = await useCase.execute(approveInput);

    expect(service.approveCommercialRequest).toHaveBeenCalledWith(approveInput);
    expect(result).toBe(approvedRequest);
  });

  it('RejectCommercialRequestUseCase delegates to service and returns its result', async () => {
    const rejectedRequest = {
      ...commercialRequest,
      status: CommercialRequestStatus.Rejected,
    };
    service.rejectCommercialRequest.mockResolvedValueOnce(rejectedRequest);
    const useCase = new RejectCommercialRequestUseCase(
      service as unknown as CommercialRequestService,
    );

    const result = await useCase.execute(rejectInput);

    expect(service.rejectCommercialRequest).toHaveBeenCalledWith(rejectInput);
    expect(result).toBe(rejectedRequest);
  });

  it('CloseCommercialRequestUseCase delegates to service and returns its result', async () => {
    const closedRequest = {
      ...commercialRequest,
      status: CommercialRequestStatus.Closed,
    };
    service.closeCommercialRequest.mockResolvedValueOnce(closedRequest);
    const useCase = new CloseCommercialRequestUseCase(
      service as unknown as CommercialRequestService,
    );

    const result = await useCase.execute(closeInput);

    expect(service.closeCommercialRequest).toHaveBeenCalledWith(closeInput);
    expect(result).toBe(closedRequest);
  });

  it('GetCommercialRequestByIdUseCase delegates to service and returns its result', async () => {
    service.getCommercialRequestById.mockResolvedValueOnce(commercialRequest);
    const useCase = new GetCommercialRequestByIdUseCase(
      service as unknown as CommercialRequestService,
    );

    const result = await useCase.execute(getByIdInput);

    expect(service.getCommercialRequestById).toHaveBeenCalledWith(getByIdInput);
    expect(result).toBe(commercialRequest);
  });

  it('ListCommercialRequestsUseCase delegates to service and returns its result', async () => {
    const listResult = {
      items: [commercialRequest],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    service.listCommercialRequests.mockResolvedValueOnce(listResult);
    const useCase = new ListCommercialRequestsUseCase(
      service as unknown as CommercialRequestService,
    );

    const result = await useCase.execute(listInput);

    expect(service.listCommercialRequests).toHaveBeenCalledWith(listInput);
    expect(result).toBe(listResult);
  });

  it('propagates service errors', async () => {
    const error = new Error('Commercial request not found');
    service.getCommercialRequestById.mockRejectedValueOnce(error);
    const useCase = new GetCommercialRequestByIdUseCase(
      service as unknown as CommercialRequestService,
    );

    await expect(useCase.execute(getByIdInput)).rejects.toThrow(error);
  });
});
