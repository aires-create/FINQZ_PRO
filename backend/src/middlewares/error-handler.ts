import { Request, Response, NextFunction } from "express";

import { AppError } from "../shared/errors/AppError";

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "InternalServerError",
    message: "Internal server error",
  });
}