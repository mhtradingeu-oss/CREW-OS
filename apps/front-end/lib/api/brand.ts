// Contract-required stubs for frontend contract alignment
export async function listBrands() {
  return [];
}

export async function getBrand(id: string) {
  return null;
}
// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.

export type AutonomyStatus = {
  lastRunAt?: string;
  globalAutonomyEnabled: boolean;
  totalPending: number;
  totalExecuted: number;
  totalRejected: number;
  pendingApproval: unknown[];
  blocked: unknown[];
  queued: unknown[];
  running: unknown[];
  completed: unknown[];
};

export function getAutonomyStatus(): AutonomyStatus | null {
  return null;
}
export function listAutonomyItems(): unknown[] {
  return [];
}
export function getAutonomyItem(): unknown | null {
  return null;
}
export function updateAutonomyItem(): unknown | null {
  return null;
}
export function deleteAutonomyItem(): null {
  return null;
}
export function createAutonomyItem(): null {
  return null;
}