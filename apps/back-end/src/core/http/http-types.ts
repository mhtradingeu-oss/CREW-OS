import type { Request } from "express";
import type { SessionPayload } from "../security/jwt.js";
import type { PlanContext } from "../plans-resolver.js";

export type AuthenticatedRequest = Request & {
  user?: SessionPayload;
  planContext?: PlanContext;
};
