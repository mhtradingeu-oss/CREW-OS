# Social Intelligence Report

## Overview
- Social mentions, trends, influencers, competitor reports, and AI summaries are now backed by Prisma models (`SocialMention`, `SocialTrend`, `InfluencerProfile`, `CompetitorSocialReport`, and `AIInsight`).
- The new `social_intelligenceService` handles list/filter/pagination for mentions/trends/competitors plus influencer/trend CRUD, and persists AI summaries with `os="social"` for downstream analytics.
- `social-intel.http` documents each endpoint, ensuring tests cover mentions → influencers → trends → competitor reports → AI summary.

## Prisma alignment
- Mentions select platform/author/content/sentiment and filter via `platform`, `sentiment`, `brandId`, and text search on content/author.
- Influencer CRUD touches handles, platforms, followers, engagement, and tags; trends have topic/platform/score/payload stored in `trendDataJson`.
- AI summaries persist to `AIInsight` (`prisma/schema.prisma:2297-2309`) with fields used by the AI Brain dashboards.

## Endpoints
- `GET /social-intelligence/mentions`: paginated list with filters (brand/platform/sentiment/search).  
- `GET /social-intelligence/influencers`: list and manage influencer records via POST/PUT/DELETE.  
- `GET /social-intelligence/trends`: list, plus POST/PUT/DELETE for trend records.  
- `GET /social-intelligence/competitor-reports`: brand/competitor filtered paged list.  
- `GET /social-intelligence/ai/insight`: fetch last stored `AIInsight` for a brand/entity.  
- `POST /social-intelligence/ai/summary`: builds a social prompt, runs `runAIRequest`, and writes `AIInsight` (os=`social`, entityType=mention|trend|influencer|report).

## AI Integration
- Prompt includes brand, entity type/ID, and optional context, instructing the model to produce summary + detail.  
- Failed models produce fallback text; every response saves to `AIInsight` so `ai-brain` services or dashboards can consume audit-ready summaries (`os="social"`).

## Testing notes
- Use `social-intel.http` to seed mentions/trends/influencers, confirm CRUD operations, list competitor reports, and call the AI summary endpoint to fill `AIInsight`.  
- Verify filters respect search/pagination and that the AI insight response closes the loop by listing the new `AIInsight` record via `/social-intelligence/ai/insight`.  
