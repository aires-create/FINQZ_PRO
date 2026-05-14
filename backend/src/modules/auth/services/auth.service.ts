import bcrypt from "bcryptjs";

import { AppError } from "../../../shared/errors/AppError";
import { LoginDTO } from "../dto/login.dto";
import { AuthRepository } from "../repositories/auth.repository";
import { generateAccessToken, generateRefreshToken } from "../utils/token.util";

export class AuthService {
  private authRepository = new AuthRepository();

  async login(data: LoginDTO) {
    const user = await this.authRepository.findUserByEmail(data.email);

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const roles = user.userRoles.map((userRole) => userRole.role.name);

    const permissions = user.userRoles.flatMap((userRole) =>
      userRole.role.rolePermissions.map(
        (rolePermission) => rolePermission.permission.name
      )
    );

    const accessToken = generateAccessToken({
      sub: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      permissions,
    });

    const refreshToken = generateRefreshToken();

    return {
  accessToken,
  refreshToken,
  user: {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    tenantId: user.tenantId,
      },
      roles,
      permissions,
    };
  }
}