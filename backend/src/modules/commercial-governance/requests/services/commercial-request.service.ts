import type {
  CreateCommercialRequestInput,
  CreateCommercialRequestResult,
} from '../contracts/create-commercial-request.contract.js';
import type {
  ApproveCommercialRequestInput,
  ApproveCommercialRequestResult,
} from '../contracts/approve-commercial-request.contract.js';
import type {
  CloseCommercialRequestInput,
  CloseCommercialRequestResult,
} from '../contracts/close-commercial-request.contract.js';
import type {
  GetCommercialRequestByIdInput,
  GetCommercialRequestByIdResult,
} from '../contracts/get-commercial-request-by-id.contract.js';
import type {
  ListCommercialRequestsInput,
  ListCommercialRequestsResult,
} from '../contracts/list-commercial-requests.contract.js';
import type {
  RejectCommercialRequestInput,
  RejectCommercialRequestResult,
} from '../contracts/reject-commercial-request.contract.js';
import type {
  SubmitCommercialRequestInput,
  SubmitCommercialRequestResult,
} from '../contracts/submit-commercial-request.contract.js';
import { validateCommercialRequestTransition } from '../domain/commercial-request-transition-validator.js';
import { CommercialRequestStatus } from '../enums/commercial-request-status.enum.js';
import { commercialRequestNumberGenerator } from '../generators/commercial-request-number.generator.js';
import type { CommercialRequestRepository } from '../interfaces/commercial-request.repository.interface.js';
import type { RequestNumberGenerator } from '../interfaces/request-number-generator.interface.js';
import type { CommercialRequestService as CommercialRequestServiceInterface } from '../interfaces/commercial-request-service.interface.js';
import { commercialRequestPrismaRepository } from '../repositories/commercial-request.prisma.repository.js';
import type { CommercialRequest } from '../types/commercial-request.types.js';

const MAX_CREATE_ATTEMPTS = 5;
const UNIQUE_CONSTRAINT_CODE = 'P2002';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isCommercialRequestNumberUniqueConstraintError = (
  error: unknown,
): boolean => {
  if (!isRecord(error) || error.code !== UNIQUE_CONSTRAINT_CODE) {
    return false;
  }

  const meta = isRecord(error.meta) ? error.meta : undefined;
  const target = meta?.target;

  if (typeof target === 'string') {
    return (
      target.includes('requestNumber') ||
      target.includes('year_sequence')
    );
  }

  if (!isStringArray(target)) {
    return false;
  }

  const targetFields = new Set(target);

  return (
    (targetFields.has('tenantId') && targetFields.has('requestNumber')) ||
    (targetFields.has('tenantId') &&
      targetFields.has('year') &&
      targetFields.has('sequence'))
  );
};

export class CommercialRequestService
  implements CommercialRequestServiceInterface
{
  constructor(
    private readonly repository: CommercialRequestRepository =
      commercialRequestPrismaRepository,
    private readonly requestNumberGenerator: RequestNumberGenerator =
      commercialRequestNumberGenerator,
  ) {}

  async createCommercialRequest(
    input: CreateCommercialRequestInput,
  ): Promise<CreateCommercialRequestResult> {
    const requestedAt = new Date();

    for (let attempt = 1; attempt <= MAX_CREATE_ATTEMPTS; attempt += 1) {
      const generatedRequestNumber = await this.requestNumberGenerator.next({
        tenantId: input.tenantId,
        requestedAt,
      });

      try {
        return await this.repository.create({
          tenantId: input.tenantId,
          requestNumber: generatedRequestNumber.requestNumber,
          year: generatedRequestNumber.year,
          sequence: generatedRequestNumber.sequence,
          status: CommercialRequestStatus.Draft,
          requestedByUserId: input.requestedByUserId,
          requestedAt: requestedAt.toISOString(),
          reason: input.reason,
          justification: input.justification,
        });
      } catch (error) {
        if (
          !isCommercialRequestNumberUniqueConstraintError(error) ||
          attempt === MAX_CREATE_ATTEMPTS
        ) {
          throw error;
        }
      }
    }

    throw new Error('Unable to generate commercial request number');
  }

  getCommercialRequestById(
    input: GetCommercialRequestByIdInput,
  ): Promise<GetCommercialRequestByIdResult> {
    return this.repository.findById(input);
  }

  listCommercialRequests(
    input: ListCommercialRequestsInput,
  ): Promise<ListCommercialRequestsResult> {
    return this.repository.list(input);
  }

  async submitCommercialRequest(
    input: SubmitCommercialRequestInput,
  ): Promise<SubmitCommercialRequestResult> {
    await this.validateTransition(input, CommercialRequestStatus.Submitted);

    return this.repository.submit(input);
  }

  async approveCommercialRequest(
    input: ApproveCommercialRequestInput,
  ): Promise<ApproveCommercialRequestResult> {
    await this.validateTransition(input, CommercialRequestStatus.Approved);

    return this.repository.approve(input);
  }

  async rejectCommercialRequest(
    input: RejectCommercialRequestInput,
  ): Promise<RejectCommercialRequestResult> {
    await this.validateTransition(input, CommercialRequestStatus.Rejected);

    return this.repository.reject(input);
  }

  async closeCommercialRequest(
    input: CloseCommercialRequestInput,
  ): Promise<CloseCommercialRequestResult> {
    await this.validateTransition(input, CommercialRequestStatus.Closed);

    return this.repository.close(input);
  }

  private async validateTransition(
    input: { tenantId: string; requestId: string },
    targetStatus: CommercialRequestStatus,
  ): Promise<CommercialRequest> {
    const request = await this.repository.findById({
      tenantId: input.tenantId,
      requestId: input.requestId,
    });

    if (!request) {
      throw new Error('Commercial request not found');
    }

    validateCommercialRequestTransition(request.status, targetStatus);

    return request;
  }
}

export const commercialRequestService = new CommercialRequestService();
