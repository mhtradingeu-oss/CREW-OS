import { z } from "zod";

export const actionRiskSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type ActionRisk = z.infer<typeof actionRiskSchema>;

export const actionSideEffectSchema = z.enum(["NONE", "REVERSIBLE", "IRREVERSIBLE"]);
export type ActionSideEffect = z.infer<typeof actionSideEffectSchema>;

export const actionApprovalHintsSchema = z
  .object({
    requiresApprovalInProd: z.boolean().optional(),
    requiresApprovalInStaging: z.boolean().optional(),
  })
  .optional();
export type ActionApprovalHints = z.infer<typeof actionApprovalHintsSchema>;

export const actionMetadataSchema = z.object({
  risk: actionRiskSchema,
  sideEffect: actionSideEffectSchema,
  description: z.string().min(1),
  version: z.string().optional(),
  approvalHints: actionApprovalHintsSchema,
});

export interface ActionDefinition {
  risk: ActionRisk;
  sideEffect: ActionSideEffect;
  description: string;
  version?: string;
  approvalHints?: ActionApprovalHints;
}

export type ActionMetadata = ActionDefinition;
