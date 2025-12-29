# MH-OS SUPERAPP
## Onboarding Flow Specification (Frontend)

Defines the UI, API touchpoints, and state for the current App Router onboarding wizard (F2 scope).

---

## Routes
```
/onboarding/step1   # path + persona + goals + suggested plan
/onboarding/step2   # brand definition + AI identity
/onboarding/step3   # products (existing or new) + AI descriptions
/onboarding/step4   # pricing with AI engine
/onboarding/step5   # channels + AI marketing starter plan
/onboarding/complete
```

## State (OnboardingStore)
- pathChoice: existing | new | whiteLabel
- persona: founder | marketer | ops | sales
- goals: launch | scale | optimize | omnichannel
- planSuggestion: { planName, focus[], rationale }
- step2Fields: brandName, country, category, brandGoal
- aiBrandIdentity: tone, persona, story, keywords, packagingStyle
- products (step3) and pricing (step4)
- selectedChannels + marketingPlan (step5)
- finalizedBrandId, wizardCompleted
- resetWizard

## Step Logic
- Step 1: requires persona + path to continue; goals tune planSuggestion chips.
- Step 2: collects brand basics, calls AI identity; Next disabled until aiBrandIdentity is set.
- Step 3: existing brand fetch (placeholder) or new products with AI descriptions; Next requires at least one product.
- Step 4: per-product COGS/strategy, AI pricing; Next requires pricing rows.
- Step 5: channel toggles, AI marketing starter plan; Next requires a plan.
- Complete: persists brand → products → pricing → marketing (if present), logs AI learning (includes persona/goals/planSuggestion/path), then redirects to /dashboard.

## API Touchpoints (frontend clients)
- AI: generateBrandIdentity, generateProductDescription, aiPricingEngine, generateMarketingStarterPlan.
- Onboarding: createBrand, createProducts, createPricingDrafts, createMarketingPlan.
- AI logging: logOnboardingLearning(payload with brandDefinition, products, pricing, marketingPlan, persona/goals/planSuggestion/pathChoice).

## Redirect / Guardrails
- Wizard controls its own navigation; Finish disabled unless brandDefinition, pathChoice, persona, products, and pricing exist.
- After success, redirect to `/dashboard`; link back to prior step remains when not finalized.

## UI Requirements
- Use shared components (StepHeader, WizardNav, AIBlock) and unified Tenant shell typography.
- Keep touch-friendly spacing, clear status copy (phase/progress), and show AI results inline.

---

# END OF DOCUMENT
