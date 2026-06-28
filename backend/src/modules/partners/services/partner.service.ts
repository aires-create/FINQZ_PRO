import type { Partner } from '@prisma/client';

import { registerAuditLog } from '../../audit/services/audit.service.js';
import type {
  PartnerRepositoryContract,
  PartnerRepositoryCreateInput,
  PartnerRepositoryListResult,
} from '../repositories/partner.repository.contract.js';
import { partnerPrismaRepository } from '../repositories/partner.prisma.repository.js';
import type {
  PartnerServiceContract,
  PartnerServiceCreateInput,
  PartnerServiceGetByCodeInput,
  PartnerServiceGetByIdInput,
  PartnerServiceListInput,
  PartnerServiceSoftDeleteInput,
  PartnerServiceUpdateInput,
  PartnerStatus,
  PartnerType,
} from './partner.service.contract.js';
import {
  PartnerCodeAlreadyExistsError,
  PartnerHierarchyCycleError,
  PartnerHierarchyDepthExceededError,
  PartnerInvalidHierarchyError,
  PartnerInvalidStatusError,
  PartnerNotFoundError,
  PartnerParentNotFoundError,
  PartnerSoftDeleteBlockedByChildrenError,
  PartnerTenantRequiredError,
} from './partner.errors.js';

const MAX_PARTNER_LEVEL = 3;

const ALLOWED_STATUSES: PartnerStatus[] = [
  'prospect',
  'contato',
  'negociacao',
  'ativo',
  'inativo',
];

const HIERARCHY_RULES: Record<
  PartnerType,
  { parentType: PartnerType | null; level: number }
> = {
  COMPANY: { parentType: null, level: 1 },
  FRANQUIA: { parentType: 'COMPANY', level: 2 },
  FRANQUEADO: { parentType: 'FRANQUIA', level: 3 },
};

const ensureTenantId = (tenantId?: string | null) => {
  if (!tenantId || !tenantId.trim()) {
    throw new PartnerTenantRequiredError();
  }

  return tenantId;
};

const normalizeText = (value?: string | null) => {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
};

const getChangedFields = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
) => {
  return fields.filter((field) => {
    return JSON.stringify(before[field]) !== JSON.stringify(after[field]);
  });
};

const isAllowedStatus = (status: string): status is PartnerStatus => {
  return (ALLOWED_STATUSES as readonly string[]).includes(status);
};

const buildCreateData = (
  input: PartnerServiceCreateInput,
): PartnerRepositoryCreateInput => ({
  tenantId: input.tenantId,
  code: input.code.trim(),
  name: input.name.trim(),
  type: input.type,
  status: input.status,
  ...(input.document !== undefined ? { document: normalizeText(input.document) ?? null } : {}),
  ...(input.email !== undefined ? { email: normalizeText(input.email) ?? null } : {}),
  ...(input.phone !== undefined ? { phone: normalizeText(input.phone) ?? null } : {}),
  ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
});

const buildUpdateData = (
  input: PartnerServiceUpdateInput,
) => ({
  ...(input.code !== undefined ? { code: input.code.trim() } : {}),
  ...(input.name !== undefined ? { name: input.name.trim() } : {}),
  ...(input.type !== undefined ? { type: input.type } : {}),
  ...(input.status !== undefined ? { status: input.status } : {}),
  ...(input.document !== undefined ? { document: normalizeText(input.document) ?? null } : {}),
  ...(input.email !== undefined ? { email: normalizeText(input.email) ?? null } : {}),
  ...(input.phone !== undefined ? { phone: normalizeText(input.phone) ?? null } : {}),
  ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
});

const AuditActions = {
  PARTNER_CREATED: 'PARTNER_CREATED',
  PARTNER_UPDATED: 'PARTNER_UPDATED',
  PARTNER_DELETED: 'PARTNER_DELETED',
} as const;

export class PartnerService implements PartnerServiceContract {
  constructor(
    private readonly repository: PartnerRepositoryContract = partnerPrismaRepository,
  ) {}

