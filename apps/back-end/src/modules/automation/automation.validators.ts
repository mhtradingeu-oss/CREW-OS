import { z } from "zod";

import {
  AutomationRuleBaseSchema,
  AutomationRuleVersionSchema,
  AutomationRunSchema,
  AutomationActionRunSchema,
} from "@mh-os/shared";

/**
 * Create Automation Rule
 */
export const createAutomationRuleSchema =
  AutomationRuleBaseSchema.omit({
    id: true,
    lastRunAt: true,
    lastRunStatus: true,
    state: true,
  });

/**
 * Create Automation Rule Version
 */
export const createAutomationRuleVersionSchema =
  AutomationRuleVersionSchema.omit({
    id: true,
    state: true,
    versionNumber: true,
  });

/**
 * Create Automation Run
 * ⚠️ only omit fields that EXIST in schema
 */
export const createAutomationRunSchema =
  AutomationRunSchema.omit({
    id: true,
    status: true,
  });

/**
 * Create Automation Action Run
 */
export const createAutomationActionRunSchema =
  AutomationActionRunSchema.omit({
    id: true,
    status: true,
  });

// Controller compatibility aliases
export const createAutomationSchema = createAutomationRuleSchema;
export const updateAutomationSchema = createAutomationRuleVersionSchema;
