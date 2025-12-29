0. تعريف سريع

MH-OS SUPERAPP هو نظام تشغيل كامل للعلامات التجارية (Brand OS) يُدير:

المنتجات + التسعير + المنافسين

التسويق + CRM + المبيعات + المندوبين

التجار / الشركاء / الستاند / الأفلييت / الولاء

المخزون + المالية

الـ White Label Brands

الأتمتة + الإشعارات + الـ AI Brain + الحوكمة

مبني ليعمل كـ AI-first, Automation-first, Modular OS مع طبقة حوكمة قوية، ويبدأ بعلامة HAIROTICMEN كنموذج أولي، ثم يتوسع لعشرات العلامات.

1. الرؤية والهدف
   1.1 Vision

إنشاء أول Brand Operating System يمكنه تشغيل علامة كاملة شبه ذاتيًا (80–92% من العمليات اليومية تتم عبر AI).

1.2 Mission

توفير منصة واحدة لـ MH Trading UG لإدارة:

المنتجات، التسعير، المخزون، الحملة التسويقية، CRM، المبيعات، الشركاء، الولاء، الأفلييت، الستاند، الـ WL، المالية، الأتمتة، الذكاء الصناعي، الحوكمة.

2. الطبقات المعمارية (6-Layer Architecture)

النظام مقسوم إلى 6 طبقات رئيسية:

Brand Foundation Layer

Brand OS, Brand Identity, Brand Rules, Brand AI Config.

Product Infrastructure Layer

Product OS, Packaging OS, Compliance, Product Docs & Media.

Operating Systems Layer (Business OS)

Pricing, Competitor, CRM, Marketing, Sales Reps, Dealers, Partner, Stand, Affiliate, Loyalty, Inventory, Finance, White Label, Support, Knowledge, Operations, Security & Governance, Admin/SuperAdmin, Automation, Communication, AI Brain, Social Intelligence…

AI Workforce Layer (AI Crew)

AI Pricing Engine, AI CMO, AI CRM Manager, AI Sales Manager, AI Inventory Forecaster, AI Finance Advisor, AI Stand Coach, AI Partner Advisor, AI WL Architect, AI Content Factory, AI SEO…

Automation & Intelligence Layer

Automation OS, Notification OS, Analytics/BI, Social Intelligence, Smart Segmentation.

Platform & Governance Layer

Security & Governance OS, Admin OS, SuperAdmin OS, Multi-brand/region manager, API Gateway, DevOps.

3. هيكل الريبو (Monorepo Structure)

الهيكل النهائي للريبو كما تم توحيده في Folder Structure Master + Codex Workspace Audit:

mh-os-superapp/
├── apps/
│ ├── backend/ # Express + TS + Prisma (API)
│ ├── frontend-web/ # Next.js 16 (Admin & OS dashboards)
│ └── mobile/ # (مستقبلاً) React Native SuperApp
├── packages/
│ ├── ui-kit/ # UI components مشتركة
│ ├── utils/ # Helpers مشتركة
│ ├── types/ # Shared TS types
│ ├── auth/ # Auth/JWT logic
│ └── ai-engine/ # AI Orchestrator + agents
├── ai/ # Agents + Brain + Workflows
├── docs/ # كل ملفات الـ OS و الـ Architecture
├── infra/ # Docker, CI/CD, deployment
├── scripts/ # Seeders, importers, cleanup, deploy
└── package.json # Turborepo root + configs

apps/backend: يحتوي على كل Modules: auth, users, brand, product, pricing, crm, marketing, inventory, finance, dealers, stand, affiliate, loyalty, automation, ai-brain, notifications, admin, support, operations…

apps/frontend-web: Next.js App Router مع أقسام لكل OS (Dashboard, Products, Pricing, CRM, Marketing, Sales, Dealers, Stand, Affiliate, Loyalty, Inventory, Finance, Partners, Automation, AI Brain, Virtual HQ…).

4. Backend – Tech Stack & Architecture
   4.1 Tech Stack

Node.js + TypeScript (ESM)

Express 4.x modular routers

Prisma + PostgreSQL

Redis (للكاش، الكيو، الريت ليميت، الأحداث – مستقبلاً)

Docker + docker-compose

GitHub Actions (planned)

