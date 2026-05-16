import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { prisma } from '../../../database/prisma.js';
import { config } from '../../../config/app.js';
import { AppError } from '../../../shared/errors/AppError.js';

type LoginDTO = {
  email: string;
  password: string;
};

export class AuthService {
  async login({ email, password }: LoginDTO) {
    const emailNormalized = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        emailNormalized,
      },
    });

    if (!user) {
      throw new AppError({
        message: 'Invalid credentials',
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new AppError({
        message: 'Invalid credentials',
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const token = jwt.sign(
  {
    userId: user.id,
    tenantId: user.tenantId,
  },
  config.jwt.secret as string,
  {
    expiresIn: config.jwt.expiresIn as any,
  },
);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        tenantId: user.tenantId,
      },
      token,
    };
  }
}

export const authService = new AuthService();