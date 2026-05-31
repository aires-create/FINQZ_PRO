import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '../../../modules/commercial-governance/requests/repositories/commercial-request.prisma.repository.js',
  () => ({
    commercialRequestPrismaRepository: {},
  }),
);

import type { CreateCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/create-commercial-request.contract.js';
import type { ApproveCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/approve-commercial-request.contract.js';
import type { CloseCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/close-commercial-request.contract.js';
import type { GetCommercialRequestByIdInput } from '../../../modules/commercial-governance/requests/contracts/get-commercial-request-by-id.contract.js';
import type { ListCommercialRequestsInput } from '../../../modules/commercial-governance/requests/contracts/list-commercial-requests.contract.js';
import type { RejectCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/reject-commercial-request.contract.js';
import type { SubmitCommercialRequestInput } from '../../../modules/commercial-governance/requests/contracts/submit-commercial-request.contract.js';
import {
  CommercialRequestAlreadyClosedError,
  CommercialRequestNotSubmittedError,
  InvalidCommercialRequestTransitionError,
} from '../../../modules/commercial-governance/requests/domain/commercial-request-domain-errors.js';
import { CommercialRequestStatus } from '../../../modules/commercial-governance/requests/enums/commercial-request-status.enum.js';
import type { CommercialRequestRepository } from '../../../modules/commercial-governance/requests/interfaces/commercial-request.repository.interface.js';
import type { RequestNumberGenerator } from '../../../modules/commercial-governance/requests/interfaces/request-number-generator.interface.js';
import { CommercialRequestService } from '../../../modules/commercial-governance/requests/services/commercial-request.service.js';
import type { CommercialRequest } from '../../../modules/commercial-governance/requests/types/commercial-request.types.js';

type MockCommercialRequestRepository = {
  [Method in keyof CommercialRequestRepository]: ReturnType<typeof vi.fn>;
};

type MockRequestNumberGenerator = {
  [Method in keyof RequestNumberGenerator]: ReturnType<typeof vi.fn>;
};

const baseRequest: CommercialRequest = {
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

const getByIdInput: GetCommercialRequestByIdInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
};

const listInput: ListCommercialRequestsInput = {
  tenantId: 'tenant-1',
  filters: {
    status: CommercialRequestStatus.Draft,
  },
  page: 1,
  pageSize: 20,
};

const submitInput: SubmitCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
  submittedByUserId: 'user-2',
  submittedAt: '2026-05-31T12:30:00.000Z',
};

const approveInput: ApproveCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
  approvedByUserId: 'user-3',
  approvedAt: '2026-05-31T13:00:00.000Z',
};

const rejectInput: RejectCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
  rejectedByUserId: 'user-3',
  rejectedAt: '2026-05-31T13:00:00.000Z',
};

const closeInput: CloseCommercialRequestInput = {
  tenantId: 'tenant-1',
  requestId: 'request-1',
  closedByUserId: 'user-4',
  closedAt: '2026-05-31T14:00:00.000Z',
};

const createRepositoryMock = (): MockCommercialRequestRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  list: vi.fn(),
  submit: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  close: vi.fn(),
});

const createRequestNumberGeneratorMock = (): MockRequestNumberGenerator => ({
  next: vi.fn(),
});

const createUniqueConstraintError = (target: string[]) => ({
  code: 'P2002',
  meta: {
    target,
  },
});

