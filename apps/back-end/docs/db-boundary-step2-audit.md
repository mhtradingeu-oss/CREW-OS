# DB Boundary Audit (Phase 4 Step 2 - Baseline)

## Commands

### `git status --short`
```

```

### `npx turbo run typecheck --filter=mh-os-superapp-backend`
```
turbo 2.6.3

• Packages in scope: mh-os-superapp-backend
• Running typecheck in 1 packages
• Remote caching disabled
@mh-os/shared:build: cache hit, replaying logs 0ea0b8a733d99a66
@mh-os/shared:build: 
@mh-os/shared:build: 
@mh-os/shared:build: > @mh-os/shared@0.1.0 build
@mh-os/shared:build: > tsc -b
@mh-os/shared:build: 
@mh-os/shared:build: ⠙[1G[0K
mh-os-superapp-backend:typecheck: cache hit, replaying logs 0e945cfa3c5094fd
mh-os-superapp-backend:typecheck: 
mh-os-superapp-backend:typecheck: > mh-os-superapp-backend@0.1.0 typecheck
mh-os-superapp-backend:typecheck: > tsc --noEmit
mh-os-superapp-backend:typecheck: 

 Tasks:    2 successful, 2 total
Cached:    2 cached, 2 total
  Time:    101ms >>> FULL TURBO
```

