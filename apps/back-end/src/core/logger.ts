
const LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = typeof LEVELS[number];

// Determine log level from env/config
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
const LOG_LEVEL_INDEX = LEVELS.indexOf(LOG_LEVEL as LogLevel);

interface LogContext {
  module?: string;
  action?: string;
  correlationId?: string;
  eventName?: string;
  meta?: any;
  [key: string]: any;
}


const ENVIRONMENT = process.env.NODE_ENV || "development";
const SERVICE_NAME = process.env.SERVICE_NAME || process.env.npm_package_name || "mh-os-superapp-backend";

function log(level: LogLevel, message: string, context: LogContext = {}) {
  if (!LEVELS.includes(level)) level = "info";
  // Only print if level is >= configured log level
  const levelIdx = LEVELS.indexOf(level);
  if (levelIdx < LOG_LEVEL_INDEX) return;

  // Ensure required fields
  const baseEntry: any = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: ENVIRONMENT,
    env: ENVIRONMENT,
    service: SERVICE_NAME,
    correlationId: context.correlationId || undefined,
    module: context.module || undefined,
  };

  // For error logs, extract error details if present
  if (level === "error" && context && context.error instanceof Error) {
    baseEntry.error = {
      name: context.error.name,
      message: context.error.message,
      ...(process.env.NODE_ENV !== "production" && context.error.stack ? { stack: context.error.stack } : {}),
    };
    // Remove error from context to avoid duplication
    const { error, ...rest } = context;
    context = rest;
  }

  // Merge the rest of the context
  const logEntry = {
    ...baseEntry,
    ...context,
  };

  // Print as single-line JSON
  console[level === "error" ? "error" : level](JSON.stringify(logEntry));
}

function enforceContext(level: LogLevel, message: string, context?: LogContext) {
  if (typeof context !== 'object' || context === null) {
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
