/**
 * ============================================================
 * MH-OS — Public Frontend API Surface
 * ------------------------------------------------------------
 * ✔ NodeNext / ESM compliant
 * ✔ No export collisions
 * ✔ No internal / governance leakage
 * ✔ Safe for v1 Frontend Assembly
 * ✔ Video / Voice / IVR / White-label READY (execution later)
 * ============================================================
 */

// API client layer: read-only, presenter-only, typed exports for V1 assembly
// No business/AI/automation/decision logic. No hooks. No side effects.
// All imports explicit, ESM, alias-based. Only GET/read endpoints.

export * from './client';
export * from './errors';
export * from './types';
export * from './governance';
export * from './brands';
export * from './products';
export * from './pricing';

// V1 READ-ONLY — ai.js named exports intentionally disabled for type safety

/* ------------------------------------------------------------------
 * Brand
 * ------------------------------------------------------------------ */
export {
	listBrands,
	getBrand,
	createBrand,
	updateBrand,
	removeBrand,
	getBrandIdentity,
	updateBrandIdentity,
	refreshBrandAiIdentity,
	refreshBrandRulesAi,
	getBrandRules,
	updateBrandRules,
	getBrandAiConfig,
	updateBrandAiConfig
} from './brand.js';

/* ------------------------------------------------------------------
 * Product
 * ------------------------------------------------------------------ */
export {
	listProducts,
	getProduct,
	createProduct,
	updateProduct,
	removeProduct,
	getProductInsight,
	createProductInsight
} from './product.js';

/* ------------------------------------------------------------------
 * Pricing & Finance
 * ------------------------------------------------------------------ */
export {
	getPricing,
	updatePricing,
	calculatePrice
} from './pricing.js';

export {
	getFinanceOverview,
	listInvoices
} from './finance.js';

/* ------------------------------------------------------------------
 * Marketing
 * ------------------------------------------------------------------ */
export {
	generateMarketingPlan,
	generateSeo as marketingGenerateSeo,
	generateCaptions as marketingGenerateCaptions
} from './marketing-ai.js';

export {
	listCampaigns,
	getCampaign,
	createCampaign
} from './marketing.js';

/* ------------------------------------------------------------------
 * Media (Video / Voice / Social — execution in later phases)
 * ------------------------------------------------------------------ */
export {
	listMediaAssets,
	getMediaAsset,
	createMediaDraft
} from './media.js';

/* ------------------------------------------------------------------
 * CRM / Support / Notifications
 * ------------------------------------------------------------------ */
export {
	listLeads,
	getLead,
	updateLead
} from './crm.js';

export {
	listTickets,
	getTicket,
	replyToTicket
} from './support.js';

export {
	listNotifications,
	markNotificationRead
} from './notifications.js';

/* ------------------------------------------------------------------
 * Sales / Loyalty / POS
 * ------------------------------------------------------------------ */
export {
	listSalesReps,
	getSalesRep
} from './sales-reps.js';

export {
	getLoyaltyStatus,
	redeemPoints
} from './loyalty.js';

export {
	getStandStatus,
	recordStandSale
} from './stand-pos.js';

/* ------------------------------------------------------------------
 * Platform Ops & White Label
 * ------------------------------------------------------------------ */
export {
	getPlatformStatus,
	listSystemEvents
} from './platform-ops.js';

export {
	getWhiteLabelConfig,
	updateWhiteLabelConfig
} from './white-label.js';

/* ------------------------------------------------------------------
 * Users & Relations
 * ------------------------------------------------------------------ */
export {
	listUsers,
	getUser,
	updateUser
} from './users.js';

export {
	listUserBrands,
	assignUserToBrand
} from './user-brand.js';

/* ============================================================
 * 🚫 INTENTIONALLY NOT EXPORTED
 * ------------------------------------------------------------
 * - ai-brain
 * - ai-hq
 * - ai-safety
 * - ai-monitoring
 * - ai-kpi
 * - activity
 * - automations
 * - governance internals
 *
 * These remain BACKEND / INTERNAL ONLY.
 * ============================================================
 */
