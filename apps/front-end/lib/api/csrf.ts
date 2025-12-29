import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@mh-os/shared";

const STATE_MODIFYING_METHODS = ["POST", "PUT", "PATCH", "DELETE"] as const;
type CsrfMethod = (typeof STATE_MODIFYING_METHODS)[number];
const STATE_MODIFYING_SET = new Set<string>(STATE_MODIFYING_METHODS);

export function methodRequiresCsrf(method: unknown): method is CsrfMethod {
  if (typeof method !== "string") {
    return false;
  }
  const normalized = method.toUpperCase();
  return STATE_MODIFYING_SET.has(normalized);
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
