-- CreateEnum
CREATE TYPE "AIExecutionStatus" AS ENUM ('SUCCESS', 'ERROR', 'BLOCKED', 'FALLBACK', 'RETRY');

-- CreateEnum
CREATE TYPE "AIRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AIMonitoringCategory" AS ENUM ('ENGINE_HEALTH', 'AGENT_ACTIVITY', 'TOKEN_USAGE', 'PERFORMANCE_METRIC', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "AIPromptAction" AS ENUM ('ALLOW', 'BLOCK', 'SANITIZE');

-- CreateEnum
CREATE TYPE "AISafetyEventType" AS ENUM ('PROMPT_FIREWALL', 'SAFETY_CONSTRAINT', 'BANNED_ACTION', 'OVERSIGHT', 'RED_TEAM');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AutomationActionRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED', 'RETRYING');

-- CreateEnum
CREATE TYPE "AutomationRuleLifecycleState" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AutomationApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AutomationExecutionResult" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "AutomationIncidentType" AS ENUM ('AUTOMATION_FAILURE', 'DATA_INCONSISTENCY', 'SECURITY_RISK', 'HUMAN_ERROR', 'SYSTEM_MISCONFIGURATION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AutomationIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AutomationIncidentStatus" AS ENUM ('OPEN', 'MITIGATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AutomationDetectionSource" AS ENUM ('SYSTEM', 'HUMAN');

-- CreateEnum
CREATE TYPE "AutomationExecutionKillSwitchTarget" AS ENUM ('APPROVAL_DECISION', 'EXECUTION');

-- CreateEnum
CREATE TYPE "AutomationRollbackStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "TenantPersona" AS ENUM ('RETAILER_DEALER', 'PRODUCT_BRAND_OWNER', 'CREATOR_INFLUENCER', 'MEDIA_PLATFORM', 'SERVICE_PROVIDER', 'MEMBERSHIP_PROGRAM', 'AFFILIATE_MARKETER', 'MARKETING_AGENCY', 'SALES_REP_ORG', 'WHITE_LABEL_BUILDER');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('in_progress', 'completed');

-- CreateEnum
CREATE TYPE "AISuggestionStatus" AS ENUM ('pending', 'approved', 'rejected', 'executed', 'failed');

-- CreateTable
CREATE TABLE "AIAgentBudget" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "brandId" TEXT,
    "tenantId" TEXT,
    "dailyBudgetUsd" DOUBLE PRECISION,
    "monthlyBudgetUsd" DOUBLE PRECISION,
    "tokenLimit" INTEGER,
    "alertThreshold" DOUBLE PRECISION DEFAULT 0.8,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgentBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgentConfig" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "osScope" TEXT,
    "configJson" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIBannedAction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "severity" "AIRiskLevel",
    "scope" TEXT,
    "mitigation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIBannedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIExecutionLog" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "agentName" TEXT,
    "namespace" TEXT,
    "model" TEXT,
    "provider" TEXT,
    "status" "AIExecutionStatus" NOT NULL,
    "riskLevel" "AIRiskLevel",
    "latencyMs" INTEGER,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "promptPreview" TEXT,
    "outputPreview" TEXT,
    "errorMessage" TEXT,
    "brandId" TEXT,
    "tenantId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "os" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "summary" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AILearningJournal" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "brandId" TEXT,
    "source" TEXT,
    "eventType" TEXT,
    "inputSnapshotJson" TEXT,
    "outputSnapshotJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AILearningJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMonitoringEvent" (
    "id" TEXT NOT NULL,
    "category" "AIMonitoringCategory" NOT NULL,
    "status" TEXT,
    "metric" JSONB,
    "agentName" TEXT,
    "engine" TEXT,
    "namespace" TEXT,
    "riskLevel" "AIRiskLevel",
    "brandId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIMonitoringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPricingHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "channel" TEXT,
    "oldNet" DECIMAL(65,30),
    "newNet" DECIMAL(65,30),
    "aiAgent" TEXT,
    "confidenceScore" DECIMAL(65,30),
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPricingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPromptFirewallRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matcherType" TEXT NOT NULL,
    "matcherValue" TEXT NOT NULL,
    "action" "AIPromptAction" NOT NULL,
    "reason" TEXT,
    "severity" "AIRiskLevel",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPromptFirewallRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIReport" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "title" TEXT NOT NULL,
    "scope" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRestrictionPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rulesJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRestrictionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISafetyConstraint" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "scope" TEXT,
    "description" TEXT,
    "ruleJson" TEXT,
    "allowedActionsJson" TEXT,
    "restrictedDomainsJson" TEXT,
    "riskScore" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISafetyConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISafetyEvent" (
    "id" TEXT NOT NULL,
    "type" "AISafetyEventType" NOT NULL,
    "action" TEXT,
    "ruleId" TEXT,
    "runId" TEXT,
    "agentName" TEXT,
    "namespace" TEXT,
    "riskLevel" "AIRiskLevel",
    "decision" TEXT,
    "detail" JSONB,
    "brandId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISafetyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" "AISuggestionStatus" NOT NULL DEFAULT 'pending',
    "requiredApprovalRole" TEXT NOT NULL,
    "inputSnapshotJson" TEXT NOT NULL,
    "proposedOutputJson" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "userId" TEXT,
    "module" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "severity" TEXT,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "userId" TEXT,
    "personId" TEXT,
    "tierId" TEXT,
    "code" TEXT,
    "type" TEXT,
    "channel" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateConversion" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "affiliateId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DECIMAL(65,30),
    "currency" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "linkCode" TEXT NOT NULL,
    "targetUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliatePayout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amount" DECIMAL(65,30),
    "currency" TEXT,
    "status" TEXT,
    "paidAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "method" TEXT,
    "notes" TEXT,
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliatePerformance" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "period" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliatePerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateSale" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "productId" TEXT,
    "orderValue" DECIMAL(65,30),
    "commission" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceSegment" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "filters" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudienceSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationActionRun" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "actionIndex" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" "AutomationActionRunStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "dedupKey" TEXT NOT NULL,
    "actionConfigJson" JSONB NOT NULL,
    "resultJson" JSONB,
    "errorJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationActionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationApprovalDecision" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT,
    "status" "AutomationApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "snapshotHash" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationBrandKillSwitch" (
    "brandId" TEXT NOT NULL,
    "tenantId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "activatedById" TEXT,
    "activatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationBrandKillSwitch_pkey" PRIMARY KEY ("brandId")
);

-- CreateTable
CREATE TABLE "AutomationExecutionKillSwitch" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "AutomationExecutionKillSwitchTarget" NOT NULL,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatedById" TEXT,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationExecutionKillSwitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationExecutionLedger" (
    "id" TEXT NOT NULL,
    "approvalDecisionId" TEXT NOT NULL,
    "suggestionId" TEXT,
    "snapshotHash" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "executedById" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "AutomationExecutionResult" NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "actionType" TEXT NOT NULL,
    "actionPayloadJson" JSONB,
    "metadataJson" JSONB,

    CONSTRAINT "AutomationExecutionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationExecutionLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "eventName" TEXT,
    "status" TEXT NOT NULL,
    "resultJson" TEXT,
    "errorMessage" TEXT,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationIncident" (
    "incidentId" TEXT NOT NULL,
    "type" "AutomationIncidentType" NOT NULL,
    "severity" "AutomationIncidentSeverity" NOT NULL,
    "status" "AutomationIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detectedBy" "AutomationDetectionSource" NOT NULL,
    "detectedById" TEXT,
    "metadataJson" JSONB,
    "relatedExecutionId" TEXT,
    "relatedApprovalDecisionId" TEXT,
    "mitigationNotesJson" JSONB,
    "resolutionNotesJson" JSONB,
    "mitigatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationIncident_pkey" PRIMARY KEY ("incidentId")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "eventName" TEXT,
    "ruleId" TEXT,
    "workflowId" TEXT,
    "result" TEXT,
    "detailsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRollbackExecutionLedger" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "snapshotReference" TEXT NOT NULL,
    "scopeDescription" TEXT NOT NULL,
    "status" "AutomationRollbackStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT,
    "executedAt" TIMESTAMP(3),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRollbackExecutionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "state" "AutomationRuleLifecycleState" NOT NULL DEFAULT 'DRAFT',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "triggerEvent" TEXT,
    "triggerType" TEXT,
    "actionsJson" JSONB,
    "conditionsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRuleVersion" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "conditionConfigJson" JSONB NOT NULL,
    "actionsConfigJson" JSONB NOT NULL,
    "metaSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "state" "AutomationRuleLifecycleState" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "AutomationRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleVersionId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventId" TEXT,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "summaryJson" JSONB,
    "errorJson" JSONB,
    "triggerEventJson" JSONB,
    "conditionsJson" JSONB,
    "actionsJson" JSONB,
    "ruleMetaJson" JSONB,
    "dedupKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "countryOfOrigin" TEXT,
    "defaultCurrency" TEXT,
    "settingsJson" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAIConfig" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "aiPersonality" TEXT,
    "aiTone" TEXT,
    "aiContentStyle" TEXT,
    "aiPricingStyle" TEXT,
    "aiEnabledActionsJson" TEXT,
    "aiBlockedTopicsJson" TEXT,
    "aiModelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandAIConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandCategory" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandIdentity" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "vision" TEXT,
    "mission" TEXT,
    "values" TEXT,
    "toneOfVoice" TEXT,
    "persona" TEXT,
    "brandStory" TEXT,
    "keywords" TEXT,
    "colorPalette" TEXT,
    "packagingStyle" TEXT,
    "socialProfilesJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProduct" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "lifecycleStage" TEXT DEFAULT 'concept',
    "barcode" TEXT,
    "ean" TEXT,
    "upc" TEXT,
    "qrCodeUrl" TEXT,
    "tags" JSONB,
    "marketingProfileJson" TEXT,
    "seoProfileJson" TEXT,
    "distributionProfileJson" TEXT,
    "complianceProfileJson" TEXT,
    "localizationProfileJson" TEXT,
    "socialProofJson" TEXT,
    "analyticsProfileJson" TEXT,
    "complianceDocIds" JSONB,
    "specDocIds" JSONB,
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mediaIds" JSONB,

    CONSTRAINT "BrandProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandRules" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "namingRules" TEXT,
    "descriptionRules" TEXT,
    "marketingRules" TEXT,
    "discountRules" TEXT,
    "pricingConstraints" TEXT,
    "restrictedWords" TEXT,
    "allowedWords" TEXT,
    "aiRestrictions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRMSegment" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "filterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CRMSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRMTask" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT,
    "assignedToId" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CRMTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "channelId" TEXT,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "budget" DECIMAL(65,30),
    "status" TEXT,
    "targetSegmentIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignInteraction" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignLeadAttribution" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "brandId" TEXT,
    "leadId" TEXT,
    "customerId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignLeadAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "vatNumber" TEXT,
    "country" TEXT,
    "city" TEXT,
    "website" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "competitor" TEXT NOT NULL,
    "marketplace" TEXT,
    "country" TEXT,
    "priceNet" DECIMAL(65,30),
    "priceGross" DECIMAL(65,30),
    "currency" TEXT,
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorSocialReport" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "productId" TEXT,
    "competitor" TEXT,
    "period" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorSocialReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmCustomer" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "leadId" TEXT NOT NULL,
    "personId" TEXT,
    "companyId" TEXT,
    "firstOrderId" TEXT,
    "firstRevenueRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "leadId" TEXT,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "value" DECIMAL(65,30),
    "currency" TEXT,
    "status" TEXT,
    "expectedCloseDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerKpi" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30),
    "totalUnits" INTEGER NOT NULL DEFAULT 0,
    "activeStands" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION,
    "lastOrderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EInvoice" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "xmlData" TEXT NOT NULL,
    "validationErrors" JSONB,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "peppolSent" BOOLEAN NOT NULL DEFAULT false,
    "peppolMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceExpense" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceInvoice" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "customerId" TEXT,
    "externalId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialKPIRecord" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "period" TEXT,
    "metrics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialKPIRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerCampaignLink" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "influencerId" TEXT NOT NULL,
    "campaignId" TEXT,
    "role" TEXT,
    "trackingUrl" TEXT,
    "performanceJson" TEXT,
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerCampaignLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerDiscoveryTask" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "query" TEXT,
    "categories" TEXT,
    "platforms" TEXT,
    "status" TEXT DEFAULT 'queued',
    "resultCount" INTEGER,
    "requestedByUserId" TEXT,
    "findingsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerDiscoveryTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerNegotiation" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "influencerId" TEXT,
    "status" TEXT DEFAULT 'draft',
    "lastSuggestedAt" TIMESTAMP(3),
    "termsJson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerNegotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerProfile" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "handle" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "followers" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "profileUrl" TEXT,
    "tags" TEXT,
    "displayName" TEXT,
    "category" TEXT,
    "country" TEXT,
    "language" TEXT,
    "contactEmail" TEXT,
    "audienceJson" TEXT,
    "authenticityScore" DOUBLE PRECISION,
    "fakeFollowerRisk" DOUBLE PRECISION,
    "marketFitScore" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "status" TEXT DEFAULT 'active',
    "riskNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerStatSnapshot" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "brandId" TEXT,
    "followers" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "fakeFollowerPct" DOUBLE PRECISION,
    "audienceMatchScore" DOUBLE PRECISION,
    "marketFitScore" DOUBLE PRECISION,
    "authenticityScore" DOUBLE PRECISION,
    "avgViews" INTEGER,
    "metricsJson" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerStatSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "customerType" TEXT NOT NULL,
    "customerId" TEXT,
    "status" TEXT,
    "totalNet" DECIMAL(65,30),
    "totalGross" DECIMAL(65,30),
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCategory" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "title" TEXT NOT NULL,
    "categoryId" TEXT,
    "productId" TEXT,
    "campaignId" TEXT,
    "content" TEXT,
    "summary" TEXT,
    "sourceType" TEXT,
    "language" TEXT,
    "fileUrl" TEXT,
    "storageKey" TEXT,
    "faqJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeTag" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "personId" TEXT,
    "companyId" TEXT,
    "sourceId" TEXT,
    "status" TEXT,
    "score" INTEGER,
    "pipelineId" TEXT,
    "stageId" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyCustomer" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "userId" TEXT,
    "personId" TEXT,
    "programId" TEXT NOT NULL,
    "tierId" TEXT,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "rulesJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "programId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "costPoints" INTEGER,
    "pointsCost" INTEGER,
    "rewardType" TEXT,
    "payloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL,
    "maxPoints" INTEGER,
    "benefitsDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "customerId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT,
    "pointsChange" INTEGER NOT NULL,
    "reason" TEXT,
    "sourceEntity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingPerformanceLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "spend" DECIMAL(65,30),
    "conversions" INTEGER,
    "revenue" DECIMAL(65,30),
    "kpiJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingPerformanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "userId" TEXT,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT DEFAULT 'unread',
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT,
    "dataJson" TEXT,
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "code" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "subject" TEXT,
    "body" TEXT,
    "variablesJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationsTask" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationsTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "tierId" TEXT,
    "settingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerContract" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "termsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerOrder" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "partnerId" TEXT NOT NULL,
    "status" TEXT,
    "total" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerPricing" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "netPrice" DECIMAL(65,30),
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerTier" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "benefits" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerUser" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "tags" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "featuresJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rulesJson" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enabled',
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPriceDraft" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "channel" TEXT NOT NULL,
    "oldNet" DECIMAL(65,30),
    "newNet" DECIMAL(65,30),
    "status" TEXT DEFAULT 'DRAFT',
    "statusReason" TEXT,
    "currency" TEXT,
    "mapPrice" DECIMAL(65,30),
    "marginTarget" DECIMAL(65,30),
    "guardrailMinMargin" DECIMAL(65,30),
    "guardrailMaxDiscount" DECIMAL(65,30),
    "createdById" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPriceDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPricing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "cogsEur" DECIMAL(65,30),
    "fullCostEur" DECIMAL(65,30),
    "b2cNet" DECIMAL(65,30),
    "b2cGross" DECIMAL(65,30),
    "dealerNet" DECIMAL(65,30),
    "dealerPlusNet" DECIMAL(65,30),
    "standPartnerNet" DECIMAL(65,30),
    "distributorNet" DECIMAL(65,30),
    "amazonNet" DECIMAL(65,30),
    "ebayNet" DECIMAL(65,30),
    "uvpNet" DECIMAL(65,30),
    "vatPct" DECIMAL(65,30),
    "mapPrice" DECIMAL(65,30),
    "marginTarget" DECIMAL(65,30),
    "guardrailMinMargin" DECIMAL(65,30),
    "guardrailMaxDiscount" DECIMAL(65,30),
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueRecord" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "productId" TEXT,
    "channel" TEXT,
    "amount" DECIMAL(65,30),
    "currency" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardId" TEXT,
    "programId" TEXT,
    "pointsSpent" INTEGER NOT NULL,
    "status" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLead" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "repId" TEXT NOT NULL,
    "leadId" TEXT,
    "companyId" TEXT,
    "territoryId" TEXT,
    "source" TEXT,
    "score" DECIMAL,
    "stage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "nextAction" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "repId" TEXT,
    "partnerId" TEXT,
    "status" TEXT,
    "total" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRep" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "userId" TEXT,
    "code" TEXT,
    "region" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesRep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRepKpiSnapshot" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "repId" TEXT NOT NULL,
    "period" TEXT,
    "metricsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesRepKpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesVisit" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "repId" TEXT NOT NULL,
    "partnerId" TEXT,
    "date" TIMESTAMP(3),
    "purpose" TEXT,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMention" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "productId" TEXT,
    "platform" TEXT NOT NULL,
    "author" TEXT,
    "keyword" TEXT,
    "content" TEXT,
    "sentiment" TEXT,
    "url" TEXT,
    "occurredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialTrend" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "productId" TEXT,
    "topic" TEXT NOT NULL,
    "platform" TEXT,
    "score" DOUBLE PRECISION,
    "trendDataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stand" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "standPartnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "standType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandInventory" (
    "id" TEXT NOT NULL,
    "standUnitId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "standLocationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastRefillAt" TIMESTAMP(3),

    CONSTRAINT "StandInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandKpi" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "standId" TEXT NOT NULL,
    "totalSales" DECIMAL(65,30),
    "totalUnits" INTEGER NOT NULL DEFAULT 0,
    "stockOutEvents" INTEGER NOT NULL DEFAULT 0,
    "lastSaleAt" TIMESTAMP(3),
    "lastStockOutAt" TIMESTAMP(3),
    "regressionScore" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandLocation" (
    "id" TEXT NOT NULL,
    "standId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "region" TEXT,
    "geoLocationJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandOrder" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "standPartnerId" TEXT NOT NULL,
    "status" TEXT,
    "total" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "standId" TEXT,
    "standLocationId" TEXT,
    "orderSource" TEXT,

    CONSTRAINT "StandOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandPartner" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "partnerId" TEXT NOT NULL,
    "standType" TEXT,
    "locationAddress" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandPerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "standId" TEXT,
    "standLocationId" TEXT,
    "period" TEXT,
    "metricsJson" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandPerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandRefillItem" (
    "id" TEXT NOT NULL,
    "refillOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost" DECIMAL,
    "refillSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandRefillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandRefillOrder" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "standId" TEXT,
    "standLocationId" TEXT,
    "partnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "expectedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "carrierInfoJson" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandRefillOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandUnit" (
    "id" TEXT NOT NULL,
    "standPartnerId" TEXT NOT NULL,
    "code" TEXT,
    "locationDescription" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "standId" TEXT,

    CONSTRAINT "StandUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "planId" TEXT NOT NULL,
    "defaultBrandId" TEXT,
    "settingsJson" TEXT,
    "planOverridesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantOnboardingProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "persona" "TenantPersona" NOT NULL,
    "selectedPlanKey" TEXT NOT NULL,
    "selectedModulesJson" JSONB,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'in_progress',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantOnboardingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPlanChange" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromPlanId" TEXT,
    "toPlanId" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantPlanChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "createdByUserId" TEXT,
    "contactId" TEXT,
    "assignedToUserId" TEXT,
    "status" TEXT,
    "channel" TEXT,
    "locale" TEXT,
    "source" TEXT,
    "priority" TEXT,
    "category" TEXT,
    "metadataJson" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAssignment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "brandId" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tenantId" TEXT,
    "brandId" TEXT,
    "rolesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualOfficeActionItem" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "meetingId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "owner" TEXT,
    "dueDate" TIMESTAMP(3),
    "impact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualOfficeActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualOfficeMeeting" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "topic" TEXT NOT NULL,
    "scope" TEXT,
    "summary" TEXT,
    "details" TEXT,
    "departmentsJson" TEXT,
    "agendaJson" TEXT,
    "actionItemsJson" TEXT,
    "risksJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualOfficeMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceSession" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "tenantId" TEXT,
    "ticketId" TEXT,
    "channel" TEXT,
    "locale" TEXT,
    "status" TEXT DEFAULT 'ONGOING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "summary" TEXT,
    "sentiment" TEXT,
    "tagsJson" TEXT,
    "handoffTarget" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceTranscript" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT,
    "text" TEXT,
    "audioUrl" TEXT,
    "locale" TEXT,
    "actionJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelBrand" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "ownerPartnerId" TEXT,
    "ownerAffiliateId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT,
    "settingsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelOrder" (
    "id" TEXT NOT NULL,
    "wlBrandId" TEXT NOT NULL,
    "status" TEXT,
    "total" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelProduct" (
    "id" TEXT NOT NULL,
    "wlBrandId" TEXT NOT NULL,
    "baseProductId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "lifecycleStage" TEXT DEFAULT 'concept',
    "distributionJson" TEXT,
    "seoJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIAgentBudget_brandId_idx" ON "AIAgentBudget"("brandId");

-- CreateIndex
CREATE INDEX "AIAgentBudget_tenantId_idx" ON "AIAgentBudget"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AIAgentBudget_agentName_brandId_tenantId_key" ON "AIAgentBudget"("agentName", "brandId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AIAgentConfig_name_key" ON "AIAgentConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AIBannedAction_code_key" ON "AIBannedAction"("code");

-- CreateIndex
CREATE INDEX "AIExecutionLog_brandId_idx" ON "AIExecutionLog"("brandId");

-- CreateIndex
CREATE INDEX "AIExecutionLog_tenantId_idx" ON "AIExecutionLog"("tenantId");

-- CreateIndex
CREATE INDEX "AIExecutionLog_namespace_idx" ON "AIExecutionLog"("namespace");

-- CreateIndex
CREATE INDEX "AIExecutionLog_agentName_idx" ON "AIExecutionLog"("agentName");

-- CreateIndex
CREATE INDEX "AIExecutionLog_status_idx" ON "AIExecutionLog"("status");

-- CreateIndex
CREATE INDEX "AIExecutionLog_createdAt_idx" ON "AIExecutionLog"("createdAt");

-- CreateIndex
CREATE INDEX "AILearningJournal_brandId_idx" ON "AILearningJournal"("brandId");

-- CreateIndex
CREATE INDEX "AILearningJournal_productId_idx" ON "AILearningJournal"("productId");

-- CreateIndex
CREATE INDEX "AIMonitoringEvent_category_idx" ON "AIMonitoringEvent"("category");

-- CreateIndex
CREATE INDEX "AIMonitoringEvent_brandId_idx" ON "AIMonitoringEvent"("brandId");

-- CreateIndex
CREATE INDEX "AIMonitoringEvent_tenantId_idx" ON "AIMonitoringEvent"("tenantId");

-- CreateIndex
CREATE INDEX "AIMonitoringEvent_createdAt_idx" ON "AIMonitoringEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AIPricingHistory_productId_idx" ON "AIPricingHistory"("productId");

-- CreateIndex
CREATE INDEX "AIPricingHistory_brandId_idx" ON "AIPricingHistory"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "AISafetyConstraint_code_key" ON "AISafetyConstraint"("code");

-- CreateIndex
CREATE INDEX "AISafetyEvent_type_idx" ON "AISafetyEvent"("type");

-- CreateIndex
CREATE INDEX "AISafetyEvent_brandId_idx" ON "AISafetyEvent"("brandId");

-- CreateIndex
CREATE INDEX "AISafetyEvent_tenantId_idx" ON "AISafetyEvent"("tenantId");

-- CreateIndex
CREATE INDEX "AISafetyEvent_createdAt_idx" ON "AISafetyEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AISuggestion_tenantId_idx" ON "AISuggestion"("tenantId");

-- CreateIndex
CREATE INDEX "AISuggestion_brandId_idx" ON "AISuggestion"("brandId");

-- CreateIndex
CREATE INDEX "AISuggestion_status_idx" ON "AISuggestion"("status");

-- CreateIndex
CREATE INDEX "AISuggestion_correlationId_idx" ON "AISuggestion"("correlationId");

-- CreateIndex
CREATE INDEX "ActivityLog_brandId_idx" ON "ActivityLog"("brandId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_code_key" ON "Affiliate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_linkCode_key" ON "AffiliateLink"("linkCode");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationActionRun_dedupKey_key" ON "AutomationActionRun"("dedupKey");

-- CreateIndex
CREATE INDEX "AutomationActionRun_runId_idx" ON "AutomationActionRun"("runId");

-- CreateIndex
CREATE INDEX "AutomationApprovalDecision_status_idx" ON "AutomationApprovalDecision"("status");

-- CreateIndex
CREATE INDEX "AutomationExecutionKillSwitch_targetId_targetType_idx" ON "AutomationExecutionKillSwitch"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "AutomationExecutionKillSwitch_incidentId_idx" ON "AutomationExecutionKillSwitch"("incidentId");

-- CreateIndex
CREATE INDEX "AutomationExecutionLedger_approvalDecisionId_idx" ON "AutomationExecutionLedger"("approvalDecisionId");

-- CreateIndex
CREATE INDEX "AutomationExecutionLedger_executedById_idx" ON "AutomationExecutionLedger"("executedById");

-- CreateIndex
CREATE INDEX "AutomationIncident_relatedExecutionId_idx" ON "AutomationIncident"("relatedExecutionId");

-- CreateIndex
CREATE INDEX "AutomationIncident_relatedApprovalDecisionId_idx" ON "AutomationIncident"("relatedApprovalDecisionId");

-- CreateIndex
CREATE INDEX "AutomationRollbackExecutionLedger_executionId_idx" ON "AutomationRollbackExecutionLedger"("executionId");

-- CreateIndex
CREATE INDEX "AutomationRollbackExecutionLedger_incidentId_idx" ON "AutomationRollbackExecutionLedger"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRuleVersion_ruleId_versionNumber_key" ON "AutomationRuleVersion"("ruleId", "versionNumber");

-- CreateIndex
CREATE INDEX "AutomationRun_ruleId_idx" ON "AutomationRun"("ruleId");

-- CreateIndex
CREATE INDEX "AutomationRun_ruleVersionId_idx" ON "AutomationRun"("ruleVersionId");

-- CreateIndex
CREATE INDEX "AutomationRun_eventId_idx" ON "AutomationRun"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BrandAIConfig_brandId_key" ON "BrandAIConfig"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandCategory_slug_key" ON "BrandCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BrandIdentity_brandId_key" ON "BrandIdentity"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandProduct_slug_key" ON "BrandProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BrandProduct_sku_key" ON "BrandProduct"("sku");

-- CreateIndex
CREATE INDEX "BrandProduct_brandId_idx" ON "BrandProduct"("brandId");

-- CreateIndex
CREATE INDEX "BrandProduct_categoryId_idx" ON "BrandProduct"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandRules_brandId_key" ON "BrandRules"("brandId");

-- CreateIndex
CREATE INDEX "CampaignInteraction_campaignId_idx" ON "CampaignInteraction"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignInteraction_leadId_idx" ON "CampaignInteraction"("leadId");

-- CreateIndex
CREATE INDEX "CampaignInteraction_customerId_idx" ON "CampaignInteraction"("customerId");

-- CreateIndex
CREATE INDEX "CampaignLeadAttribution_campaignId_idx" ON "CampaignLeadAttribution"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignLeadAttribution_leadId_idx" ON "CampaignLeadAttribution"("leadId");

-- CreateIndex
CREATE INDEX "CampaignLeadAttribution_customerId_idx" ON "CampaignLeadAttribution"("customerId");

-- CreateIndex
CREATE INDEX "CampaignLeadAttribution_brandId_idx" ON "CampaignLeadAttribution"("brandId");

-- CreateIndex
CREATE INDEX "CompetitorPrice_productId_idx" ON "CompetitorPrice"("productId");

-- CreateIndex
CREATE INDEX "CompetitorPrice_brandId_idx" ON "CompetitorPrice"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorPrice_productId_competitor_marketplace_country_key" ON "CompetitorPrice"("productId", "competitor", "marketplace", "country");

-- CreateIndex
CREATE INDEX "CompetitorSocialReport_productId_idx" ON "CompetitorSocialReport"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmCustomer_leadId_key" ON "CrmCustomer"("leadId");

-- CreateIndex
CREATE INDEX "CrmCustomer_leadId_idx" ON "CrmCustomer"("leadId");

-- CreateIndex
CREATE INDEX "CrmCustomer_brandId_idx" ON "CrmCustomer"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerKpi_partnerId_brandId_key" ON "DealerKpi"("partnerId", "brandId");

-- CreateIndex
CREATE INDEX "EInvoice_invoiceId_idx" ON "EInvoice"("invoiceId");

-- CreateIndex
CREATE INDEX "FinanceExpense_brandId_idx" ON "FinanceExpense"("brandId");

-- CreateIndex
CREATE INDEX "FinanceInvoice_brandId_idx" ON "FinanceInvoice"("brandId");

-- CreateIndex
CREATE INDEX "InfluencerCampaignLink_brandId_idx" ON "InfluencerCampaignLink"("brandId");

-- CreateIndex
CREATE INDEX "InfluencerCampaignLink_influencerId_idx" ON "InfluencerCampaignLink"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerCampaignLink_campaignId_idx" ON "InfluencerCampaignLink"("campaignId");

-- CreateIndex
CREATE INDEX "InfluencerDiscoveryTask_brandId_idx" ON "InfluencerDiscoveryTask"("brandId");

-- CreateIndex
CREATE INDEX "InfluencerDiscoveryTask_requestedByUserId_idx" ON "InfluencerDiscoveryTask"("requestedByUserId");

-- CreateIndex
CREATE INDEX "InfluencerNegotiation_brandId_idx" ON "InfluencerNegotiation"("brandId");

-- CreateIndex
CREATE INDEX "InfluencerNegotiation_influencerId_idx" ON "InfluencerNegotiation"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerStatSnapshot_influencerId_idx" ON "InfluencerStatSnapshot"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerStatSnapshot_brandId_idx" ON "InfluencerStatSnapshot"("brandId");

-- CreateIndex
CREATE INDEX "InventoryItem_brandId_idx" ON "InventoryItem"("brandId");

-- CreateIndex
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryItem_productId_idx" ON "InventoryItem"("productId");

-- CreateIndex
CREATE INDEX "InventoryItem_createdAt_idx" ON "InventoryItem"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_brandId_idx" ON "Notification"("brandId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_code_key" ON "NotificationTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");

-- CreateIndex
CREATE INDEX "ProductPriceDraft_productId_idx" ON "ProductPriceDraft"("productId");

-- CreateIndex
CREATE INDEX "ProductPriceDraft_brandId_idx" ON "ProductPriceDraft"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPricing_productId_key" ON "ProductPricing"("productId");

-- CreateIndex
CREATE INDEX "ProductPricing_brandId_idx" ON "ProductPricing"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "SalesLead_brandId_index" ON "SalesLead"("brandId");

-- CreateIndex
CREATE INDEX "SalesLead_repId_index" ON "SalesLead"("repId");

-- CreateIndex
CREATE INDEX "SalesLead_territoryId_index" ON "SalesLead"("territoryId");

-- CreateIndex
CREATE INDEX "SalesRepKpiSnapshot_brandId_index" ON "SalesRepKpiSnapshot"("brandId");

-- CreateIndex
CREATE INDEX "SalesRepKpiSnapshot_repId_index" ON "SalesRepKpiSnapshot"("repId");

-- CreateIndex
CREATE INDEX "SocialMention_productId_idx" ON "SocialMention"("productId");

-- CreateIndex
CREATE INDEX "SocialTrend_productId_idx" ON "SocialTrend"("productId");

-- CreateIndex
CREATE INDEX "Stand_brandId_index" ON "Stand"("brandId");

-- CreateIndex
CREATE INDEX "Stand_standPartnerId_index" ON "Stand"("standPartnerId");

-- CreateIndex
CREATE INDEX "StandInventory_standLocationId_index" ON "StandInventory"("standLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "StandKpi_standId_brandId_key" ON "StandKpi"("standId", "brandId");

-- CreateIndex
CREATE INDEX "StandLocation_city_country_index" ON "StandLocation"("city", "country");

-- CreateIndex
CREATE INDEX "StandLocation_standId_index" ON "StandLocation"("standId");

-- CreateIndex
CREATE INDEX "StandOrder_standId_index" ON "StandOrder"("standId");

-- CreateIndex
CREATE INDEX "StandOrder_standLocationId_index" ON "StandOrder"("standLocationId");

-- CreateIndex
CREATE INDEX "StandPerformanceSnapshot_brandId_index" ON "StandPerformanceSnapshot"("brandId");

-- CreateIndex
CREATE INDEX "StandPerformanceSnapshot_standId_index" ON "StandPerformanceSnapshot"("standId");

-- CreateIndex
CREATE INDEX "StandPerformanceSnapshot_standLocationId_index" ON "StandPerformanceSnapshot"("standLocationId");

-- CreateIndex
CREATE INDEX "StandRefillOrder_brandId_index" ON "StandRefillOrder"("brandId");

-- CreateIndex
CREATE INDEX "StandRefillOrder_standId_index" ON "StandRefillOrder"("standId");

-- CreateIndex
CREATE INDEX "StandRefillOrder_standLocationId_index" ON "StandRefillOrder"("standLocationId");

-- CreateIndex
CREATE INDEX "StandUnit_standId_index" ON "StandUnit"("standId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "TenantOnboardingProfile_tenantId_idx" ON "TenantOnboardingProfile"("tenantId");

-- CreateIndex
CREATE INDEX "TenantOnboardingProfile_userId_idx" ON "TenantOnboardingProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantOnboardingProfile_tenantId_userId_status_key" ON "TenantOnboardingProfile"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "TenantPlanChange_tenantId_idx" ON "TenantPlanChange"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPlanChange_changedByUserId_idx" ON "TenantPlanChange"("changedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_brandId_idx" ON "User"("brandId");

-- CreateIndex
CREATE INDEX "VirtualOfficeActionItem_brandId_idx" ON "VirtualOfficeActionItem"("brandId");

-- CreateIndex
CREATE INDEX "VirtualOfficeActionItem_meetingId_idx" ON "VirtualOfficeActionItem"("meetingId");

-- CreateIndex
CREATE INDEX "VirtualOfficeMeeting_brandId_idx" ON "VirtualOfficeMeeting"("brandId");

-- CreateIndex
CREATE INDEX "VoiceSession_brandId_idx" ON "VoiceSession"("brandId");

-- CreateIndex
CREATE INDEX "VoiceSession_tenantId_idx" ON "VoiceSession"("tenantId");

-- CreateIndex
CREATE INDEX "VoiceSession_ticketId_idx" ON "VoiceSession"("ticketId");

-- CreateIndex
CREATE INDEX "VoiceTranscript_sessionId_idx" ON "VoiceTranscript"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelBrand_slug_key" ON "WhiteLabelBrand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelProduct_sku_key" ON "WhiteLabelProduct"("sku");

-- AddForeignKey
ALTER TABLE "AIAgentBudget" ADD CONSTRAINT "AIAgentBudget_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentBudget" ADD CONSTRAINT "AIAgentBudget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentConfig" ADD CONSTRAINT "AIAgentConfig_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecutionLog" ADD CONSTRAINT "AIExecutionLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecutionLog" ADD CONSTRAINT "AIExecutionLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AILearningJournal" ADD CONSTRAINT "AILearningJournal_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AILearningJournal" ADD CONSTRAINT "AILearningJournal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMonitoringEvent" ADD CONSTRAINT "AIMonitoringEvent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMonitoringEvent" ADD CONSTRAINT "AIMonitoringEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPricingHistory" ADD CONSTRAINT "AIPricingHistory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPricingHistory" ADD CONSTRAINT "AIPricingHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISafetyEvent" ADD CONSTRAINT "AISafetyEvent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISafetyEvent" ADD CONSTRAINT "AISafetyEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateConversion" ADD CONSTRAINT "AffiliateConversion_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateConversion" ADD CONSTRAINT "AffiliateConversion_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePerformance" ADD CONSTRAINT "AffiliatePerformance_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateSale" ADD CONSTRAINT "AffiliateSale_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateSale" ADD CONSTRAINT "AffiliateSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceSegment" ADD CONSTRAINT "AudienceSegment_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationActionRun" ADD CONSTRAINT "AutomationActionRun_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationApprovalDecision" ADD CONSTRAINT "AutomationApprovalDecision_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "AISuggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationBrandKillSwitch" ADD CONSTRAINT "AutomationBrandKillSwitch_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationBrandKillSwitch" ADD CONSTRAINT "AutomationBrandKillSwitch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecutionKillSwitch" ADD CONSTRAINT "AutomationExecutionKillSwitch_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "AutomationIncident"("incidentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecutionLedger" ADD CONSTRAINT "AutomationExecutionLedger_approvalDecisionId_fkey" FOREIGN KEY ("approvalDecisionId") REFERENCES "AutomationApprovalDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecutionLedger" ADD CONSTRAINT "AutomationExecutionLedger_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecutionLog" ADD CONSTRAINT "AutomationExecutionLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationIncident" ADD CONSTRAINT "AutomationIncident_relatedExecutionId_fkey" FOREIGN KEY ("relatedExecutionId") REFERENCES "AutomationExecutionLedger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationIncident" ADD CONSTRAINT "AutomationIncident_relatedApprovalDecisionId_fkey" FOREIGN KEY ("relatedApprovalDecisionId") REFERENCES "AutomationApprovalDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRollbackExecutionLedger" ADD CONSTRAINT "AutomationRollbackExecutionLedger_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecutionLedger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRollbackExecutionLedger" ADD CONSTRAINT "AutomationRollbackExecutionLedger_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "AutomationIncident"("incidentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRuleVersion" ADD CONSTRAINT "AutomationRuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "AutomationRuleVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAIConfig" ADD CONSTRAINT "BrandAIConfig_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCategory" ADD CONSTRAINT "BrandCategory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandIdentity" ADD CONSTRAINT "BrandIdentity_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProduct" ADD CONSTRAINT "BrandProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProduct" ADD CONSTRAINT "BrandProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BrandCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRules" ADD CONSTRAINT "BrandRules_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CRMSegment" ADD CONSTRAINT "CRMSegment_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CRMTask" ADD CONSTRAINT "CRMTask_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CRMTask" ADD CONSTRAINT "CRMTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorPrice" ADD CONSTRAINT "CompetitorPrice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorPrice" ADD CONSTRAINT "CompetitorPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorSocialReport" ADD CONSTRAINT "CompetitorSocialReport_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorSocialReport" ADD CONSTRAINT "CompetitorSocialReport_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_firstOrderId_fkey" FOREIGN KEY ("firstOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_firstRevenueRecordId_fkey" FOREIGN KEY ("firstRevenueRecordId") REFERENCES "RevenueRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerKpi" ADD CONSTRAINT "DealerKpi_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerKpi" ADD CONSTRAINT "DealerKpi_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EInvoice" ADD CONSTRAINT "EInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialKPIRecord" ADD CONSTRAINT "FinancialKPIRecord_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCampaignLink" ADD CONSTRAINT "InfluencerCampaignLink_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCampaignLink" ADD CONSTRAINT "InfluencerCampaignLink_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCampaignLink" ADD CONSTRAINT "InfluencerCampaignLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerDiscoveryTask" ADD CONSTRAINT "InfluencerDiscoveryTask_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerDiscoveryTask" ADD CONSTRAINT "InfluencerDiscoveryTask_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerNegotiation" ADD CONSTRAINT "InfluencerNegotiation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerNegotiation" ADD CONSTRAINT "InfluencerNegotiation_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerProfile" ADD CONSTRAINT "InfluencerProfile_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerStatSnapshot" ADD CONSTRAINT "InfluencerStatSnapshot_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerStatSnapshot" ADD CONSTRAINT "InfluencerStatSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCategory" ADD CONSTRAINT "KnowledgeCategory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeTag" ADD CONSTRAINT "KnowledgeTag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCustomer" ADD CONSTRAINT "LoyaltyCustomer_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCustomer" ADD CONSTRAINT "LoyaltyCustomer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCustomer" ADD CONSTRAINT "LoyaltyCustomer_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCustomer" ADD CONSTRAINT "LoyaltyCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCustomer" ADD CONSTRAINT "LoyaltyCustomer_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "LoyaltyTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "LoyaltyCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPerformanceLog" ADD CONSTRAINT "MarketingPerformanceLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationsTask" ADD CONSTRAINT "OperationsTask_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "PartnerTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerContract" ADD CONSTRAINT "PartnerContract_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOrder" ADD CONSTRAINT "PartnerOrder_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOrder" ADD CONSTRAINT "PartnerOrder_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOrderItem" ADD CONSTRAINT "PartnerOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PartnerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOrderItem" ADD CONSTRAINT "PartnerOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerPricing" ADD CONSTRAINT "PartnerPricing_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerPricing" ADD CONSTRAINT "PartnerPricing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTier" ADD CONSTRAINT "PartnerTier_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerUser" ADD CONSTRAINT "PartnerUser_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerUser" ADD CONSTRAINT "PartnerUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceDraft" ADD CONSTRAINT "ProductPriceDraft_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceDraft" ADD CONSTRAINT "ProductPriceDraft_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPricing" ADD CONSTRAINT "ProductPricing_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPricing" ADD CONSTRAINT "ProductPricing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueRecord" ADD CONSTRAINT "RevenueRecord_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueRecord" ADD CONSTRAINT "RevenueRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "LoyaltyCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "LoyaltyReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_repId_fkey" FOREIGN KEY ("repId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_repId_fkey" FOREIGN KEY ("repId") REFERENCES "SalesRep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRep" ADD CONSTRAINT "SalesRep_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRep" ADD CONSTRAINT "SalesRep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRepKpiSnapshot" ADD CONSTRAINT "SalesRepKpiSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRepKpiSnapshot" ADD CONSTRAINT "SalesRepKpiSnapshot_repId_fkey" FOREIGN KEY ("repId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVisit" ADD CONSTRAINT "SalesVisit_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVisit" ADD CONSTRAINT "SalesVisit_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVisit" ADD CONSTRAINT "SalesVisit_repId_fkey" FOREIGN KEY ("repId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledJob" ADD CONSTRAINT "ScheduledJob_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMention" ADD CONSTRAINT "SocialMention_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMention" ADD CONSTRAINT "SocialMention_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialTrend" ADD CONSTRAINT "SocialTrend_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialTrend" ADD CONSTRAINT "SocialTrend_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stand" ADD CONSTRAINT "Stand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stand" ADD CONSTRAINT "Stand_standPartnerId_fkey" FOREIGN KEY ("standPartnerId") REFERENCES "StandPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandInventory" ADD CONSTRAINT "StandInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandInventory" ADD CONSTRAINT "StandInventory_standLocationId_fkey" FOREIGN KEY ("standLocationId") REFERENCES "StandLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandInventory" ADD CONSTRAINT "StandInventory_standUnitId_fkey" FOREIGN KEY ("standUnitId") REFERENCES "StandUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandKpi" ADD CONSTRAINT "StandKpi_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandKpi" ADD CONSTRAINT "StandKpi_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandLocation" ADD CONSTRAINT "StandLocation_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandOrder" ADD CONSTRAINT "StandOrder_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandOrder" ADD CONSTRAINT "StandOrder_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandOrder" ADD CONSTRAINT "StandOrder_standLocationId_fkey" FOREIGN KEY ("standLocationId") REFERENCES "StandLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandOrder" ADD CONSTRAINT "StandOrder_standPartnerId_fkey" FOREIGN KEY ("standPartnerId") REFERENCES "StandPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandOrderItem" ADD CONSTRAINT "StandOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StandOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandOrderItem" ADD CONSTRAINT "StandOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandPartner" ADD CONSTRAINT "StandPartner_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandPartner" ADD CONSTRAINT "StandPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandPerformanceSnapshot" ADD CONSTRAINT "StandPerformanceSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandPerformanceSnapshot" ADD CONSTRAINT "StandPerformanceSnapshot_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandPerformanceSnapshot" ADD CONSTRAINT "StandPerformanceSnapshot_standLocationId_fkey" FOREIGN KEY ("standLocationId") REFERENCES "StandLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandRefillItem" ADD CONSTRAINT "StandRefillItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandRefillItem" ADD CONSTRAINT "StandRefillItem_refillOrderId_fkey" FOREIGN KEY ("refillOrderId") REFERENCES "StandRefillOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandRefillOrder" ADD CONSTRAINT "StandRefillOrder_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandRefillOrder" ADD CONSTRAINT "StandRefillOrder_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandRefillOrder" ADD CONSTRAINT "StandRefillOrder_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandRefillOrder" ADD CONSTRAINT "StandRefillOrder_standLocationId_fkey" FOREIGN KEY ("standLocationId") REFERENCES "StandLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandUnit" ADD CONSTRAINT "StandUnit_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandUnit" ADD CONSTRAINT "StandUnit_standPartnerId_fkey" FOREIGN KEY ("standPartnerId") REFERENCES "StandPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_defaultBrandId_fkey" FOREIGN KEY ("defaultBrandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantOnboardingProfile" ADD CONSTRAINT "TenantOnboardingProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantOnboardingProfile" ADD CONSTRAINT "TenantOnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlanChange" ADD CONSTRAINT "TenantPlanChange_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlanChange" ADD CONSTRAINT "TenantPlanChange_fromPlanId_fkey" FOREIGN KEY ("fromPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlanChange" ADD CONSTRAINT "TenantPlanChange_toPlanId_fkey" FOREIGN KEY ("toPlanId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlanChange" ADD CONSTRAINT "TenantPlanChange_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAssignment" ADD CONSTRAINT "TicketAssignment_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAssignment" ADD CONSTRAINT "TicketAssignment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAssignment" ADD CONSTRAINT "TicketAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualOfficeActionItem" ADD CONSTRAINT "VirtualOfficeActionItem_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualOfficeActionItem" ADD CONSTRAINT "VirtualOfficeActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "VirtualOfficeMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualOfficeMeeting" ADD CONSTRAINT "VirtualOfficeMeeting_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceTranscript" ADD CONSTRAINT "VoiceTranscript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelBrand" ADD CONSTRAINT "WhiteLabelBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelBrand" ADD CONSTRAINT "WhiteLabelBrand_ownerAffiliateId_fkey" FOREIGN KEY ("ownerAffiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelBrand" ADD CONSTRAINT "WhiteLabelBrand_ownerPartnerId_fkey" FOREIGN KEY ("ownerPartnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelOrder" ADD CONSTRAINT "WhiteLabelOrder_wlBrandId_fkey" FOREIGN KEY ("wlBrandId") REFERENCES "WhiteLabelBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelProduct" ADD CONSTRAINT "WhiteLabelProduct_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelProduct" ADD CONSTRAINT "WhiteLabelProduct_wlBrandId_fkey" FOREIGN KEY ("wlBrandId") REFERENCES "WhiteLabelBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

