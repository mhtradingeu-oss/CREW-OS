// Maps an AISuggestion to an ExecutionPlan for Automation OS
export function mapSuggestionToExecutionPlan(suggestion: any) {
  // Minimal stub: real mapping logic should be domain-aware
  return {
    agent: suggestion.agent,
    domain: suggestion.domain,
    input: suggestion.inputSnapshotJson,
    correlationId: suggestion.correlationId,
    // ...other fields as needed
  };
}
