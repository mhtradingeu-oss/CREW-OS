import { AsyncLocalStorage } from "node:async_hooks";
import { forbidden } from "./http/errors.js";

const AS = new AsyncLocalStorage<{ readOnlySnapshot: boolean }>();
const MUTATION_ACTIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "executeRaw",
  "executeRawUnsafe",
  "queryRaw",
  "queryRawUnsafe",
  "runCommandRaw",
]);

export function runReadOnlySnapshot<T>(fn: () => Promise<T>): Promise<T> {
  return AS.run({ readOnlySnapshot: true }, () => fn());
}

export function isReadOnlySnapshotActive(): boolean {
  return AS.getStore()?.readOnlySnapshot ?? false;
}

export function enforceReadOnlyMutation(action: string) {
  if (isReadOnlySnapshotActive() && MUTATION_ACTIONS.has(action)) {
    throw forbidden(
      "Database mutations are blocked while building the AI read-only snapshot.",
      undefined,
      "AI_READ_ONLY_MUTATION",
    );
  }
}
