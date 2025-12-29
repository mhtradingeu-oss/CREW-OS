
import { Router } from "express";
import * as controller from "./automation.explain.controller.js";
import {
	explainRuleVersionParams,
	explainRunParams,
	explainActionRunParams,
	explainQuery,
} from "./automation.explain.validators.js";
import { validateQuery, validateParams } from "../../core/http/middleware/validate.js";

const automationExplainRouter = Router();

// GET /rule-versions/:ruleVersionId
automationExplainRouter.get(
	"/rule-versions/:ruleVersionId",
	validateParams(explainRuleVersionParams),
	validateQuery(explainQuery),
	controller.explainRuleVersion,
);

// GET /runs/:runId
automationExplainRouter.get(
	"/runs/:runId",
	validateParams(explainRunParams),
	validateQuery(explainQuery),
	controller.explainRun,
);

// GET /action-runs/:actionRunId
automationExplainRouter.get(
	"/action-runs/:actionRunId",
	validateParams(explainActionRunParams),
	validateQuery(explainQuery),
	controller.explainActionRun,
);

export { automationExplainRouter };