### `npm run test -w mh-os-superapp-backend`
```
> mh-os-superapp-backend@0.1.0 test
> NODE_OPTIONS=--experimental-vm-modules jest -c jest.config.cjs --passWithNoTests

(node:83927) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
PASS src/core/ai/engines/__tests__/einvoice.engine.test.ts (6.007 s)
  ● Console

    console.warn
      [mh-os] [AI][manifest] integrity warnings {
        warnings: [
          'AI Crew governance warning: No agent marked as primary (priority: 1) for scope: product',
          'AI Crew governance warning: No agent marked as primary (priority: 1) for scope: pricing',
          'AI Crew governance warning: No agent marked as primary (priority: 1) for scope: competitor',
          ...
        ]
      }

       7 |   },
       8 |   warn(message: string, meta?: unknown) {
    >  9 |     console.warn(`[mh-os] ${message}`, meta ?? "");
          |             ^
      10 |   },
      11 |   error(message: string, meta?: unknown) {
      12 |     console.error(`[mh-os] ${message}`, meta ?? "");

      at Object.warn (src/core/logger.ts:9:13)
      at validateManifestIntegrity (src/ai/schema/ai-agents-manifest.ts:2307:12)
      at src/ai/schema/ai-agents-manifest.ts:2312:37

(node:83925) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
PASS src/ai/crew/__tests__/ai-crew.service.test.ts (6.077 s)
  ● Console

    console.warn
      [mh-os] [AI][manifest] integrity warnings {
        warnings: [
          'AI Crew governance warning: No agent marked as primary (priority: 1) for scope: product',
          ...
        ]
      }

       7 |   },
       8 |   warn(message: string, meta?: unknown) {
    >  9 |     console.warn(`[mh-os] ${message}`, meta ?? "");
          |             ^
      10 |   },
      11 |   error(message: string, meta?: unknown) {
      12 |     console.error(`[mh-os] ${message}`, meta ?? "");

      at Object.warn (src/core/logger.ts:9:13)
      at validateManifestIntegrity (src/ai/schema/ai-agents-manifest.ts:2307:12)
      at src/ai/schema/ai-agents-manifest.ts:2312:37

    console.info
      [mh-os] [advisory.audit] {
        id: 'df50e658-7584-4d27-b5f9-242c722a92b7',
        timestamp: '2025-12-21T21:36:59.168Z',
        userId: 'user-1',
        scopes: [ 'test-scope' ],
        agentsUsed: [ 'pricing-strategist', 'product-qa' ],
        questionHash: 'ae9ddc7da0c1838ea182884e5d4665f30c2afdc5aec8d3563907c0cda43ef404',
        questionLength: 53,
        confidence: 0.5,
        summary: 'Advisory result: 0 consensus, 2 divergent.'
      }

      at Object.info (src/core/logger.ts:6:13)

    console.info
      [mh-os] [advisory.audit] {
        id: '8535d8ee-4ddc-4fbf-bfb5-f238d0515da1',
        timestamp: '2025-12-21T21:36:59.176Z',
        userId: 'user-1',
        scopes: [ 'test-scope' ],
        agentsUsed: [ 'automation-reviewer', 'competitor-engine', 'crm-coach' ],
        questionHash: 'ae9ddc7da0c1838ea182884e5d4665f30c2afdc5aec8d3563907c0cda43ef404',
        questionLength: 53,
        confidence: 0.5,
        summary: 'Advisory result: 0 consensus, 3 divergent.'
      }

      at Object.info (src/core/logger.ts:6:13)

    console.info
      [mh-os] [advisory.audit] {
        id: '322df5be-8a9b-4e9a-8620-25fe625b7ba5',
        timestamp: '2025-12-21T21:36:59.177Z',
        userId: 'user-1',
        scopes: [ 'test-scope' ],
        agentsUsed: [ 'competitor-engine', 'forbidden-agent', 'pricing-strategist' ],
        questionHash: 'ae9ddc7da0c1838ea182884e5d4665f30c2afdc5aec8d3563907c0cda43ef404',
        questionLength: 53,
        confidence: 0.5,
        summary: 'Advisory result: 0 consensus, 2 divergent.'
      }

      at Object.info (src/core/logger.ts:6:13)

    console.info
      [mh-os] [advisory.audit] {
        id: '9c016a58-ee8b-4206-bb41-62e9c63d199e',
        timestamp: '2025-12-21T21:36:59.179Z',
        userId: 'user-1',
        scopes: [ 'test-scope' ],
        agentsUsed: [ 'ctx-fail-agent' ],
        questionHash: 'ae9ddc7da0c1838ea182884e5d4665f30c2afdc5aec8d3563907c0da43ef404',
        questionLength: 53,
        confidence: 0.5,
        summary: 'Advisory result: 0 consensus, 1 divergent.'
      }

      at Object.info (src/core/logger.ts:6:13)

    console.info
      [mh-os] [advisory.audit] {
        id: '22293a58-4895-417b-8af5-d8e31845334d',
        timestamp: '2025-12-21T21:36:59.180Z',
        userId: 'user-1',
        scopes: [ 'test-scope' ],
        agentsUsed: [ 'B', 'C', 'A' ],
        questionHash: 'ae9ddc7da0c1838ea182884e5d4665f30c2afdc5aec8d3563907c0cda43ef404',
        questionLength: 53,
        confidence: 0.5,
        summary: 'Advisory result: 0 consensus, 3 divergent.'
      }

      at Object.info (src/core/logger.ts:6:13)

(node:83926) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
PASS src/ai/crew/__tests__/ai-crew.session.service.test.ts (6.083 s)
  ● Console

    console.warn
      [mh-os] [AI][manifest] integrity warnings {
        warnings: [
          'AI Crew governance warning: No agent marked as primary (priority: 1) for scope: product',
          ...
        ]
      }

       7 |   },
       8 |   warn(message: string, meta?: unknown) {
    >  9 |     console.warn(`[mh-os] ${message}`, meta ?? "");
          |             ^
      10 |   },
      11 |   error(message: string, meta?: unknown) {
      12 |     console.error(`[mh-os] ${message}`, meta ?? "");

      at Object.warn (src/core/logger.ts:9:13)
      at validateManifestIntegrity (src/ai/schema/ai-agents-manifest.ts:2307:12)
      at src/ai/schema/ai-agents-manifest.ts:2312:37

PASS src/ai/execution-intent/__tests__/execution-intent.service.test.ts
PASS src/core/observability/__tests__/metrics.test.ts
PASS src/ai/decision/__tests__/decision.test.ts
PASS src/core/observability/__tests__/failure-classifier.test.ts

Test Suites: 7 passed, 7 total
Tests:       41 passed, 41 total
Snapshots:   0 total
Time:        7.076 s
Ran all test suites.
```