4.2 Layout
apps/backend/
src/
config/ # env, CORS, security, etc.
core/ # prisma, redis, logger, ai-orchestrator, events
modules/
auth/
users/
brand/
product/
pricing/
crm/
marketing/
sales-reps/
dealers/
partners/
stand/
affiliate/
loyalty/
inventory/
finance/
white-label/
automation/
communication/
notifications/
knowledge-base/
security-governance/
admin/
ai-brain/
social-intelligence/
operations/
support/
app.ts
server.ts
prisma/
schema.prisma
migrations/

4.3 Core Patterns

Prisma schema موحد ويغطي:

Security/IAM، Brand، Product/Pricing/Competitors، CRM/Marketing، Inventory، Finance، Automation/AI، Support/Operations، Loyalty…

Modules = Controller + Service + Routes + (DTO/Types).

AI Layer:

core/ai/orchestrator.ts + prompt-templates + ai-service/ai-client.ts.

كل استدعاء AI يمر عبر هذه الطبقة ثم يسجل في AIInsight / AIReport / AILearningJournal / AIPricingHistory.

Automation:

AutomationRule, AutomationWorkflow, AutomationEvent, AutomationExecutionLog, ScheduledJob.

4.4 حالة التنفيذ الحالية (من Codex Audit)

منفّذ فعليًا بالكامل (Prisma + Services):

Auth, Users, Brand, Product, Pricing (بدون AI حقيقي لكن مع stub), CRM, Marketing, Finance, Loyalty, Automation, Activity Log, Admin/Platform-Ops.

موجودة كـ Routes + Controllers لكن Services فيها TODO:

Inventory, Operations, Support, Communication/Notifications, Dealers, Partners, Stand, Affiliate, White-label, Social Intelligence, بعض أجزاء AI Brain.

AI Client:

ما يزال يحتوي على "TODO: Connect to AI provider" → يعني أن المنظومة جاهزة مع الكاش والـ orchestrator، لكن تحتاج توصيل فعلي بـ OpenAI في خطوة لاحقة.

5. Frontend – Next.js OS Dashboards
   5.1 App Router Structure
   apps/frontend-web/app/
   layout.tsx # Root layout: Theme, Providers, AI Dock
   page.tsx # Global dashboard or welcome
   (auth)/
   login/
   forgot-password/
   reset-password/
   dashboard/
   brand/
   products/
   pricing/
   crm/
   marketing/
   sales/
   dealers/
   stand/
   affiliate/
   loyalty/
   inventory/
   finance/
   partners/
   white-label/
   automation/
   communication/
   knowledge/
   security/
   admin/
   ai-brain/
   social-intelligence/
   virtual-hq/

5.2 Global Layout

Sidebar: كل الـ OS (Dashboard, Brand, Products, Pricing, CRM, Marketing, Sales, Dealers, Stand, Affiliate, Loyalty, Inventory, Finance, Partners, White Label, Automation, Communication, Knowledge, AI Brain, Social Intelligence, Admin, Virtual HQ).

Topbar: Brand Switcher، User Profile، Notifications، Quick Search (Ctrl+K)، AI Assistant Quick Actions.

AI Dock: يظهر في كل الصفحات (Explain this page, Suggest actions, Summaries, Create Automations…).

5.3 أمثلة على صفحات OS

Pricing OS:

/pricing, /pricing/[productId], /pricing/matrix, /pricing/competitors, /pricing/ai-advice, /pricing/ai-forecast, /pricing/history.

Loyalty OS:

/loyalty, /loyalty/programs, /loyalty/customers, /loyalty/transactions, /rewards.

Stand OS:

/stand, /stand/partners, /stand/[id], /stand/inventory, /stand/orders.

Virtual HQ / AI Crew:

/virtual-hq, /virtual-hq/inbox, /virtual-hq/analytics, /virtual-hq/reports.

6. الـ OS الرئيسية – المسؤوليات

هذه ملخّص نهائي لأهم الـ OS كما تم تعريفها في الـ Master Prompt + OS docs.

6.1 Brand OS

إدارة العلامات (Brand, Identity, Rules, AI Config).

HAIROTICMEN هي الـ Brand الأولى داخل النظام.

6.2 Product OS

كتالوج المنتجات متعدد العلامات.

يربط: SKU, UPC, Packaging, How to Use, USP, Pricing, Inventory, Media.

6.3 Pricing Engine OS + Pricing Insights OS + Competitor Engine OS