  async listPartners(
    input: PartnerServiceListInput,
  ): Promise<PartnerRepositoryListResult> {
    ensureTenantId(input.tenantId);

    return this.repository.listByTenant({
      tenantId: input.tenantId,
      ...(input.page !== undefined ? { page: input.page } : {}),
      ...(input.limit !== undefined ? { limit: input.limit } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      ...(input.search !== undefined ? { search: input.search } : {}),
    });
  }

  async getPartnerById(input: PartnerServiceGetByIdInput): Promise<Partner> {
    ensureTenantId(input.tenantId);

    const partner = await this.repository.findById({
      tenantId: input.tenantId,
      partnerId: input.partnerId,
    });

    if (!partner) {
      throw new PartnerNotFoundError(input.partnerId);
    }

    return partner;
  }

  async getPartnerByCode(input: PartnerServiceGetByCodeInput): Promise<Partner> {
    ensureTenantId(input.tenantId);

    const partner = await this.repository.findByCode({
      tenantId: input.tenantId,
      code: input.code,
    });

    if (!partner) {
      throw new PartnerNotFoundError(input.code);
    }

    return partner;
  }

  async createPartner(input: PartnerServiceCreateInput): Promise<Partner> {
    ensureTenantId(input.tenantId);
    this.validateStatus(input.status);
    this.validateHierarchyShape(input.type, input.parentId);

    await this.ensureCodeIsAvailable(input.tenantId, input.code);

    const parentContext = await this.resolveParentContext(input.tenantId, input.parentId);
    this.validateTypeAgainstParent(input.type, parentContext?.partner);
    this.validateDepth(parentContext?.depth ?? 0);

    const partner = await this.repository.create(buildCreateData(input));

    await registerAuditLog({
      tenantId: input.tenantId,
      userId: input.actorUserId ?? null,
      action: AuditActions.PARTNER_CREATED,
      entity: 'Partner',
      entityId: partner.id,
      metadata: {
        code: partner.code,
        name: partner.name,
        type: partner.type,
        status: partner.status,
        parentId: partner.parentId,
      },
    });

    return partner;
  }

  async updatePartner(input: PartnerServiceUpdateInput): Promise<Partner> {
    ensureTenantId(input.tenantId);

    const current = await this.getPartnerById({
      tenantId: input.tenantId,
      partnerId: input.partnerId,
    });

    if (input.status !== undefined) {
      this.validateStatus(input.status);
    }

    const nextType = input.type ?? (current.type as PartnerType);
    const nextParentId =
      input.parentId !== undefined ? input.parentId : current.parentId;

    this.validateHierarchyShape(nextType, nextParentId);

    if (input.code !== undefined) {
      const normalizedCode = input.code.trim();
      if (normalizedCode !== current.code) {
        const existingPartner = await this.repository.findByCode({
          tenantId: input.tenantId,
          code: normalizedCode,
        });

        if (existingPartner && existingPartner.id !== current.id) {
          throw new PartnerCodeAlreadyExistsError(normalizedCode);
        }
      }
    }

    if (nextParentId) {
      if (nextParentId === current.id) {
        throw new PartnerHierarchyCycleError();
      }

      const parentContext = await this.resolveParentContext(
        input.tenantId,
        nextParentId,
        current.id,
      );
      this.validateTypeAgainstParent(nextType, parentContext?.partner);
      this.validateDepth(parentContext?.depth ?? 0);
    }

    const result = await this.repository.update({
      tenantId: input.tenantId,
      partnerId: input.partnerId,
      data: buildUpdateData(input),
    });

    if (result.count === 0) {
      throw new PartnerNotFoundError(input.partnerId);
    }

    const updated = await this.repository.findById({
      tenantId: input.tenantId,
      partnerId: input.partnerId,
    });

    if (!updated) {
      throw new PartnerNotFoundError(input.partnerId);
    }

    const changedFields = getChangedFields(
      current as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>,
      [
        'code',
        'name',
        'type',
        'document',
        'email',
        'phone',
        'status',
        'parentId',
      ],
    );

    await registerAuditLog({
      tenantId: input.tenantId,
      userId: input.actorUserId ?? null,
      action: AuditActions.PARTNER_UPDATED,
      entity: 'Partner',
      entityId: updated.id,
      metadata: {
        changedFields,
      },
    });

    return updated;
  }

  async softDeletePartner(input: PartnerServiceSoftDeleteInput): Promise<void> {
    ensureTenantId(input.tenantId);

    await this.getPartnerById({
      tenantId: input.tenantId,
      partnerId: input.partnerId,
    });

    const activeChildren = await this.repository.countActiveChildren({
      tenantId: input.tenantId,
      parentId: input.partnerId,
    });

    if (activeChildren > 0) {
      throw new PartnerSoftDeleteBlockedByChildrenError();
    }

    const result = await this.repository.softDelete({
      tenantId: input.tenantId,
      partnerId: input.partnerId,
    });

    if (result.count === 0) {
      throw new PartnerNotFoundError(input.partnerId);
    }

    await registerAuditLog({
      tenantId: input.tenantId,
      userId: input.actorUserId ?? null,
      action: AuditActions.PARTNER_DELETED,
      entity: 'Partner',
      entityId: input.partnerId,
      metadata: {
        deletedAt: new Date().toISOString(),
      },
    });
  }

  private validateStatus(status: string) {
    if (!isAllowedStatus(status)) {
      throw new PartnerInvalidStatusError(status);
    }
  }

  private validateHierarchyShape(type: PartnerType, parentId?: string | null) {
    const rule = HIERARCHY_RULES[type];

    if (!rule) {
      throw new PartnerInvalidHierarchyError(`Invalid partner type: ${type}`);
    }

    if (rule.parentType === null && parentId) {
      throw new PartnerInvalidHierarchyError('COMPANY cannot have parentId');
    }

    if (rule.parentType !== null && parentId === undefined) {
      throw new PartnerInvalidHierarchyError(
        `${type} requires parentId`,
      );
    }
  }

  private validateTypeAgainstParent(type: PartnerType, parent?: Partner | null) {
    const rule = HIERARCHY_RULES[type];

    if (rule.parentType === null) {
      return;
    }

    if (!parent) {
      throw new PartnerParentNotFoundError('missing-parent');
    }

    if ((parent.type as PartnerType) !== rule.parentType) {
      throw new PartnerInvalidHierarchyError(
        `${type} requires parent type ${rule.parentType}`,
      );
    }
  }

  private validateDepth(parentDepth: number) {
    if (parentDepth + 1 > MAX_PARTNER_LEVEL) {
      throw new PartnerHierarchyDepthExceededError();
    }
  }

  private async ensureCodeIsAvailable(tenantId: string, code: string) {
    const existingPartner = await this.repository.findByCode({
      tenantId,
      code: code.trim(),
    });

    if (existingPartner) {
      throw new PartnerCodeAlreadyExistsError(code.trim());
    }
  }

  private async resolveParentContext(
    tenantId: string,
    parentId?: string | null,
    currentPartnerId?: string,
  ): Promise<{ partner: Partner; depth: number } | null> {
    if (!parentId) {
      return null;
    }

    const visited = new Set<string>();
    let depth = 1;
    let currentParentId: string | null = parentId;

    while (currentParentId) {
      if (currentPartnerId && currentParentId === currentPartnerId) {
        throw new PartnerHierarchyCycleError();
      }

      if (visited.has(currentParentId)) {
        throw new PartnerHierarchyCycleError();
      }

      visited.add(currentParentId);

      const parent = await this.repository.findById({
        tenantId,
        partnerId: currentParentId,
      });

      if (!parent) {
        throw new PartnerParentNotFoundError(currentParentId);
      }

      if (currentParentId === parentId) {
        const resolvedParent = parent;
        let nextParentId = resolvedParent.parentId;
        let nextDepth = 1;
        const hierarchyVisited = new Set<string>([resolvedParent.id]);

        while (nextParentId) {
          if (currentPartnerId && nextParentId === currentPartnerId) {
            throw new PartnerHierarchyCycleError();
          }

          if (hierarchyVisited.has(nextParentId)) {
            throw new PartnerHierarchyCycleError();
          }

          hierarchyVisited.add(nextParentId);

          const ancestor = await this.repository.findById({
            tenantId,
            partnerId: nextParentId,
          });

          if (!ancestor) {
            throw new PartnerParentNotFoundError(nextParentId);
          }

          nextDepth += 1;
          nextParentId = ancestor.parentId;
        }

        return {
          partner: resolvedParent,
          depth: nextDepth,
        };
      }

      depth += 1;
      currentParentId = parent.parentId ?? null;
    }

    return null;
  }
}

export const partnerService = new PartnerService();
