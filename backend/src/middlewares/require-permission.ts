import { Request, Response, NextFunction } from "express";

import { AppError } from "../shared/errors/AppError";

export function requirePermission(permission: string) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    const permissions = req.user?.permissions || [];

    const hasPermission = permissions.includes(permission);

    if (!hasPermission) {
      throw new AppError("Forbidden", 403);
    }

    next();
  };
}