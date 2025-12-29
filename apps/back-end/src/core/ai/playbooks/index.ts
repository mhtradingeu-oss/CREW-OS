import type { PlaybookMap } from "./types.js";
import { BIAnalyticsPlaybook } from "./bi-analytics.playbook.js";
import { CompetitorPlaybook } from "./competitor.playbook.js";
import { CrmPlaybook } from "./crm.playbook.js";
import { FinancePlaybook } from "./finance.playbook.js";
import { InventoryPlaybook } from "./inventory.playbook.js";
import { LegalCompliancePlaybook } from "./legal-compliance.playbook.js";
import { MarketingPlaybook } from "./marketing.playbook.js";
import { OperationsPlaybook } from "./operations.playbook.js";
import { PartnerPlaybook } from "./partner.playbook.js";
import { PricingPlaybook } from "./pricing.playbook.js";
import { StrategyPlaybook } from "./strategy.playbook.js";
import { SupportPlaybook } from "./support.playbook.js";
import { MediaPlaybook } from "./media.playbook.js";
import { WhiteLabelPlaybook } from "./white-label.playbook.js";

export * from "./types.js";
export {
  BIAnalyticsPlaybook,
  CompetitorPlaybook,
  CrmPlaybook,
  FinancePlaybook,
  InventoryPlaybook,
  LegalCompliancePlaybook,
  MarketingPlaybook,
  OperationsPlaybook,
  PartnerPlaybook,
  PricingPlaybook,
  StrategyPlaybook,
  SupportPlaybook,
  MediaPlaybook,
  WhiteLabelPlaybook,
};

export const PLAYBOOKS: PlaybookMap = {
  "bi-analytics": BIAnalyticsPlaybook,
  competitor: CompetitorPlaybook,
  crm: CrmPlaybook,
  finance: FinancePlaybook,
  inventory: InventoryPlaybook,
  "legal-compliance": LegalCompliancePlaybook,
  marketing: MarketingPlaybook,
  operations: OperationsPlaybook,
  partner: PartnerPlaybook,
  pricing: PricingPlaybook,
  strategy: StrategyPlaybook,
  support: SupportPlaybook,
  media: MediaPlaybook,
  "white-label": WhiteLabelPlaybook,
};
