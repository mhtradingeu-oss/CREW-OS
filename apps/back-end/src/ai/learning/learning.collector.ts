/**
 * PHASE 9 — LEARNING LOOP
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */

import { LearningSignal } from './learning.types.js';

// Accepts signals, no side effects, pure only
export function collectLearningSignal(signal: LearningSignal): LearningSignal {
  // No mutation, no side effects
  return { ...signal };
}
