import type { SessionPayload } from "../core/security/jwt.js";

declare namespace Express {
  interface Request {
    user?: SessionPayload & {
      roles?: string[];
      permissions?: string[];
    };
  }
}

export {};
