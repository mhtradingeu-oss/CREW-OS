#!/usr/bin/env node
// Governance Enforcement Script — Phase 2D
// Fails if any requireFeature violation is found

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../../src');
const REGISTRY_PATH = path.resolve(__dirname, '../../src/core/security/feature-registry.ts');

function walk(dir, ext = '.ts') {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(walk(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  });
  return results;
}

function fail(msg) {
  console.error('❌ GOVERNANCE VIOLATION:', msg);
  process.exit(1);
}

const files = walk(SRC_DIR);
const registry = fs.readFileSync(REGISTRY_PATH, 'utf8');
const featureKeys = Array.from(registry.matchAll(/key:\s*"([A-Za-z0-9_]+)"/g)).map(m => m[1]);

let violations = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  // 1. String literal usage
  const stringMatches = content.match(/requireFeature\s*\(\s*['"][A-Za-z0-9_]+['"]\s*\)/g);
  if (stringMatches) {
    violations.push(`String literal requireFeature in ${file}: ${stringMatches.join(', ')}`);
  }

  // 2. Feature not in registry
  const featureMatches = content.match(/requireFeature\s*\(\s*FEATURES\.([A-Z0-9_]+)\s*\)/g);
  if (featureMatches) {
    for (const m of featureMatches) {
      const key = m.match(/FEATURES\.([A-Z0-9_]+)/)[1];
      if (!Object.keys(global.FEATURES || {}).includes(key) && !featureKeys.includes(key)) {
        violations.push(`Feature ${key} used in ${file} but not defined in registry.`);
      }
    }
  }
}

// 3. Registry completeness
const registryObj = registry.match(/([A-Z0-9_]+):\s*{[^}]*}/g) || [];
for (const entry of registryObj) {
  const name = entry.match(/([A-Z0-9_]+):/)[1];
  if (!entry.match(/permissions:\s*\[[^\]]+\]/)) {
    violations.push(`Feature ${name} missing permissions in registry.`);
  }
  if (!entry.match(/plans:\s*\[[^\]]+\]/)) {
    violations.push(`Feature ${name} missing plans in registry.`);
  }
}

if (violations.length) {
  fail(violations.join('\n'));
} else {
  console.log('✔ Feature governance check passed.');
  process.exit(0);
}
