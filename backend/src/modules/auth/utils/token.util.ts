import jwt from "jsonwebtoken";
import crypto from "crypto";

type AccessTokenPayload = {
  sub: string;
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export function generateAccessToken(payload: AccessTokenPayload): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}