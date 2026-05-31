import type {
  CommercialRequest as PrismaCommercialRequest,
  Prisma,
} from '@prisma/client';

import { prisma } from '../../../../core/prisma/client.js';
import type {
  CreateCommercialRequestPersistenceInput,
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
import { CommercialRequestStatus } from '../enums/commercial-request-status.enum.js';
import type { CommercialRequestRepository } from '../interfaces/commercial-request.repository.interface.js';
import type { CommercialRequest } from '../types/commercial-request.types.js';

type CommercialRequestPrismaClient = typeof prisma | Prisma.TransactionClient;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const toDate = (value?: string): Date => {
  return value ? new Date(value) : new Date();
};

const toCommercialRequest = (
  request: PrismaCommercialRequest,
): CommercialRequest => ({
  id: request.id,
  tenantId: request.tenantId,
  requestNumber: request.requestNumber,
  status: request.status as CommercialRequestStatus,
  requestedByUserId: request.requestedByUserId,
  requestedAt: request.requestedAt.toISOString(),
  reason: request.reason,
  justification: request.justification,
  createdAt: request.createdAt.toISOString(),
  updatedAt: request.updatedAt.toISOString(),
});

const buildListWhere = (
  input: ListCommercialRequestsInput,
): Prisma.CommercialRequestWhereInput => {
  const where: Prisma.CommercialRequestWhereInput = {
    tenantId: input.tenantId,
  };

  if (input.filters?.status) {
    where.status = input.filters.status;
  }

  return where;
};

type CommercialRequestStatusUpdateInput = {
  tenantId: string;
  requestId: string;
};

export class CommercialRequestPrismaRepository
  implements CommercialRequestRepository
{
  constructor(
    private readonly client: CommercialRequestPrismaClient = prisma,
  ) {}

  async create(
    input: CreateCommercialRequestPersistenceInput,
  ): Promise<CreateCommercialRequestResult> {
    const request = await this.client.commercialRequest.create({
      data: {
        tenantId: input.tenantId,
        requestNumber: input.requestNumber,
        year: input.year,
        sequence: input.sequence,
        status: input.status,
        requestedByUserId: input.requestedByUserId,
        requestedAt: toDate(input.requestedAt),
        reason: input.reason,
        justification: input.justification,
      },
    });

    return toCommercialRequest(request);
  }

  async findById(
    input: GetCommercialRequestByIdInput,
  ): Promise<GetCommercialRequestByIdResult> {
    const request = await this.client.commercialRequest.findFirst({
      where: {
        id: input.requestId,
        tenantId: input.tenantId,
      },
    });

    return request ? toCommercialRequest(request) : null;
  }

  async list(
    input: ListCommercialRequestsInput,
  ): Promise<ListCommercialRequestsResult> {
    const page = input.page ?? DEFAULT_PAGE;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;
    const where = buildListWhere(input);

    const [items, total] = await Promise.all([
      this.client.commercialRequest.findMany({
        where,
        orderBy: {
          requestedAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.client.commercialRequest.count({
        where,
      }),
    ]);

    return {
      items: items.map(toCommercialRequest),
      total,
      page,
      pageSize,
    };
  }

  async submit(
    input: SubmitCommercialRequestInput,
  ): Promise<SubmitCommercialRequestResult> {
    return this.updateStatus(input, CommercialRequestStatus.Submitted);
  }

  async approve(
    input: ApproveCommercialRequestInput,
  ): Promise<ApproveCommercialRequestResult> {
    return this.updateStatus(input, CommercialRequestStatus.Approved);
  }

  async reject(
    input: RejectCommercialRequestInput,
  ): Promise<RejectCommercialRequestResult> {
    return this.updateStatus(input, CommercialRequestStatus.Rejected);
  }

  async close(
    input: CloseCommercialRequestInput,
  ): Promise<CloseCommercialRequestResult> {
    return this.updateStatus(input, CommercialRequestStatus.Closed);
  }

  private async updateStatus(
    input: CommercialRequestStatusUpdateInput,
    status: CommercialRequestStatus,
  ): Promise<CommercialRequest> {
    await this.client.commercialRequest.updateMany({
      where: {
        id: input.requestId,
        tenantId: input.tenantId,
      },
      data: {
        status,
      },
    });

    const request = await this.client.commercialRequest.findFirstOrThrow({
      where: {
        id: input.requestId,
        tenantId: input.tenantId,
      },
    });

    return toCommercialRequest(request);
  }
}

export const commercialRequestPrismaRepository =
  new CommercialRequestPrismaRepository();
