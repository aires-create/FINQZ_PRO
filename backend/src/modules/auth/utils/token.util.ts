import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../../config/env";

type AccessTokenPayload = {
  sub: string;
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}
