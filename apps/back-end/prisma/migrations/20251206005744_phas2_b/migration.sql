/*
  Warnings:

  - You are about to drop the column `createdById` on the `CRMSegment` table. All the data in the column will be lost.
  - You are about to drop the column `filtersJson` on the `CRMSegment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CRMSegment" DROP COLUMN "createdById",
DROP COLUMN "filtersJson",
ADD COLUMN     "filterJson" JSONB;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "targetSegmentIds" JSONB;
