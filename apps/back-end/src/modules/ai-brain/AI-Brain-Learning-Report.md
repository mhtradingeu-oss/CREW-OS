# AI-Brain Learning Report

## Implemented endpoints
- `GET /ai-brain/learning`: brand-scoped learning log list with optional product/event/source filters and pagination.  
- `POST /ai-brain/learning`: writes an `AILearningJournal` entry, storing snapshots in JSON and logging the event.

## DTOs & Schema
- `AILearningLogDTO` mirrors `prisma/schema.prisma:2366-2374`, parsing stored JSON snapshots into JS objects for consumers.  
- Pagination/filters rely on `LearningListParams` (`brandId`, `productId`, `eventType`, `source`, `page`, `pageSize`) and return `LearningListResponse`.

## Prisma mapping
- `listLearningLogs` uses `prisma.aILearningJournal.findMany` with `learningSelect` and counts total rows before returning mapped DTOs.  
- `createLearningLog` writes `inputSnapshotJson`/`outputSnapshotJson`, so the logged data stays consistent with the schema columns.

## Future direction
- Hook the learning logs to future orchestrator enhancements (e.g., feed these journals into training pipelines or alerts).  
- Add UI dashboards summarizing high-frequency event types or product learning streaks.

## Running .http tests
1. Set `@bearerToken` and `@brandId` in `ai-brain.http`.  
2. Run the learning list request to verify pagination.  
3. Post each learning log payload (pricing/campaign) sequentially to ensure persistence and JSON parsing succeed.
