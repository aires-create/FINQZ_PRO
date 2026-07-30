// ============================================
// FINQZ PRO - Memberships Service
// ============================================

import { Prisma } from '@prisma/client';
import { AppError, AuthorizationError, ValidationError } from '../../types/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import type {
  CreateMembershipRequest,
  MembershipListQuery,
  MembershipRole,
  UpdateMembershipRequest,
} from './types.js';
import { membershipsRepository } from './repositories/memberships.repository.js';

const logger = createModuleLogger('MembershipsService');

const canManageRole = (actorRole?: string | null): boolean =>
  actorRole === 'owner' || actorRole === 'admin';

const canViewMembership = (
  membershipUserId: string,
  actorUserId: string,
  actorMembershipRole?: string | null,
): boolean =>
  membershipUserId === actorUserId || actorMembershipRole === 'owner' || actorMembershipRole === 'admin' || actorMembershipRole === 'manager';

export class MembershipsService {
  async listMemberships(tenantId: string, query: MembershipListQuery) {
    return membershipsRepository.listMemberships(tenantId, query);
  }

  async listUserMemberships(tenantId: string, userId: string) {
    return membershipsRepository.listUserMemberships(tenantId, userId);
  }

  async getMembership(
    tenantId: string,
    membershipId: string,
    actorUserId: string,
    actorMembershipRole?: string | null,
  ) {
    const membership = await membershipsRepository.findById(tenantId, membershipId);

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    if (!canViewMembership(membership.userId, actorUserId, actorMembershipRole)) {
      throw new AuthorizationError('Access denied');
    }

    return membership;
  }

  async createMembership(tenantId: string, actorUserId: string, data: CreateMembershipRequest) {
    logger.info(`Creating membership for user ${data.userId} in organization ${data.organizationId}`);

    const [user, organization, actorMembership] = await Promise.all([
      membershipsRepository.findUser(tenantId, data.userId),
      membershipsRepository.findOrganization(tenantId, data.organizationId),
      membershipsRepository.findActorMembership(actorUserId, data.organizationId),
    ]);

    if (!user) {
      throw new ValidationError('User not found');
    }

    if (!organization) {
      throw new ValidationError('Organization not found');
    }

    if (!canManageRole(actorMembership?.role)) {
      throw new AuthorizationError('Only organization admins or owners can manage memberships');
    }

    if (data.role === 'owner' && actorMembership?.role !== 'owner') {
      throw new AuthorizationError('Only owners can assign the owner role');
    }

    const existingMembership = await membershipsRepository.findExistingMembership(data.userId, data.organizationId);

    if (existingMembership && !existingMembership.deletedAt) {
      throw new ValidationError('User is already a member of this organization');
    }

    const writeData: Prisma.MembershipUncheckedCreateInput = {
      userId: data.userId,
      organizationId: data.organizationId,
      role: data.role,
      invitedById: actorUserId,
      tenantId,
    };

    if (data.permissions !== undefined) writeData.permissions = data.permissions;

    const membership = existingMembership
      ? await membershipsRepository.update(existingMembership.id, {
          role: data.role,
          permissions: data.permissions ?? Prisma.JsonNull,
          invitedById: actorUserId,
          invitedAt: new Date(),
          joinedAt: new Date(),
          isActive: true,
          deletedAt: null,
        })
      : await membershipsRepository.create(writeData);

    if (!user.organizationId) {
      await membershipsRepository.updateUserOrganization(data.userId, data.organizationId);
    }

    return membership;
  }

  async updateMembership(
    tenantId: string,
    membershipId: string,
    actorUserId: string,
    actorMembershipRole: string | undefined,
    data: UpdateMembershipRequest,
  ) {
    const currentMembership = await membershipsRepository.findById(tenantId, membershipId);

    if (!currentMembership) {
      throw new AppError('Membership not found', 404);
    }

    const actorMembership = await membershipsRepository.findActorMembership(
      actorUserId,
      currentMembership.organizationId,
    );

    const actorCanManage = canManageRole(actorMembership?.role ?? actorMembershipRole);
    const isSelfUpdate = currentMembership.userId === actorUserId;
    const changingPrivilegedFields = data.role !== undefined || data.isActive !== undefined;

    if (!actorCanManage && (!isSelfUpdate || changingPrivilegedFields)) {
      throw new AuthorizationError('Access denied');
    }

    if (data.role === 'owner' && actorMembership?.role !== 'owner') {
      throw new AuthorizationError('Only owners can assign the owner role');
    }

    if (currentMembership.role === 'owner' && data.role && data.role !== 'owner') {
      await this.assertAnotherActiveOwner(tenantId, currentMembership.organizationId, currentMembership.id);
    }

    if (currentMembership.role === 'owner' && data.isActive === false) {
      await this.assertAnotherActiveOwner(tenantId, currentMembership.organizationId, currentMembership.id);
    }

    const updateData: Prisma.MembershipUncheckedUpdateInput = {};
    if (data.role !== undefined) updateData.role = data.role;
    if (data.permissions !== undefined) updateData.permissions = data.permissions ?? Prisma.JsonNull;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return membershipsRepository.update(membershipId, updateData);
  }

  async deleteMembership(
    tenantId: string,
    membershipId: string,
    actorUserId: string,
    actorMembershipRole?: string,
  ): Promise<void> {
    const membership = await membershipsRepository.findById(tenantId, membershipId);

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const actorMembership = await membershipsRepository.findActorMembership(
      actorUserId,
      membership.organizationId,
    );

    const actorCanManage = canManageRole(actorMembership?.role ?? actorMembershipRole);
    const isSelfRemoval = membership.userId === actorUserId;

    if (!actorCanManage && !isSelfRemoval) {
      throw new AuthorizationError('Access denied');
    }

    if (membership.role === 'owner') {
      await this.assertAnotherActiveOwner(tenantId, membership.organizationId, membership.id);
    }

    await membershipsRepository.softDelete(membershipId);

    const user = await membershipsRepository.findUserById(membership.userId);

    if (user?.organizationId === membership.organizationId) {
      const replacementMembership = await membershipsRepository.findReplacementMembership(
        tenantId,
        membership.userId,
        membership.organizationId,
      );

      await membershipsRepository.updateUserOrganization(
        membership.userId,
        replacementMembership?.organizationId ?? null,
      );
    }
  }

  async acceptMembership(tenantId: string, membershipId: string, userId: string) {
    const membership = await membershipsRepository.findById(tenantId, membershipId);

    if (!membership) {
      throw new AppError('Membership invitation not found', 404);
    }

    if (membership.isActive) {
      throw new ValidationError('Membership is already active');
    }

    return membershipsRepository.activate(membershipId);
  }

  private async assertAnotherActiveOwner(
    tenantId: string,
    organizationId: string,
    excludedMembershipId: string,
  ): Promise<void> {
    const ownerCount = await membershipsRepository.countOwners(
      tenantId,
      organizationId,
      excludedMembershipId,
    );

    if (ownerCount === 0) {
      throw new ValidationError('Organization must keep at least one active owner');
    }
  }
}

export const membershipsService = new MembershipsService();
