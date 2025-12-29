-- Stand / POS domain enhancements
CREATE TABLE "Stand" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT,
    "standPartnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "standType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Stand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Stand_standPartnerId_fkey" FOREIGN KEY ("standPartnerId") REFERENCES "StandPartner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Stand_brandId_index" ON "Stand" ("brandId");
CREATE INDEX "Stand_standPartnerId_index" ON "Stand" ("standPartnerId");

CREATE TABLE "StandLocation" (
    "id" TEXT PRIMARY KEY,
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
    CONSTRAINT "StandLocation_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "StandLocation_standId_index" ON "StandLocation" ("standId");
CREATE INDEX "StandLocation_city_country_index" ON "StandLocation" ("city", "country");

ALTER TABLE "StandUnit"
  ADD COLUMN "standId" TEXT;

ALTER TABLE "StandUnit"
  ADD CONSTRAINT "StandUnit_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StandUnit_standId_index" ON "StandUnit" ("standId");

ALTER TABLE "StandInventory"
  ADD COLUMN "standLocationId" TEXT;

ALTER TABLE "StandInventory"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "StandInventory"
  ADD COLUMN "lastRefillAt" TIMESTAMP(3);

ALTER TABLE "StandInventory"
  ADD CONSTRAINT "StandInventory_standLocationId_fkey" FOREIGN KEY ("standLocationId") REFERENCES "StandLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StandInventory_standLocationId_index" ON "StandInventory" ("standLocationId");

ALTER TABLE "StandOrder"
  ADD COLUMN "standId" TEXT;

ALTER TABLE "StandOrder"
  ADD COLUMN "standLocationId" TEXT;

ALTER TABLE "StandOrder"
  ADD COLUMN "orderSource" TEXT;

ALTER TABLE "StandOrder"
  ADD CONSTRAINT "StandOrder_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StandOrder"
  ADD CONSTRAINT "StandOrder_standLocationId_fkey" FOREIGN KEY ("standLocationId") REFERENCES "StandLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StandOrder_standId_index" ON "StandOrder" ("standId");
CREATE INDEX "StandOrder_standLocationId_index" ON "StandOrder" ("standLocationId");

CREATE TABLE "StandPackage" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT,
    "standId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inventoryThresholdsJson" TEXT,
    "pricingJson" TEXT,
    "allowedProductsJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StandPackage_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandPackage_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "StandPackage_brandId_index" ON "StandPackage" ("brandId");
CREATE INDEX "StandPackage_standId_index" ON "StandPackage" ("standId");

CREATE TABLE "StandLoyaltyLedger" (
    "id" TEXT PRIMARY KEY,
    "standPartnerId" TEXT NOT NULL,
    "standId" TEXT,
    "tierId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "bonusEvents" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lastAdjustedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StandLoyaltyLedger_standPartnerId_fkey" FOREIGN KEY ("standPartnerId") REFERENCES "StandPartner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StandLoyaltyLedger_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "StandLoyaltyLedger_standPartnerId_index" ON "StandLoyaltyLedger" ("standPartnerId");
CREATE INDEX "StandLoyaltyLedger_standId_index" ON "StandLoyaltyLedger" ("standId");

CREATE TABLE "StandBonusTrigger" (
    "id" TEXT PRIMARY KEY,
    "standPartnerId" TEXT NOT NULL,
    "standId" TEXT,
    "eventType" TEXT NOT NULL,
    "bonusAmount" DECIMAL,
    "approvedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StandBonusTrigger_standPartnerId_fkey" FOREIGN KEY ("standPartnerId") REFERENCES "StandPartner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StandBonusTrigger_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandBonusTrigger_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "StandBonusTrigger_standPartnerId_index" ON "StandBonusTrigger" ("standPartnerId");
CREATE INDEX "StandBonusTrigger_standId_index" ON "StandBonusTrigger" ("standId");

CREATE TABLE "StandPerformanceSnapshot" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT,
    "standId" TEXT,
    "standLocationId" TEXT,
    "period" TEXT,
    "metricsJson" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StandPerformanceSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandPerformanceSnapshot_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandPerformanceSnapshot_standLocationId_fkey" FOREIGN KEY ("standLocationId") REFERENCES "StandLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "StandPerformanceSnapshot_brandId_index" ON "StandPerformanceSnapshot" ("brandId");
CREATE INDEX "StandPerformanceSnapshot_standId_index" ON "StandPerformanceSnapshot" ("standId");
CREATE INDEX "StandPerformanceSnapshot_standLocationId_index" ON "StandPerformanceSnapshot" ("standLocationId");

CREATE TABLE "StandRefillOrder" (
    "id" TEXT PRIMARY KEY,
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
    CONSTRAINT "StandRefillOrder_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandRefillOrder_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandRefillOrder_standLocationId_fkey" FOREIGN KEY ("standLocationId") REFERENCES "StandLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandRefillOrder_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "StandRefillOrder_brandId_index" ON "StandRefillOrder" ("brandId");
CREATE INDEX "StandRefillOrder_standId_index" ON "StandRefillOrder" ("standId");
CREATE INDEX "StandRefillOrder_standLocationId_index" ON "StandRefillOrder" ("standLocationId");

CREATE TABLE "StandRefillItem" (
    "id" TEXT PRIMARY KEY,
    "refillOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost" DECIMAL,
    "refillSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StandRefillItem_refillOrderId_fkey" FOREIGN KEY ("refillOrderId") REFERENCES "StandRefillOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StandRefillItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Sales Rep domain enhancements
CREATE TABLE "SalesLead" (
    "id" TEXT PRIMARY KEY,
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
    CONSTRAINT "SalesLead_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesLead_repId_fkey" FOREIGN KEY ("repId") REFERENCES "SalesRep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesLead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesLead_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "SalesTerritory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "SalesLead_brandId_index" ON "SalesLead" ("brandId");
CREATE INDEX "SalesLead_repId_index" ON "SalesLead" ("repId");
CREATE INDEX "SalesLead_territoryId_index" ON "SalesLead" ("territoryId");

CREATE TABLE "SalesAccount" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "companyId" TEXT,
    "standPartnerId" TEXT,
    "assignedRepId" TEXT,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastInteractionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesAccount_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesAccount_standPartnerId_fkey" FOREIGN KEY ("standPartnerId") REFERENCES "StandPartner" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesAccount_assignedRepId_fkey" FOREIGN KEY ("assignedRepId") REFERENCES "SalesRep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "SalesAccount_brandId_index" ON "SalesAccount" ("brandId");
CREATE INDEX "SalesAccount_assignedRepId_index" ON "SalesAccount" ("assignedRepId");

CREATE TABLE "SalesCommissionLog" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT,
    "repId" TEXT NOT NULL,
    "orderId" TEXT,
    "rate" DECIMAL,
    "earned" DECIMAL,
    "period" TEXT,
    "status" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesCommissionLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesCommissionLog_repId_fkey" FOREIGN KEY ("repId") REFERENCES "SalesRep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesCommissionLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "SalesCommissionLog_brandId_index" ON "SalesCommissionLog" ("brandId");
CREATE INDEX "SalesCommissionLog_repId_index" ON "SalesCommissionLog" ("repId");

CREATE TABLE "SalesRepKpiSnapshot" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT,
    "repId" TEXT NOT NULL,
    "period" TEXT,
    "metricsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesRepKpiSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesRepKpiSnapshot_repId_fkey" FOREIGN KEY ("repId") REFERENCES "SalesRep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "SalesRepKpiSnapshot_brandId_index" ON "SalesRepKpiSnapshot" ("brandId");
CREATE INDEX "SalesRepKpiSnapshot_repId_index" ON "SalesRepKpiSnapshot" ("repId");
