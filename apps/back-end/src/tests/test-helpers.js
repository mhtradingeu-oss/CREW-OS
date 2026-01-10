// Minimal test helpers for pricing governance enforcement tests
// These are stubs/mocks for demonstration; replace with real logic as needed

export async function getTestAuthToken({ permissions }) {
  // Return a dummy JWT or session token with the given permissions
  // In real tests, use your auth service or a test user factory
  return 'test-auth-token';
}

export async function setFeatureFlag(feature, enabled) {
  // Stub: In real tests, set the feature flag in your config or DB
  // For now, do nothing
}

export async function setPlanEntitlement(tenantId, feature, entitled) {
  // Stub: In real tests, set the plan entitlement in your config or DB
  // For now, do nothing
}
