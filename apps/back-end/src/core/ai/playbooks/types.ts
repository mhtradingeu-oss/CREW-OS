export type PlaybookId =
  | "pricing"
  | "competitor"
  | "inventory"
  | "crm"
  | "marketing"
  | "partner"
  | "finance"
  | "operations"
  | "support"
  | "strategy"
  | "legal-compliance"
  | "bi-analytics"
  | "media"
  | "white-label";

export type AIPlaybook = {
  id: PlaybookId;
  goals: string[];
  signals: string[];
  triggers: string[];
  reasoningFramework: string[];
  forbiddenActions: string[];
  approvalRules: string[];
};

export type PlaybookMap = Record<PlaybookId, AIPlaybook>;
