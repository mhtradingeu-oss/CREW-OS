// V1 placeholder for missing export
export function onUnauthorized() {}
// =====================================================
// V1 READ-ONLY API CLIENT — FINAL & LOCKED
// -----------------------------------------------------
// - Read-only by default
// - Backward compatible with legacy `api.get(...)`
// - No execution, no mutation logic
// =====================================================

export type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

export type ApiFetchResponse<T = unknown> = {
  ok: boolean;
  status: number;
  data: T;
};

// -----------------------------------------------------
// Core V1 Read-only Fetcher
// -----------------------------------------------------
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiFetchResponse<T>> {
  const url = joinUrl(getBaseUrl(), path);

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    credentials: "include",
    cache: "no-store",
  });

  let data: T | undefined = undefined;
  try {
    data = (await res.json()) as T;
  } catch {
    // allowed: empty body
  }

  return {
    ok: res.ok,
    status: res.status,
    data: data as T,
  };
}

// -----------------------------------------------------
// Backward-compatible API wrapper
// (Required to stop 100+ build errors)
// -----------------------------------------------------
export const api = {
  get: <T = unknown>(path: string, headers?: Record<string, string>) =>
    apiFetch<T>(path, { method: "GET", headers }),

  // ⚠️ V1: Mutations are stubbed, NOT executed
  post: <T = unknown>(_path: string, _body?: unknown) =>
    Promise.reject(new Error("V1 READ-ONLY: POST disabled")),

  put: <T = unknown>(_path: string, _body?: unknown) =>
    Promise.reject(new Error("V1 READ-ONLY: PUT disabled")),

  patch: <T = unknown>(_path: string, _body?: unknown) =>
    Promise.reject(new Error("V1 READ-ONLY: PATCH disabled")),

  delete: <T = unknown>(_path: string) =>
    Promise.reject(new Error("V1 READ-ONLY: DELETE disabled")),
};

// -----------------------------------------------------
// Error helper (V1-safe)
// -----------------------------------------------------
export function apiErrorMessage() {
  return "API error (V1 read-only client)";
}

// -----------------------------------------------------
// Utilities
// -----------------------------------------------------
function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001"
  );
}
