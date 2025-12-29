# Marketing OS

## Purpose
Orchestrates AI-first marketing for MH-OS brands: campaign building, content creation, SEO, influencer outreach, analytics, and automation.

## Responsibilities
- Build campaigns (paid/organic), assign budgets, schedule placements, and connect to CRM segments.
- Manage content operations (posts, reels, stories, ads, emails, long-form content) with AI copy and packaging data.
- Monitor performance (CTR, CPM, ROAS, funnel metrics, competitor trends) and feed insights into AI Brain.
- Automate workflows (campaign follow-ups, creative refreshes, influencer pods, social listening alerts).

## Inputs
- Product catalog, pricing changes, competitor intelligence, social listening/trend signals.
- CRM segments and partner data (affiliates, stands, dealers).
- AI recommendations (copy, budgets, SEO adjustments) produced by AI Marketing Engine and AI Content Factory.

## Outputs
- Campaign records, creative content, SEO briefs, performance snapshots, automation triggers (launch, pause, refresh).
- AI-insightful briefs stored in `AIInsight` and piped to Virtual Office + automation queue.
- Notifications for campaign milestones, spend thresholds, or anomalies.

## Internal Components
- Models: `MarketingChannel`, `ContentPlan`, `ContentPlanItem`, `Campaign`, `CampaignAdSet`, `CampaignAd`, `MarketingPerformanceLog`, `TrackingProfile`.
- AI Content Factory + Video Generator + Social Scheduler modules connect to Marketing OS.
- Social Intelligence integration for trend radar (mention detection, influencer scoring).

## Required API Endpoints
- `GET /api/v1/marketing/content-plan`, `POST /api/v1/marketing/content/create`, `POST /api/v1/marketing/campaign/create`, `GET /api/v1/marketing/campaign/metrics/:id`.
- AI: `POST /api/v1/marketing/ai/content-ideas`, `/marketing/ai/seo`, `/marketing/ai/media-buying`, `/marketing/ai/performance-review`.
- Automation hooks: `POST /api/v1/marketing/automation/on-campaign-alert`.

## Required Data Models
- `MarketingChannel`, `ContentPlan`, `Campaign`, `CampaignAdSet`, `CampaignAd`, `MarketingPerformanceLog`, `AIInsight`, `SocialMention`, `InfluencerProfile`.

## Integration Notes
- Connects to CRM for audience segments, to Product/Partner OS for featured SKUs, and to Stand/Affiliate OS for field promotions.
- Sends automation triggers for lifecycle emails, notifications for high spend or performance swings.
- Virtual Office uses AI Marketing insights when launching new campaigns or analyzing ROAS.
