import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { AppError } from "../shared/errors/AppError";
import { JwtPayload } from "../types/request-context";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Unauthorized", 401);
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Invalid authorization header", 401);
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new AppError("JWT secret not configured", 500);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("tenantId" in decoded) ||
      !("userId" in decoded)
    ) {
      throw new AppError("Invalid token payload", 401);
    }

    req.user = decoded as JwtPayload;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid token", 401);
  }
}