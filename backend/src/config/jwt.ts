import jwt, { SignOptions } from "jsonwebtoken";
import { config, secrets } from "@/config/env";
import crypto from "crypto";

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  if (!secrets.jwt_secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secrets.jwt_secret, {
    expiresIn: config.jwt_expires_in || "7d",
  } as SignOptions);
};
export const generateRefreshToken = (payload?: JWTPayload): string => {
  if (!secrets.jwt_secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  if (payload) {
    return jwt.sign(payload, secrets.jwt_secret, {
      expiresIn: "30d",
    } as SignOptions);
  }

  return crypto.randomBytes(64).toString("hex");
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    if (!secrets.jwt_secret) {
      throw new Error("JWT_SECRET is not configured");
    }
    return jwt.verify(token, secrets.jwt_secret) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
};
