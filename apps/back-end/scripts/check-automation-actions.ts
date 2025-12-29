process.env.NODE_ENV = process.env.NODE_ENV || "development";

import { validateActionMetadataCompleteness } from "../src/core/automation/actions/validation.js";

try {
  validateActionMetadataCompleteness();
  console.log("Automation action metadata validation passed.");
} catch (error) {
  console.error("Automation action metadata validation failed.");
  console.error(error);
  process.exit(1);
}
