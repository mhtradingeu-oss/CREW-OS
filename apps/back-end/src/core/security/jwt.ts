import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type SessionPayload = {
  id: string;
  role: string;
  tenantId?: string;
  brandId?: string;
};

export function signToken(payload: SessionPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
