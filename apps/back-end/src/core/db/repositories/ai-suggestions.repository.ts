import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

type SuggestionFilter = Record<string, string | number | boolean | undefined>;

export class AISuggestionRepository {
  constructor(private readonly db = prisma) {}

  async listSuggestions(options: { filter?: SuggestionFilter } = {}) {
    const { filter = {} } = options;
    const where: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(filter)) {
      if (value === undefined || value === null) continue;
      where[key] = value;
    }

    return this.db.aISuggestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async updateSuggestion(id: string, data: Prisma.AISuggestionUpdateInput) {
    return this.db.aISuggestion.update({
      where: { id },
      data,
    });
  }

  async getSuggestionById(id: string) {
    return this.db.aISuggestion.findUnique({ where: { id } });
  }

  async markSuggestionExecuted(id: string, output: any) {
    return this.db.aISuggestion.update({
      where: { id },
      data: {
        executedAt: new Date(),
        status: "executed",
        proposedOutputJson: JSON.stringify(output),
      },
    });
  }

  async markSuggestionFailed(id: string, reason: string) {
    return this.db.aISuggestion.update({
      where: { id },
      data: {
        failureReason: reason,
        status: "failed",
      },
    });
  }

  async appendAuditLog(log: any) {
    // Minimal stub: in real system, insert to audit table
    // For now, just a placeholder
    return true;
  }
}
