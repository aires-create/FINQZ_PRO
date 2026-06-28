import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Partner } from '@prisma/client';

import type { PartnerRepositoryContract } from '../../../modules/partners/repositories/partner.repository.contract.js';
import {
  PartnerCodeAlreadyExistsError,
  PartnerHierarchyDepthExceededError,
  PartnerInvalidHierarchyError,
  PartnerInvalidStatusError,
  PartnerNotFoundError,
  PartnerSoftDeleteBlockedByChildrenError,
} from '../../../modules/partners/services/partner.errors.js';
import { PartnerService } from '../../../modules/partners/services/partner.service.js';

const auditServiceMock = vi.hoisted(() => ({
  registerAuditLog: vi.fn(),
}));

vi.mock('../../../modules/audit/services/audit.service.js', () => auditServiceMock);

const createRepositoryMock = (): PartnerRepositoryContract & {
  findById: ReturnType<typeof vi.fn>;
  findByCode: ReturnType<typeof vi.fn>;
  listByTenant: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  softDelete: ReturnType<typeof vi.fn>;
  countActiveChildren: ReturnType<typeof vi.fn>;
} => ({
  findById: vi.fn(),
  findByCode: vi.fn(),
  listByTenant: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  countActiveChildren: vi.fn(),
});

const basePartner = {
  id: 'partner-1',
  tenantId: 'tenant-a',
  code: 'PARTNER-001',
  name: 'Partner One',
  type: 'COMPANY',
  document: null,
  email: null,
  phone: null,
  status: 'ativo',
  deletedAt: null,
  createdAt: new Date('2026-06-20T00:00:00.000Z'),
  updatedAt: new Date('2026-06-20T00:00:00.000Z'),
  parentId: null,
} satisfies Partner;

const franchisePartner = {
  ...basePartner,
  id: 'partner-2',
  code: 'PARTNER-002',
  type: 'FRANQUIA',
  parentId: 'partner-1',
} satisfies Partner;

const franchiseePartner = {
  ...basePartner,
  id: 'partner-3',
  code: 'PARTNER-003',
  type: 'FRANQUEADO',
  parentId: 'partner-2',
} satisfies Partner;