### `rg "@prisma/client" apps/back-end/src`
```
apps/back-end/src/modules/sales-reps/sales-reps.service.ts:import pkg from "@prisma/client";
apps/back-end/src/modules/sales-reps/sales-reps.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/dealers/dealers.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/onboarding/onboarding.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/influencer-os/influencer-os.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/stand-pos/stand-pos.service.ts:import pkg from "@prisma/client";
apps/back-end/src/modules/stand-pos/stand-pos.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/stand-pos/stand-pos.service.ts:import type { StandLocation } from "@prisma/client";
apps/back-end/src/modules/stand/stand.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/pricing/pricing.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/finance/finance.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/finance/finance.ai.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/admin/admin.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/users/users.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/ai-monitoring/ai-monitoring.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/communication/communication.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/inventory/inventory.service.ts:import type { Prisma, PrismaClient } from "@prisma/client";
apps/back-end/src/modules/crm/crm.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/marketing/marketing.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/brand/hairoticmen.seed.ts:import pkg from "@prisma/client";
apps/back-end/src/modules/brand/hairoticmen.seed.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/partners/partners.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/brand/brand.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/affiliate/affiliate.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/knowledge-base/knowledge-base.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/knowledge-base/knowledge-base.ai.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/white-label/white-label.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/platform-ops/platform-ops.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/support/support.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/notification/notification.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/activity-log/activity-log.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/operations/operations.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/auth/auth.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/security-governance/security-governance.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/product/product.service.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/modules/loyalty/loyalty.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/modules/ai-brain/ai-brain.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/seeds/tenants.seed.ts:import type { Plan } from "@prisma/client";
apps/back-end/src/seeds/admin.seed.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/seeds/plans.seed.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/core/security/rbac.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/automation.repository.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/ai-orchestrator.repository.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/support.repository.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/ai-pricing-history.repository.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/ai-insight.repository.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/automation-run.repository.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/automation-run.repository.ts:} from "@prisma/client";
apps/back-end/src/core/db/repositories/autonomy.repository.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/core/prisma.ts:import { PrismaClient as PrismaClientType, PrismaClient } from "@prisma/client";
apps/back-end/src/modules/social-intelligence/social-intelligence.service.ts:import type { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/ai-safety.repository.ts:import type { AIBannedAction, AISafetyConstraint, AIPromptFirewallRule } from "@prisma/client";
apps/back-end/src/core/db/repositories/voice.repository.ts:import { Prisma } from "@prisma/client";
apps/back-end/src/core/db/repositories/ai-monitoring.repository.ts:import { Prisma } from "@prisma/client";
```

### `rg "prisma\\." apps/back-end/src` (first 40 lines; full log at `apps/back-end/docs/db-boundary-rg-prisma-dot.txt`)
```
apps/back-end/src/modules/sales-reps/sales-reps.service.ts:import { prisma } from "../../core/prisma.js";
apps/back-end/src/modules/sales-reps/sales-reps.service.ts:  const duplicate = await prisma.salesOrder.findFirst({
apps/back-end/src/modules/sales-reps/sales-reps.service.ts:  const result = await prisma.$transaction(async (tx) => {
apps/back-end/src/modules/dealers/dealers.controller.ts:import { prisma } from "../../core/prisma.js";
apps/back-end/src/modules/dealers/dealers.controller.ts:    const insight = await prisma.aIInsight.create({
apps/back-end/src/modules/dealers/dealers.service.ts:import { prisma } from "../../core/prisma.js";
apps/back-end/src/modules/dealers/dealers.service.ts:    prisma.partnerOrder.aggregate({
apps/back-end/src/modules/dealers/dealers.service.ts:    prisma.partnerOrderItem.aggregate({
apps/back-end/src/modules/dealers/dealers.service.ts:    prisma.stand.count({
apps/back-end/src/modules/dealers/dealers.service.ts:      await prisma.$transaction([
apps/back-end/src/modules/dealers/dealers.service.ts:        prisma.partner.count({ where: { brandId, status: "ACTIVE" } }),
apps/back-end/src/modules/dealers/dealers.service.ts:        prisma.partnerOrder.aggregate({
apps/back-end/src/modules/dealers/dealers.service.ts:        prisma.stand.count({ where: { brandId } }),
apps/back-end/src/modules/dealers/dealers.service.ts:        prisma.partner.groupBy({
apps/back-end/src/modules/dealers/dealers.service.ts:    const [total, rows] = await prisma.$transaction([
apps/back-end/src/modules/dealers/dealers.service.ts:      prisma.partner.count({ where }),
apps/back-end/src/modules/dealers/dealers.service.ts:      prisma.partner.findMany({
apps/back-end/src/modules/dealers/dealers.service.ts:    const record = await prisma.partner.findFirst({
apps/back-end/src/modules/dealers/dealers.service.ts:    const existing = await prisma.partner.findFirst({
apps/back-end/src/modules/dealers/dealers.service.ts:    const created = await prisma.partner.create({
apps/back-end/src/modules/dealers/dealers.service.ts:    const existing = await prisma.partner.findFirst({ where: { id: partnerId, brandId } });
```

