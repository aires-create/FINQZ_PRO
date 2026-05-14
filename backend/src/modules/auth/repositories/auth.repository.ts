import { prisma } from "../../../database/prisma";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        emailNormalized: email.toLowerCase().trim(),
        isActive: true,
        deletedAt: null,
      },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}