حساب التسعير متعدد القنوات (B2C, Dealer, Stand, Distributor, Amazon…).

تحليل COGS, Full Cost, UVP, MAP, Margins.

AI Pricing Engine: محاكاة، توصيات، Repricing، مراقبة المنافسين.

6.4 CRM OS

الأشخاص، الشركات، الـ Leads, Pipelines, Deals, Tasks, Notes, Segments، تفاعل مع الحملات.

تكامل كامل مع Marketing, Sales, Loyalty, Automation, Communication.

6.5 Marketing OS

Content Studio, Campaigns, SEO, Social, Influencer CRM, Analytics.

AI CMO مسؤول عن الاستراتيجيات، المحتوى، الحملات، وتحسين ROAS.

6.6 Sales Rep OS

المندوبين: Territories, Routes, Visits, Quotes, Orders, Targets, Commissions.

Mobile usage، AI Route Planner، AI Visit Coach.

6.7 Dealer / Partner OS

إدارة الشركاء (Dealer, Distributor, Salon, Stand, WL Partner, Affiliate Partner).

عقود، أسعار خاصة، أداء، AI Partner Manager.

6.8 Stand Program OS

StandPartner, StandUnit, StandInventory, StandOrders, StandLoyalty, StandPerformance.

AI Refill Engine, Stand Insights, Auto-Replenishment.

6.9 Affiliate OS

Affiliates/Influencers: Links, Clicks, Orders, Commissions, Payouts.

AI Influencer Finder, Fraud Detector, Smart Commission Engine.

6.10 Loyalty OS

برامج ولاء متعددة المستويات (B2C + شركاء).

حساب نقاط، مستويات، Rewards، Referral، AI Churn Rescue وLTV Predictor.

6.11 Inventory OS

Warehouses, Stock, Movements, Transfers, Purchase Orders, Shipments, Forecast.

AI Supply Manager, Stock Alerts, Demand Forecast.

6.12 Finance OS

Invoices, Payments, Expenses, RevenueRecords, ProgramPayouts, TaxProfiles, Budgets.

AI Financial Analyst للربحية والتوقعات.

6.13 White Label OS

تمكين الشركاء/المؤثرين من إطلاق علامات WL كاملة (Brand, Packaging, Pricing, Orders, Marketing Kit…).

AI White Label Assistant لكل شيء من الاسم حتى خطة الإطلاق.

6.14 Automation OS + Notification OS

قواعد، Workflows، Triggers، Actions بين كل OS.

Notification OS كـ Event Engine مركزي لكل القنوات (Email, SMS, WhatsApp, In-App, Push, Telegram…).

6.15 AI Brain OS + AI Learning Loop OS

AI Brain: orchestration + reports + simulations + narrative engine.

Learning Loop: حفظ قرارات AI + نتائجها + تحسين مستمر.

6.16 Security & Governance OS + SuperAdmin OS

IAM, RBAC, Policies, AI Guardrails, Audit Logs, Compliance (GDPR).

SuperAdmin = Digital CEO: إدارة المستخدمين، البراندات، الـ AI Agents، التسعير، الأتمتة، System Health.

7. نموذج البيانات الأساسي (Prisma Backbone)

هذه ليست كل الـ Models، لكنها العمود الفقري المتفق عليه.

User + Role enum:

يدعم: SUPERADMIN, ADMIN, MANAGER, SALES_REP, DEALER, DISTRIBUTOR, PARTNER, STAND_PARTNER, AFFILIATE, CUSTOMER, USER…

علاقات مع SalesRepProfile, DealerProfile, PartnerProfile, AffiliateProfile, LoyaltyAccount, ActivityLog, Notification.

Brand / BrandCategory / BrandProduct:

Brand = أب لكل شيء (Identity, Rules, AI Config, Categories, Products, Pricing…).

BrandProduct يربط مع ProductPricing, CompetitorPrice, ProductPriceDraft, AIPricingHistory, AILearningJournal, Orders, Inventory…

ProductPricing, CompetitorPrice, AIPricingHistory, AILearningJournal:

كل ما يتعلق بالتسعير والذكاء والتعلم.

CRMClient, SalesRepProfile, Order, OrderItem:

CRM + Sales Rep + Orders unified.

LoyaltyAccount + LoyaltyTransaction

Warehouse, InventoryItem, InventoryTransaction, PurchaseOrder, Shipment, ReorderSuggestion

