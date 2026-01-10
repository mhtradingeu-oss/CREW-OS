
import "express";
import type { SessionPayload } from "@/core/security/session.types";
import type { PlanContext } from "@/core/billing/plan-context";
import type { RequestContext } from "@/core/context/request-context";

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionPayload;
    planContext?: PlanContext;
    context?: RequestContext;
    feature?: {
      key: string;
      audit?: boolean;
    };
  }
}

export {};
