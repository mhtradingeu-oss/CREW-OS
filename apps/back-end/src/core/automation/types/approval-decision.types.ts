import type { AutomationApprovalStatus } from "@prisma/client";

export type ApprovalDecisionWithSuggestion = {
  id: string;
  status: AutomationApprovalStatus;
  suggestionId: string | null;
  snapshotHash: string;
  environment: string;
  approvedById: string | null;
  approvedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  suggestion: {
    brandId: string;
  } | null;
};