describe('PartnerService', () => {
  const tenantId = 'tenant-a';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listPartners requires tenantId and delegates to repository', async () => {
    const repository = createRepositoryMock();
    const listSpy = vi.mocked(repository.listByTenant);
    listSpy.mockResolvedValueOnce({
      data: [basePartner],
      total: 1,
      page: 1,
      limit: 20,
    });
    const service = new PartnerService(repository);

    const result = await service.listPartners({
      tenantId,
      page: 1,
      limit: 20,
      status: 'ativo',
    });

    expect(listSpy).toHaveBeenCalledWith({
      tenantId,
      page: 1,
      limit: 20,
      status: 'ativo',
    });
    expect(result).toEqual({
      data: [basePartner],
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it('listPartners rejects missing tenantId', async () => {
    const service = new PartnerService(createRepositoryMock());

    await expect(
      service.listPartners({
        tenantId: ' ',
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it('getPartnerById throws PartnerNotFoundError when not found', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findById).mockResolvedValueOnce(null);
    const service = new PartnerService(repository);

    await expect(
      service.getPartnerById({
        tenantId,
        partnerId: 'missing',
      }),
    ).rejects.toBeInstanceOf(PartnerNotFoundError);
  });

  it('createPartner blocks duplicate code', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findByCode).mockResolvedValueOnce(basePartner);
    const service = new PartnerService(repository);

    await expect(
      service.createPartner({
        tenantId,
        code: 'PARTNER-001',
        name: 'Partner One',
        type: 'COMPANY',
        status: 'ativo',
      }),
    ).rejects.toBeInstanceOf(PartnerCodeAlreadyExistsError);
  });

  it('createPartner registers audit log', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);
    vi.mocked(repository.findById)
      .mockResolvedValueOnce(basePartner)
      .mockResolvedValueOnce(franchisePartner)
      .mockResolvedValueOnce(franchiseePartner);
    vi.mocked(repository.create).mockResolvedValueOnce(basePartner);
    const service = new PartnerService(repository);

    const result = await service.createPartner({
      tenantId,
      actorUserId: 'user-1',
      code: 'PARTNER-010',
      name: 'Partner Ten',
      type: 'COMPANY',
      status: 'ativo',
    });

    expect(result).toBe(basePartner);
    expect(auditServiceMock.registerAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        userId: 'user-1',
        action: 'PARTNER_CREATED',
        entity: 'Partner',
        entityId: basePartner.id,
      }),
    );
  });

  it('createPartner validates canonical status', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);
    const service = new PartnerService(repository);

    await expect(
      service.createPartner({
        tenantId,
        code: 'PARTNER-004',
        name: 'Partner Four',
        type: 'COMPANY',
        status: 'invalid' as never,
      }),
    ).rejects.toBeInstanceOf(PartnerInvalidStatusError);
  });

  it('createPartner blocks COMPANY with parentId', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);
    const service = new PartnerService(repository);

    await expect(
      service.createPartner({
        tenantId,
        code: 'PARTNER-004',
        name: 'Partner Four',
        type: 'COMPANY',
        status: 'ativo',
        parentId: 'partner-1',
      }),
    ).rejects.toBeInstanceOf(PartnerInvalidHierarchyError);
  });

  it('createPartner requires COMPANY parent for FRANQUIA', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);
    vi.mocked(repository.findById).mockResolvedValueOnce({
      ...basePartner,
      id: 'partner-parent',
      type: 'FRANQUEADO',
      parentId: null,
    } satisfies Partner);
    const service = new PartnerService(repository);

    await expect(
      service.createPartner({
        tenantId,
        code: 'PARTNER-004',
        name: 'Partner Four',
        type: 'FRANQUIA',
        status: 'ativo',
        parentId: 'partner-3',
      }),
    ).rejects.toBeInstanceOf(PartnerInvalidHierarchyError);
  });

  it('createPartner requires FRANQUIA parent for FRANQUEADO', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);
    vi.mocked(repository.findById).mockResolvedValueOnce(basePartner);
    const service = new PartnerService(repository);

    await expect(
      service.createPartner({
        tenantId,
        code: 'PARTNER-004',
        name: 'Partner Four',
        type: 'FRANQUEADO',
        status: 'ativo',
        parentId: 'partner-1',
      }),
    ).rejects.toBeInstanceOf(PartnerInvalidHierarchyError);
  });

  it('createPartner blocks hierarchy deeper than 3 levels', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);
    vi.mocked(repository.findById)
      .mockResolvedValueOnce({
        ...basePartner,
        id: 'partner-parent',
        type: 'COMPANY',
        parentId: 'partner-ancestor-1',
      } satisfies Partner)
      .mockResolvedValueOnce({
        ...basePartner,
        id: 'partner-ancestor-1',
        type: 'FRANQUIA',
        parentId: 'partner-ancestor-2',
      } satisfies Partner)
      .mockResolvedValueOnce({
        ...basePartner,
        id: 'partner-ancestor-2',
        type: 'FRANQUEADO',
        parentId: null,
      } satisfies Partner);
    const service = new PartnerService(repository);

    await expect(
      service.createPartner({
        tenantId,
        code: 'PARTNER-004',
        name: 'Partner Four',
        type: 'FRANQUIA',
        status: 'ativo',
        parentId: 'partner-parent',
      }),
    ).rejects.toBeInstanceOf(PartnerHierarchyDepthExceededError);
  });

  it('updatePartner blocks parentId equal to own id', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findById).mockResolvedValueOnce(basePartner);
    const service = new PartnerService(repository);

    await expect(
      service.updatePartner({
        tenantId,
        partnerId: 'partner-1',
        parentId: 'partner-1',
      }),
    ).rejects.toBeInstanceOf(PartnerInvalidHierarchyError);
  });

  it('updatePartner allows keeping the same code', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findById)
      .mockResolvedValueOnce(basePartner)
      .mockResolvedValueOnce(basePartner);
    vi.mocked(repository.update).mockResolvedValueOnce({ count: 1 });
    const service = new PartnerService(repository);

    const result = await service.updatePartner({
      tenantId,
      partnerId: 'partner-1',
      code: 'PARTNER-001',
      name: 'Partner One Updated',
    });

    expect(repository.findByCode).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith({
      tenantId,
      partnerId: 'partner-1',
      data: {
        code: 'PARTNER-001',
        name: 'Partner One Updated',
      },
    });
    expect(result).toBe(basePartner);
    expect(auditServiceMock.registerAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        userId: null,
        action: 'PARTNER_UPDATED',
        entity: 'Partner',
        entityId: basePartner.id,
      }),
    );
  });

  it('updatePartner blocks duplicate code from another partner', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findById).mockResolvedValueOnce(basePartner);
    vi.mocked(repository.findByCode).mockResolvedValueOnce({
      ...basePartner,
      id: 'partner-99',
    } satisfies Partner);
    const service = new PartnerService(repository);

    await expect(
      service.updatePartner({
        tenantId,
        partnerId: 'partner-1',
        code: 'PARTNER-XYZ',
      }),
    ).rejects.toBeInstanceOf(PartnerCodeAlreadyExistsError);
  });

  it('softDeletePartner blocks if there are active children', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findById).mockResolvedValueOnce(basePartner);
    vi.mocked(repository.countActiveChildren).mockResolvedValueOnce(1);
    const service = new PartnerService(repository);

    await expect(
      service.softDeletePartner({
        tenantId,
        partnerId: 'partner-1',
      }),
    ).rejects.toBeInstanceOf(PartnerSoftDeleteBlockedByChildrenError);

    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('softDeletePartner delegates to repository when valid', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.findById).mockResolvedValueOnce(basePartner);
    vi.mocked(repository.countActiveChildren).mockResolvedValueOnce(0);
    vi.mocked(repository.softDelete).mockResolvedValueOnce({ count: 1 });
    const service = new PartnerService(repository);

    await service.softDeletePartner({
      tenantId,
      partnerId: 'partner-1',
      actorUserId: 'user-1',
    });

    expect(repository.softDelete).toHaveBeenCalledWith({
      tenantId,
      partnerId: 'partner-1',
    });
    expect(auditServiceMock.registerAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        userId: 'user-1',
        action: 'PARTNER_DELETED',
        entity: 'Partner',
        entityId: 'partner-1',
      }),
    );
  });
});
