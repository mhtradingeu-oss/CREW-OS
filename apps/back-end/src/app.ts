import express, { type Request, type Response, type NextFunction } from "express";
import cors, { type CorsOptions } from "cors";
import { requestLogger } from "./core/http/middleware/request-logger.js";
import { httpMetricsMiddleware } from "./core/metrics/http-metrics.middleware.js";
import { metricsRouter } from "./core/metrics/metrics.routes.js";
import { errorHandler } from "./core/http/middleware/error-handler.js";
import { env } from "./core/config/env.js";
import { apiRateLimiter, createRateLimiter } from "./core/http/rate-limit.js";
import { correlationIdMiddleware } from "./core/http/middleware/correlation-id.js";
import { authRouter } from "./modules/auth/index.js";
import { usersRouter } from "./modules/users/index.js";
import { brandRouter } from "./modules/brand/index.js";
import { productRouter } from "./modules/product/index.js";
import { pricingRouter } from "./modules/pricing/index.js";
import { crmRouter } from "./modules/crm/index.js";
import { marketingRouter } from "./modules/marketing/index.js";
import { sales_repsRouter } from "./modules/sales-reps/index.js";
import { dealersRouter } from "./modules/dealers/index.js";
import { partnersRouter } from "./modules/partners/index.js";
import { competitorRouter } from "./modules/competitor/index.js";
import { standRouter } from "./modules/stand/index.js";
import { stand_posRouter } from "./modules/stand-pos/index.js";
import { affiliateRouter } from "./modules/affiliate/index.js";
import { loyaltyRouter } from "./modules/loyalty/index.js";
import { inventoryRouter } from "./modules/inventory/index.js";
import { financeRouter } from "./modules/finance/index.js";
import { white_labelRouter } from "./modules/white-label/index.js";
import { automationRouter, observabilityRouter as automationObservabilityRouter } from "./modules/automation/index.js";
import { communicationRouter } from "./modules/communication/index.js";
import { knowledge_baseRouter } from "./modules/knowledge-base/index.js";
import { security_governanceRouter } from "./modules/security-governance/index.js";
import { adminRouter } from "./modules/admin/index.js";
import { ai_brainRouter } from "./modules/ai-brain/index.js";
import { aiCrewRouter, advisorySessionRouter } from "./ai/crew/index.js";
import learningRouter from "./ai/learning/learning.routes.js";
import { executionIntentRouter } from "./ai/execution-intent/index.js";
import { social_intelligenceRouter } from "./modules/social-intelligence/index.js";
import { influencer_osRouter } from "./modules/influencer-os/index.js";
import { operationsRouter } from "./modules/operations/index.js";
import { supportRouter } from "./modules/support/index.js";
import { activityLogRouter } from "./modules/activity-log/index.js";
import { notificationRouter } from "./modules/notification/index.js";
import { platformOpsRouter } from "./modules/platform-ops/index.js";
import { aiMonitoringRouter } from "./modules/ai-monitoring/index.js";
import { aiSafetyRouter } from "./modules/ai-safety/index.js";
import aiSuggestionRouter from "./modules/ai-suggestions/ai-suggestion.routes.js";
import { mediaStudioRouter } from "./modules/media-studio/index.js";
import { whiteLabelConfiguratorRouter } from "./modules/white-label-configurator/index.js";
import { onboardingRouter } from "./modules/onboarding/index.js";
import { planHistoryRouter } from "./modules/plan-history/index.js";
import { operatorAuditRouter } from "./modules/operator-audit/index.js";
import { authenticateRequest } from "./core/security/auth-middleware.js";
import { responseFormatter } from "./core/http/middleware/response-formatter.js";
import { attachPlanContext, requireFeature } from "./core/http/middleware/plan-gating.js";
import { featureTelemetry } from "./core/http/middleware/feature-telemetry.js";
import { FEATURES } from "./core/security/feature-registry.js";
import { csrfProtectionMiddleware } from "./core/security/csrf.js";
import { cookieParser } from "./core/http/middleware/cookie-parser.js";
import { healthRouter } from "./core/health/router.js";
import { router as internalIntelligenceRouter } from "./modules/intelligence/internal-intelligence.routes.js";
import { router as actionSuggestionRouter } from "./modules/action-suggestion/index.js";

