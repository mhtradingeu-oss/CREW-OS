import type { Request } from "express";
import type { SessionPayload } from "../security/jwt.js";
import type { PlanContext } from "../plans-resolver.js";

export interface RequestContext {
  correlationId?: string;
  // أضف خصائص أخرى إذا لزم الأمر
}

export type AuthenticatedRequest = Request & {
  user?: SessionPayload;
  planContext?: PlanContext;
  context?: RequestContext;
};
