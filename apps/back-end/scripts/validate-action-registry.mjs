#!/usr/bin/env node

process.env.NODE_ENV = process.env.NODE_ENV || "production";

import { validateActionRegistryIntegrity } from "../dist/core/automation/actions/validation.js";

try {
  validateActionRegistryIntegrity();
  console.log("Automation action registry integrity validated.");
} catch (error) {
  console.error("Automation action registry integrity validation failed.");
  console.error(error);
  process.exit(1);
}
