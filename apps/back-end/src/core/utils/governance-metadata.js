// Returns governance metadata for observability responses
export function buildGovernanceMetadata(entity, filters) {
  return {
    entity,
    filters,
    timestamp: new Date().toISOString(),
    visibility: "internal-readonly",
    note: "For admin/ops observability only. No enforcement, no automation."
  };
}
