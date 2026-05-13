export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string | undefined;
  public readonly details: unknown | undefined;

  constructor(
    message: string,
    statusCode = 400,
    code?: string,
    details?: unknown
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}