describe('CommercialRequestService', () => {
  let repository: MockCommercialRequestRepository;
  let requestNumberGenerator: MockRequestNumberGenerator;
  let service: CommercialRequestService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T12:00:00.000Z'));
    repository = createRepositoryMock();
    requestNumberGenerator = createRequestNumberGeneratorMock();
    requestNumberGenerator.next.mockResolvedValue({
      requestNumber: 'CR-TENANT-2026-000001',
      year: 2026,
      sequence: 1,
    });
    service = new CommercialRequestService(
      repository as unknown as CommercialRequestRepository,
      requestNumberGenerator as unknown as RequestNumberGenerator,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createCommercialRequest', () => {
    it('generates server-owned fields, calls repository.create, and returns its result', async () => {
      repository.create.mockResolvedValueOnce(baseRequest);

      const result = await service.createCommercialRequest(createInput);

      expect(requestNumberGenerator.next).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        requestedAt: new Date('2026-05-31T12:00:00.000Z'),
      });
      expect(repository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        requestNumber: 'CR-TENANT-2026-000001',
        year: 2026,
        sequence: 1,
        status: CommercialRequestStatus.Draft,
        requestedByUserId: 'user-1',
        requestedAt: '2026-05-31T12:00:00.000Z',
        reason: 'Campaign update',
        justification: 'Commercial condition needs approval',
      });
      expect(result).toBe(baseRequest);
    });

    it('retries when request number unique constraint fails and creates with a regenerated number', async () => {
      const regeneratedRequest: CommercialRequest = {
        ...baseRequest,
        requestNumber: 'CR-TENANT-2026-000002',
      };
      requestNumberGenerator.next
        .mockResolvedValueOnce({
          requestNumber: 'CR-TENANT-2026-000001',
          year: 2026,
          sequence: 1,
        })
        .mockResolvedValueOnce({
          requestNumber: 'CR-TENANT-2026-000002',
          year: 2026,
          sequence: 2,
        });
      repository.create
        .mockRejectedValueOnce(
          createUniqueConstraintError(['tenantId', 'requestNumber']),
        )
        .mockResolvedValueOnce(regeneratedRequest);

      const result = await service.createCommercialRequest(createInput);

      expect(requestNumberGenerator.next).toHaveBeenCalledTimes(2);
      expect(repository.create).toHaveBeenCalledTimes(2);
      expect(repository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          requestNumber: 'CR-TENANT-2026-000002',
          year: 2026,
          sequence: 2,
        }),
      );
      expect(result).toBe(regeneratedRequest);
    });

    it('retries when year and sequence unique constraint fails', async () => {
      requestNumberGenerator.next
        .mockResolvedValueOnce({
          requestNumber: 'CR-TENANT-2026-000001',
          year: 2026,
          sequence: 1,
        })
        .mockResolvedValueOnce({
          requestNumber: 'CR-TENANT-2026-000002',
          year: 2026,
          sequence: 2,
        });
      repository.create
        .mockRejectedValueOnce(
          createUniqueConstraintError(['tenantId', 'year', 'sequence']),
        )
        .mockResolvedValueOnce(baseRequest);

      await service.createCommercialRequest(createInput);

      expect(requestNumberGenerator.next).toHaveBeenCalledTimes(2);
      expect(repository.create).toHaveBeenCalledTimes(2);
    });

    it('propagates non-unique create errors without retrying', async () => {
      const error = new Error('database unavailable');
      repository.create.mockRejectedValueOnce(error);

      await expect(service.createCommercialRequest(createInput)).rejects.toThrow(
        error,
      );
      expect(requestNumberGenerator.next).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledTimes(1);
    });

    it('respects the create retry limit', async () => {
      repository.create.mockRejectedValue(
        createUniqueConstraintError(['tenantId', 'year', 'sequence']),
      );

      await expect(service.createCommercialRequest(createInput)).rejects.toMatchObject({
        code: 'P2002',
      });
      expect(requestNumberGenerator.next).toHaveBeenCalledTimes(5);
      expect(repository.create).toHaveBeenCalledTimes(5);
    });
  });

  describe('getCommercialRequestById', () => {
    it('calls repository.findById and returns its result', async () => {
      repository.findById.mockResolvedValueOnce(baseRequest);

      const result = await service.getCommercialRequestById(getByIdInput);

      expect(repository.findById).toHaveBeenCalledWith(getByIdInput);
      expect(result).toBe(baseRequest);
    });
  });

  describe('listCommercialRequests', () => {
    it('calls repository.list and returns its result', async () => {
      const listResult = {
        items: [baseRequest],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      repository.list.mockResolvedValueOnce(listResult);

      const result = await service.listCommercialRequests(listInput);

      expect(repository.list).toHaveBeenCalledWith(listInput);
      expect(result).toBe(listResult);
    });
  });

  describe('submitCommercialRequest', () => {
    it('validates Draft -> Submitted, calls repository.submit, and returns submitted request', async () => {
      const submittedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Submitted,
      };
      repository.findById.mockResolvedValueOnce(baseRequest);
      repository.submit.mockResolvedValueOnce(submittedRequest);

      const result = await service.submitCommercialRequest(submitInput);

      expect(repository.findById).toHaveBeenCalledWith(getByIdInput);
      expect(repository.submit).toHaveBeenCalledWith(submitInput);
      expect(result).toBe(submittedRequest);
    });

    it('throws when request does not exist', async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(
        service.submitCommercialRequest(submitInput),
      ).rejects.toThrow('Commercial request not found');
      expect(repository.submit).not.toHaveBeenCalled();
      expect(repository.approve).not.toHaveBeenCalled();
      expect(repository.reject).not.toHaveBeenCalled();
      expect(repository.close).not.toHaveBeenCalled();
    });

    it('throws CommercialRequestAlreadyClosedError when request is already Closed', async () => {
      repository.findById.mockResolvedValueOnce({
        ...baseRequest,
        status: CommercialRequestStatus.Closed,
      });

      await expect(
        service.submitCommercialRequest(submitInput),
      ).rejects.toThrow(CommercialRequestAlreadyClosedError);
      expect(repository.submit).not.toHaveBeenCalled();
    });

    it('throws a domain transition error when request is Approved', async () => {
      repository.findById.mockResolvedValueOnce({
        ...baseRequest,
        status: CommercialRequestStatus.Approved,
      });

      await expect(
        service.submitCommercialRequest(submitInput),
      ).rejects.toThrow(InvalidCommercialRequestTransitionError);
      expect(repository.submit).not.toHaveBeenCalled();
    });
  });

  describe('approveCommercialRequest', () => {
    it('validates Submitted -> Approved, calls repository.approve, and returns approved request', async () => {
      const submittedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Submitted,
      };
      const approvedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Approved,
      };
      repository.findById.mockResolvedValueOnce(submittedRequest);
      repository.approve.mockResolvedValueOnce(approvedRequest);

      const result = await service.approveCommercialRequest(approveInput);

      expect(repository.findById).toHaveBeenCalledWith(getByIdInput);
      expect(repository.approve).toHaveBeenCalledWith(approveInput);
      expect(result).toBe(approvedRequest);
    });

    it('throws CommercialRequestNotSubmittedError when Draft cannot approve', async () => {
      repository.findById.mockResolvedValueOnce(baseRequest);

      await expect(
        service.approveCommercialRequest(approveInput),
      ).rejects.toThrow(CommercialRequestNotSubmittedError);
      expect(repository.approve).not.toHaveBeenCalled();
    });
  });

  describe('rejectCommercialRequest', () => {
    it('validates Submitted -> Rejected, calls repository.reject, and returns rejected request', async () => {
      const submittedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Submitted,
      };
      const rejectedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Rejected,
      };
      repository.findById.mockResolvedValueOnce(submittedRequest);
      repository.reject.mockResolvedValueOnce(rejectedRequest);

      const result = await service.rejectCommercialRequest(rejectInput);

      expect(repository.findById).toHaveBeenCalledWith(getByIdInput);
      expect(repository.reject).toHaveBeenCalledWith(rejectInput);
      expect(result).toBe(rejectedRequest);
    });

    it('throws CommercialRequestAlreadyClosedError when Closed cannot change', async () => {
      repository.findById.mockResolvedValueOnce({
        ...baseRequest,
        status: CommercialRequestStatus.Closed,
      });

      await expect(
        service.rejectCommercialRequest(rejectInput),
      ).rejects.toThrow(CommercialRequestAlreadyClosedError);
      expect(repository.reject).not.toHaveBeenCalled();
    });
  });

  describe('closeCommercialRequest', () => {
    it('validates Approved -> Closed, calls repository.close, and returns closed request', async () => {
      const approvedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Approved,
      };
      const closedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Closed,
      };
      repository.findById.mockResolvedValueOnce(approvedRequest);
      repository.close.mockResolvedValueOnce(closedRequest);

      const result = await service.closeCommercialRequest(closeInput);

      expect(repository.findById).toHaveBeenCalledWith(getByIdInput);
      expect(repository.close).toHaveBeenCalledWith(closeInput);
      expect(result).toBe(closedRequest);
    });

    it('validates Rejected -> Closed, calls repository.close, and returns closed request', async () => {
      const rejectedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Rejected,
      };
      const closedRequest: CommercialRequest = {
        ...baseRequest,
        status: CommercialRequestStatus.Closed,
      };
      repository.findById.mockResolvedValueOnce(rejectedRequest);
      repository.close.mockResolvedValueOnce(closedRequest);

      const result = await service.closeCommercialRequest(closeInput);

      expect(repository.findById).toHaveBeenCalledWith(getByIdInput);
      expect(repository.close).toHaveBeenCalledWith(closeInput);
      expect(result).toBe(closedRequest);
    });

    it('throws a domain transition error when Draft cannot close', async () => {
      repository.findById.mockResolvedValueOnce(baseRequest);

      await expect(
        service.closeCommercialRequest(closeInput),
      ).rejects.toThrow(InvalidCommercialRequestTransitionError);
      expect(repository.close).not.toHaveBeenCalled();
    });
  });
});
