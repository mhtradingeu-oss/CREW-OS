// Canonical Permission Registry
// This file is the single source of truth for all permissions in the system.
// DO NOT define permissions anywhere else.

export const PERMISSIONS = {
  USERS: {
    READ: "users:read",
    DELETE: "users:delete",
    // Add more as found
  },
  BRAND: {
    READ: "brand:read",
    DELETE: "brand:delete",
    // Add more as found
  },
  AI: {
    READ: "ai:read",
    RUN: "ai:run",
    MANAGE: "ai:manage",
    // Add more as found
  },
  AI_CONTEXT: {
    PRODUCT: "ai:context:product",
    PRICING: "ai:context:pricing",
    CRM: "ai:context:crm",
    FINANCE: "ai:context:finance",
    PARTNER: "ai:context:partner",
    MARKETING: "ai:context:marketing",
    MEDIA: "ai:context:media",
    BRAND: "ai:context:brand",
    // Add more as found
  },
  SALES_REP: {
    READ: "sales-rep:read",
    MANAGE: "sales-rep:manage",
    KPI: "sales-rep:kpi",
  },
  DEALERS: {
    READ: "dealers:read",
    CREATE: "dealers:create",
    UPDATE: "dealers:update",
    DELETE: "dealers:delete",
    MANAGE: "dealers:manage",
    STATS: "dealers:stats",
  },
  PRICING: {
    READ: "pricing:read",
    UPDATE: "pricing:update",
    CREATE: "pricing:create",
    DELETE: "pricing:delete",
    APPROVE: "pricing:approve",
    MANAGE: "pricing:manage",
  },
  FINANCE: {
    READ: "finance:read",
    CREATE: "finance:create",
    UPDATE: "finance:update",
    DELETE: "finance:delete",
    MANAGE: "finance:manage",
  },
  MARKETING: {
    READ: "marketing:read",
    CREATE: "marketing:create",
    UPDATE: "marketing:update",
    DELETE: "marketing:delete",
  },
  AFFILIATE: {
    READ: "affiliate:read",
    CREATE: "affiliate:create",
    UPDATE: "affiliate:update",
    DELETE: "affiliate:delete",
  },
  COMMUNICATION: {
    READ: "communication:read",
    CREATE: "communication:create",
    UPDATE: "communication:update",
    DELETE: "communication:delete",
    SEND: "communication:send",
  },
  AUTOMATION: {
    READ: "automation:read",
    CREATE: "automation:create",
    UPDATE: "automation:update",
    DELETE: "automation:delete",
    EXECUTE: "automation:execute",
    RUN: "automation:run",
    RULES_ACTIVATE: "automation:rules:activate",
    MANAGE: "automation:manage",
  },
  AI_MONITORING: {
    READ: "ai:monitoring:read",
    MEDIA_VIEW: "ai:media:view",
    MEDIA_RUN: "ai:media:run",
    WHITE_LABEL_RUN: "ai:white-label:run",
  },
  INFLUENCER: {
    READ: "influencer:read",
    MANAGE: "influencer:manage",
  },
  STAND: {
    READ: "stand:read",
    // Add more as found
  },
  MEDIA: {
    READ: "media:read",
    MANAGE: "media:manage",
  },
  COMPETITOR: {
    READ: "competitor:read",
  },
  PARTNER: {
    READ: "partner:read",
  },
  OPERATIONS: {
    READ: "operations:read",
  },
  LOYALTY: {
    READ: "loyalty:read",
  },
  CRM: {
    READ: "crm:read",
    UPDATE: "crm:update",
  },
  // Add more domains as found
} as const;


// Utility type for extracting all values from nested objects
export type ValueOf<T> = T[keyof T];
export type PermissionCode = ValueOf<ValueOf<typeof PERMISSIONS>>;

// Flat array of all permission codes
export const ALL_PERMISSION_CODES: PermissionCode[] = (
  Object.values(PERMISSIONS).flatMap(domain => Object.values(domain))
) as PermissionCode[];