## Violations by Area (files outside allowed DB dirs)

### Services
- `apps/back-end/src/modules/sales-reps/sales-reps.service.ts`
- `apps/back-end/src/modules/dealers/dealers.service.ts`
- `apps/back-end/src/modules/onboarding/onboarding.service.ts`
- `apps/back-end/src/modules/loyalty/loyalty.service.ts`
- `apps/back-end/src/modules/notification/notification.service.ts`
- `apps/back-end/src/modules/influencer-os/influencer-os.service.ts`
- `apps/back-end/src/modules/auth/auth.service.ts`
- `apps/back-end/src/modules/pricing/pricing.service.ts`
- `apps/back-end/src/modules/ai-brain/ai-insights.service.ts`
- `apps/back-end/src/modules/ai-brain/virtual-office.service.ts`
- `apps/back-end/src/modules/ai-brain/ai-kpi.service.ts`
- `apps/back-end/src/modules/security-governance/security-governance.service.ts`
- `apps/back-end/src/modules/communication/communication.service.ts`
- `apps/back-end/src/modules/marketing/marketing.service.ts`
- `apps/back-end/src/modules/product/product.service.ts`
- `apps/back-end/src/modules/inventory/inventory.service.ts`
- `apps/back-end/src/modules/crm/crm.service.ts`
- `apps/back-end/src/modules/ai-brain/ai-brain.service.ts`
- `apps/back-end/src/modules/platform-ops/platform-ops.service.ts`
- `apps/back-end/src/modules/operations/operations.service.ts`
- `apps/back-end/src/modules/support/support.service.ts`
- `apps/back-end/src/modules/users/users.service.ts`
- `apps/back-end/src/modules/activity-log/activity-log.service.ts`
- `apps/back-end/src/modules/finance/finance.service.ts`
- `apps/back-end/src/modules/social-intelligence/social-intelligence.service.ts`
- `apps/back-end/src/modules/partners/partners.service.ts`
- `apps/back-end/src/modules/brand/brand.service.ts`
- `apps/back-end/src/modules/white-label/white-label.service.ts`
- `apps/back-end/src/modules/knowledge-base/knowledge-base.service.ts`
- `apps/back-end/src/modules/knowledge-base/knowledge-base.ai.ts`
- `apps/back-end/src/modules/knowledge-base/knowledge-base.controller.ts`
- `apps/back-end/src/modules/knowledge-base/knowledge-base/*.ts (AI helpers)`

### Controllers
- `apps/back-end/src/modules/dealers/dealers.controller.ts`
- `apps/back-end/src/modules/stand/stand.controller.ts`
- `apps/back-end/src/modules/knowledge-base/knowledge-base.controller.ts`
- `apps/back-end/src/modules/support/support.controller.ts`
- `apps/back-end/src/modules/notification/notification.controller.ts`

### Seeds / CLI Scaffolds
- `apps/back-end/src/seeds/users.seed.ts`
- `apps/back-end/src/seeds/tenants.seed.ts`
- `apps/back-end/src/seeds/admin.seed.ts`
- `apps/back-end/src/seeds/plans.seed.ts`
- `apps/back-end/src/seeds/automation.seed.ts`
- `apps/back-end/src/seeds/pricing.seed.ts`
- `apps/back-end/src/seeds/core.seed.ts`
- `apps/back-end/src/seeds/run-seed-cli.ts`
- `apps/back-end/src/modules/brand/hairoticmen.seed.ts`
- `apps/back-end/src/modules/security-governance/rbac.seed.ts`

### Core / Other
- `apps/back-end/src/core/plans-resolver.ts`
- `apps/back-end/src/core/security/rbac.ts`
- `apps/back-end/src/modules/activity-log/activity-log.service.ts`
- `apps/back-end/src/modules/stand/stand.service.ts`
- `apps/back-end/src/modules/communication/communication.service.ts`
- `apps/back-end/src/modules/ai-brain/*`
- `apps/back-end/src/modules/automation/automation.*`

Additional `prisma.` usages are logged under `apps/back-end/docs/db-boundary-rg-prisma-dot.txt`.
