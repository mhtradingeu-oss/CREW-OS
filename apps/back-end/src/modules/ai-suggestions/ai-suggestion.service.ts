import { AISuggestionRepository } from "../../core/db/repositories/ai-suggestions.repository.js";

export class AISuggestionService {
  public readonly repo = new AISuggestionRepository();

  async approveSuggestion(id: string, approverId: string) {
    return this.repo.updateSuggestion(id, {
      status: "approved",
      approvedByUserId: approverId,
      approvedAt: new Date(),
      failureReason: null,
    });
  }

  async rejectSuggestion(id: string, approverId: string, reason?: string) {
    return this.repo.updateSuggestion(id, {
      status: "rejected",
      approvedByUserId: approverId,
      failureReason: reason ?? null,
    });
  }
}

export async function getSuggestionStatus(suggestionId: string) {
  const repository = new AISuggestionRepository();
  const suggestion = await repository.getSuggestionById(suggestionId);
  return suggestion?.status ?? null;
}
