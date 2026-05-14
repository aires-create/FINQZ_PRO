import { Request, Response, NextFunction } from "express";

import { AppError } from "../shared/errors/AppError";

export function tenantContext(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user?.tenantId) {
    throw new AppError("Tenant not found", 401);
  }

  req.tenantId = req.user.tenantId;

  next();
}