Invoice, InvoiceItem, Payment, Expense, RevenueRecord, ProgramPayout

AutomationRule, AutomationEvent, AutomationWorkflow, AutomationExecutionLog, ScheduledJob

AIInsight, AIReport, AIAgentConfig, AIPricingHistory, AILearningJournal

Notification, NotificationTemplate, KnowledgeDocument, ActivityLog, Ticket, OperationsTask

8. API Master Surface (REST /api/v1)

كما هو موحّد في API MASTER SPECIFICATION + ما نفّذه Codex في backend:

/auth/\* – login/register/me

/users/\* – إدارة المستخدمين

/brand/\* – الهوية والقواعد

/products/\* – قائمة/تفاصيل المنتجات مع التسعير والمنافسين

/pricing/\* – simulate, insights, draft, compare

/competitors/\* – scan + get list

/crm/\* – leads, clients, pipelines, deals

/marketing/\* – campaigns, content, SEO, performance

/sales-reps/\* – reps, routes, visits, quotes, orders

/dealers/_, /partners/_

/stand/\*

/affiliate/\*

/loyalty/\*

/inventory/\*

/finance/\*

/white-label/\*

/automation/\*

/notifications/\*

/knowledge-base/\*

/admin/_, /security/_

/ai/\* – pricing/marketing/crm/sales/inventory/finance/brain reports

/social-intelligence/\*

/support/_, /operations/_

كل Endpoint بمبدأ:

Controllers = HTTP + Validation
Services = Business Logic
Prisma = Data Access

9. AI Crew & Virtual Office (Virtual HQ)

تم توحيد مفهوم AI Directors + Virtual Office Meeting Flow:

Directors (Pricing, Growth/Marketing, CRM, Loyalty, Finance, Operations/Inventory, Brand, Stand, Sales…).

Virtual Office Meeting:

Inputs: Brand + Scope (pricing/launch/marketing/stand) + Departments + Agenda + Notes + Data Signals.

Orchestrator: runVirtualOfficeMeeting في AI Brain.

Outputs: Summary, Risks, Recommendations per department, Action Items (linked إلى Automation & Notifications & Activity Log).

الواجهة الأمامية: /virtual-hq + Inbox + Analytics + Reports.

10. حالة المشروع بعد Codex (وضعك الحالي)

باختصار:

Docs الآن متناسقة:

System Overview, Architecture Map, UX Dashboards, OS docs, AI docs، API spec، Database schema master، Folder structure master → كلها منسّقة ومترابطة.

Backend:

يبني Modular Monolith جاهز لتفعيل كل OS واحدة واحدة.

Auth/Brand/Product/Pricing/CRM/Marketing/Finance/Loyalty/Automation/AI-Orchestrator/ActivityLog جاهزين عمليًا.

باقي الأنظمة لها Routes + Services stubs بانتظار توصيل Prisma logic (Inventory, Stand, Dealers, Affiliate, WL, Social Intelligence, Support, Operations, Notifications…).

Frontend:

Next.js structure + Global Layout + Navigation Tree محددة بالكامل في docs، وبعض الأجزاء من الكود موجودة، لكن أغلب OS Dashboards ما زالت بحاجة لتطوير واجهات فعلية وربط مع الـ API.

11. ماذا نفعل بعد هذا الملف؟

الآن عندك ملف مرجعي موحّد يمثل آخر نسخة معتمدة بعد Codex:

يمكن حفظه كـ:
docs/MH-OS SUPERAPP – FINAL BLUEPRINT (v1.1).md

منه نبدأ أي خطوة تنفيذية قادمة بشكل منظم، مثلاً:

مسار Backend

إكمال Services التي عليها TODO (Inventory, Stand, Dealers, Affiliate, WL, Notifications…).

مسار Frontend

بناء Dashboard حقيقي لكل OS بالتسلسل (مثلاً نبدأ بـ Pricing + Products + CRM ثم Stand/Dealers).

مسار AI

توصيل ai-service/ai-client فعليًا بـ OpenAI وربطه مع الـ Agents المهمة (Pricing, Marketing, CRM, Virtual Office…).

مسار التشغيل الفعلي لـ HAIROTICMEN

استيراد بيانات المنتجات، التسعير، التغليف، USP، How To Use، Stand Program، Sales Rep Program… لتشغيل البراند بالكامل داخل النظام.
