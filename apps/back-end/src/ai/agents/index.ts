import * as competitorEngine from "../../core/ai/engines/competitor.engine.js";
import * as crmEngine from "../../core/ai/engines/crm.engine.js";
import * as financeEngine from "../../core/ai/engines/finance.engine.js";
import * as governanceEngine from "../../core/ai/engines/governance.engine.js";
import * as inventoryEngine from "../../core/ai/engines/inventory.engine.js";
import * as marketingEngine from "../../core/ai/engines/marketing.engine.js";
import * as partnerEngine from "../../core/ai/engines/partner.engine.js";
import * as pricingEngine from "../../core/ai/engines/pricing.engine.js";
import * as whitelabelEngine from "../../core/ai/engines/whitelabel.engine.js";

export { AI_AGENTS_MANIFEST, AgentManifestByScope, type AIAgentDefinition } from "../schema/ai-agents-manifest.js";

export const AI_ENGINE_HANDLERS = {
	PRICING_ENGINE: pricingEngine.runEngine,
	COMPETITOR_ENGINE: competitorEngine.runEngine,
	INVENTORY_ENGINE: inventoryEngine.runEngine,
	CRM_ENGINE: crmEngine.runEngine,
	CAMPAIGN_ENGINE: marketingEngine.runEngine,
	PARTNER_ENGINE: partnerEngine.runEngine,
	FINANCE_ENGINE: financeEngine.runEngine,
	WHITELABEL_ENGINE: whitelabelEngine.runEngine,
	GOVERNANCE_ENGINE: governanceEngine.runEngine,
} as const;

export type AIEngineId = keyof typeof AI_ENGINE_HANDLERS;
