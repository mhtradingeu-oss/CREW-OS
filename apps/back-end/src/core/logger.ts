
const LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = typeof LEVELS[number];

// Determine log level from env/config
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
const LOG_LEVEL_INDEX = LEVELS.indexOf(LOG_LEVEL as LogLevel);

interface LogContext {
  module?: string;
  action?: string;
  correlationId?: string;
  requestId?: string;
  eventName?: string;
  route?: string;
  status?: number | string;
  durationMs?: number;
  meta?: any;
  [key: string]: any;
}

function safeSerialize(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatErrorPayload(value: unknown, isProd: boolean) {
  if (value instanceof Error) {
    const payload: any = {
      name: value.name,
      message: value.message,
    };
    if (!isProd && value.stack) {
      payload.stack = value.stack;
    }
    return payload;
  }
  if (value && typeof value === "object") {
    const payload = value as Record<string, any>;
    if (payload.name && payload.message) {
      const result: any = { name: String(payload.name), message: String(payload.message) };
      if (!isProd && payload.stack) {
        result.stack = payload.stack;
      }
      return result;
    }
    return {
      name: payload.name ? String(payload.name) : "Error",
      message: payload.message ? String(payload.message) : safeSerialize(payload),
    };
  }
  return {
    name: "Error",
    message: value !== undefined ? String(value) : "Unknown error",
  };
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
  if (!LEVELS.includes(level)) level = "info";
  // Only print if level is >= configured log level
  const levelIdx = LEVELS.indexOf(level);
  if (levelIdx < LOG_LEVEL_INDEX) return;

  const { error: errorPayload, ...restContext } = context;
  const correlationId = restContext.correlationId ?? restContext.requestId ?? null;
  const sanitizedRoute = restContext.route ?? null;
  const sanitizedStatus = restContext.status ?? null;
  const sanitizedDuration = restContext.durationMs ?? null;
  const envValue = process.env.NODE_ENV || "development";
  const serviceName = process.env.SERVICE_NAME || "crewos-back-end";
  const isProd = envValue === "production";

  const baseEntry: any = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: serviceName,
    env: envValue,
    correlationId,
    route: sanitizedRoute,
    status: sanitizedStatus,
    durationMs: sanitizedDuration,
  };

  const logEntry = {
    ...baseEntry,
    ...restContext,
  };

  if (errorPayload && level === "error") {
    logEntry.error = formatErrorPayload(errorPayload, isProd);
  }

  // Print as single-line JSON
  console[level === "error" ? "error" : level](JSON.stringify(logEntry));
}

function enforceContext(level: LogLevel, message: string, context?: LogContext) {
  if (typeof context !== "object" || context === null) {
    log("warn", `[logger] ${level} called without context object. Message: ${message}`, { meta: context });
    context = { meta: context };
  }
  log(level, message, context);
}

export const logger = {
  debug: (message: string, context?: LogContext) => enforceContext("debug", message, context),
  info: (message: string, context?: LogContext) => enforceContext("info", message, context),
  warn: (message: string, context?: LogContext) => enforceContext("warn", message, context),
  error: (message: string, context?: LogContext) => enforceContext("error", message, context),
};

// Usage example:
// logger.info("User created", { module: "user", action: "create", correlationId, meta: { userId } });
