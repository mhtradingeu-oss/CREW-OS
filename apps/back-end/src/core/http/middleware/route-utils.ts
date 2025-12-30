/** Helpers shared between HTTP observability hooks. */
export function sanitizeRoute(originalUrl: string): string {
  const path = originalUrl?.split("?")[0] ?? "/";
  if (path.startsWith("/api/v1/auth")) {
    return "/api/v1/auth/*";
  }
  return path;
}
