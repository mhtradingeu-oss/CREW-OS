// Returns governance metadata for observability responses
export function buildGovernanceMetadata(entity: any, filters: any) {
  return {
    entity,
    filters,
    timestamp: new Date().toISOString(),
    visibility: "internal-readonly",
    note: "For admin/ops observability only. No enforcement, no automation."
  };
}
