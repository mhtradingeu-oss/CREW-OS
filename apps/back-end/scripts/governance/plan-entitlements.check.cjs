// Governance script for Phase 2E: Plan & Entitlement Enforcement
// Checks for canonical usage of PlanCode and LimitKey
// Fails if direct plan checks or magic strings are found

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../../src');
const PLAN_REGISTRY_PATH = path.resolve(__dirname, '../../src/core/billing/plan-registry.ts');
const ENTITLEMENTS_MIDDLEWARE_PATH = path.resolve(__dirname, '../../src/core/http/middleware/entitlements.ts');

function scanFiles(dir, pattern) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(scanFiles(fullPath, pattern));
    } else if (pattern.test(fullPath)) {
      results.push(fullPath);
    }
  });
  return results;
}

function fileContainsMagicPlanCheck(file) {
  const content = fs.readFileSync(file, 'utf8');
  // Regex for direct plan checks and magic strings
  const planCheckRegex = /(plan\s*[=!]=\s*["'](PRO|ENTERPRISE|FREE)["'])|(planCode\s*[=!]=\s*["'](PRO|ENTERPRISE|FREE)["'])|(tenant\.plan\s*[=!]=\s*["'](PRO|ENTERPRISE|FREE)["'])/;
  return planCheckRegex.test(content);
}

function fileContainsNonCanonicalRequirePlan(file, planCodes) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  // Regex for requirePlan calls and function definitions
  const REQUIRE_PLAN_CALL = /requirePlan\s*\(([^)]*)\)/;
  const REQUIRE_PLAN_DEF = /(function|export)\s+requirePlan\s*\(/;
  for (const line of lines) {
    if (REQUIRE_PLAN_CALL.test(line)) {
      // Ignore function definitions
      if (REQUIRE_PLAN_DEF.test(line)) continue;
      const match = REQUIRE_PLAN_CALL.exec(line);
      const args = match[1];
      let canonical = false;
      for (const code of planCodes) {
        if (args.includes(code)) {
          canonical = true;
          break;
        }
      }
      if (!canonical) {
        return true;
      }
    }
  }
  return false;
}

function fileContainsNonCanonicalRequireEntitlementLimit(file, limitKeys) {
  const content = fs.readFileSync(file, 'utf8');
  // Check requireEntitlementLimit usage
  const requireLimitRegex = /requireEntitlementLimit\(([^)]*)\)/g;
  let match;
  while ((match = requireLimitRegex.exec(content)) !== null) {
    const args = match[1];
    for (const key of limitKeys) {
      if (!args.includes(key)) {
        return true;
      }
    }
  }
  return false;
}

function main() {
  // Load canonical PlanCodes and LimitKeys
  const planRegistryContent = fs.readFileSync(PLAN_REGISTRY_PATH, 'utf8');
  const planCodeRegex = /"(PRO|ENTERPRISE|FREE)"/g;
  const planCodes = Array.from(new Set([...planRegistryContent.matchAll(planCodeRegex)].map(m => m[1])));
  const limitKeyRegex = /"(AI_RUNS_PER_DAY|AUTOMATION_RUNS_PER_DAY|MEDIA_EXPORTS_PER_MONTH)"/g;
  const limitKeys = Array.from(new Set([...planRegistryContent.matchAll(limitKeyRegex)].map(m => m[1])));

  // Scan all .ts files in src
  const tsFiles = scanFiles(SRC_DIR, /\.ts$/);
  let errors = [];

  for (const file of tsFiles) {
    if (fileContainsMagicPlanCheck(file)) {
      errors.push(`Direct plan check found in ${file}`);
    }
    if (fileContainsNonCanonicalRequirePlan(file, planCodes)) {
      errors.push(`Non-canonical requirePlan usage in ${file}`);
    }
    if (fileContainsNonCanonicalRequireEntitlementLimit(file, limitKeys)) {
      errors.push(`Non-canonical requireEntitlementLimit usage in ${file}`);
    }
  }

  if (errors.length) {
    console.error("\n❌ Governance check failed:");
    errors.forEach(e => console.error("- ", e));
    process.exit(1);
  } else {
    console.log("\n✅ Governance: All plan/entitlement checks are canonical and safe.");
    process.exit(0);
  }
}

main();
