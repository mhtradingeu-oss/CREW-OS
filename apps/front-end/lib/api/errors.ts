// Normalized API error for presenter layer (read-only)
// No business/AI/decision/automation logic. No hooks. No side effects.
// All imports explicit, ESM, alias-based.

export class ApiError extends Error {
  status: number;
  info?: unknown;
  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

export async function normalizeApiError(res: Response): Promise<ApiError> {
  let info: unknown = undefined;
  try {
    info = await res.json();
  } catch {}
  return new ApiError(res.statusText || 'API Error', res.status, info);
}