export function createApp() {
  const app = express();
  const corsOptions = buildCorsOptions();
  // Metrics middleware (Phase 8) — must be first for accurate timings
  app.use(httpMetricsMiddleware);
  // /metrics endpoint (Phase 8) — mount before auth, protect with env flag
  if (process.env.METRICS_ENABLED !== 'false') {
    app.use(metricsRouter);
  }
  app.use("/health", healthRouter); // Handles /health and /ready
  app.use(cookieParser());
  app.use(correlationIdMiddleware); // Attach correlationId to req.context
  app.use(cors(corsOptions));
  app.use(addSecurityHeaders);
  app.use(express.json({ limit: "1mb" }));
  app.use(responseFormatter);
  app.use(requestLogger);
  app.use("/api/v1", apiRateLimiter);

  // Internal observability (admin/ops only, read-only)
  app.use("/internal/intelligence", internalIntelligenceRouter);
  app.use("/internal/intelligence", actionSuggestionRouter);

  // Rate limiting (Phase 2 baseline) — move to Redis-backed store in Phase 3 for HA.
  const authRateLimiter = createRateLimiter({ limit: 100 });
  const aiRateLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, limit: 120 });
  const platformOpsRateLimiter = createRateLimiter({ limit: 80 });
  app.use("/api/v1/ai/learning", aiRateLimiter, learningRouter);

  // These routers correspond to the officially indexed docs under docs/MASTER_INDEX.md .
  app.use(csrfProtectionMiddleware);
  app.use("/api/v1/auth", authRateLimiter, authRouter);
  app.use(authenticateRequest);
  app.use(attachPlanContext);
  app.use("/api/v1/ai/safety", aiRateLimiter, aiSafetyRouter);
  app.use("/api/v1/ai/monitoring", aiRateLimiter, aiMonitoringRouter);
  app.use("/api/v1/ai", aiRateLimiter, requireFeature(FEATURES.ADVANCED_AUTONOMY), featureTelemetry(FEATURES.ADVANCED_AUTONOMY), ai_brainRouter);
  // AI Crew Advisory (advisory-only, safe)
  app.use("/api/ai/crew", aiRateLimiter, aiCrewRouter);
  // AI Crew Advisory Session Composition (advisory-only, safe)
  app.use("/api/v1/ai/crew/advisory", aiRateLimiter, advisorySessionRouter);
  app.use("/api/v1/ai-suggestions", aiRateLimiter, aiSuggestionRouter);
  app.use("/api/v1/media", aiRateLimiter, requireFeature(FEATURES.MEDIA_STUDIO), featureTelemetry(FEATURES.MEDIA_STUDIO), mediaStudioRouter);
  app.use(
    "/api/v1/white-label-configurator",
    aiRateLimiter,
    requireFeature(FEATURES.WHITE_LABEL_STUDIO),
    featureTelemetry(FEATURES.WHITE_LABEL_STUDIO),
    whiteLabelConfiguratorRouter,
  );
  app.use("/api/v1/platform-ops", platformOpsRateLimiter, platformOpsRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/brand", brandRouter);
  app.use("/api/v1/product", productRouter);
  app.use("/api/v1/pricing", pricingRouter);
  app.use("/api/v1/crm", crmRouter);
  app.use("/api/v1/marketing", marketingRouter);
  app.use("/api/v1/sales-reps", sales_repsRouter);
  app.use("/api/v1/dealers", dealersRouter);
  app.use("/api/v1/partners", partnersRouter);
  app.use("/api/v1/competitor", requireFeature(FEATURES.COMPETITOR), featureTelemetry(FEATURES.COMPETITOR), competitorRouter);
  app.use("/api/v1/stand", standRouter);
  app.use("/api/v1/stand-pos", stand_posRouter);
  app.use("/api/v1/affiliate", affiliateRouter);
  app.use("/api/v1/loyalty", loyaltyRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/finance", financeRouter);
  app.use("/api/v1/white-label", white_labelRouter);
  app.use("/api/v1/automation", automationRouter);
  app.use("/api/v1/automation/observability", automationObservabilityRouter);
  app.use("/api/v1/audit", operatorAuditRouter);
  app.use("/api/v1/communication", communicationRouter);
  app.use("/api/v1/knowledge", knowledge_baseRouter);
  app.use("/api/v1/security", security_governanceRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/influencer", requireFeature(FEATURES.INFLUENCER_TOOLKIT), featureTelemetry(FEATURES.INFLUENCER_TOOLKIT), influencer_osRouter);
  app.use("/api/v1/social-intelligence", social_intelligenceRouter);
  app.use("/api/v1/operations", operationsRouter);
  app.use("/api/v1/support", supportRouter);
  app.use("/api/v1/activity", activityLogRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/onboarding", onboardingRouter);
  app.use("/api/v1/plan-history", planHistoryRouter);

  app.use(errorHandler);

  return app;
}

function buildCorsOptions(): CorsOptions {
  // أثناء التطوير نسمح لجميع الأورجينز
  if (process.env.NODE_ENV !== "production") {
    return {
      origin: true,
      credentials: true,
    };
  }

  // في الإنتاج فقط نستخدم اللائحة المسموحة
  const parsedEnv = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin: string) => origin.trim())
    .filter(Boolean);

  if (parsedEnv.length === 0) {
    throw new Error("ALLOWED_ORIGINS must be configured in production");
  }

  return {
    origin: (origin, callback) => {
      if (!origin || parsedEnv.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin denied"));
    },
    credentials: true,
  };
}


function addSecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
}
