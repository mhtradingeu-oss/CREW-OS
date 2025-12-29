-- AlterTable
ALTER TABLE "BrandProduct" ADD COLUMN     "complianceDocIds" JSONB,
ADD COLUMN     "mediaIds" JSONB,
ADD COLUMN     "specDocIds" JSONB;

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductPriceDraft" ADD COLUMN     "statusReason" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "updatedAt" DROP DEFAULT;
