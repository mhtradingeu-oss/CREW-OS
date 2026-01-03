// Controller for ActionSuggestion (read-only)
import { Request, Response } from "express";
import { ActionSuggestionService, type ActionSuggestionFilters } from "./action-suggestion.service.js";
import { prisma } from "../../core/prisma.js";

export async function getActionSuggestions(req: Request, res: Response) {
  try {
    const filters = req.query as ActionSuggestionFilters;
    const result = await ActionSuggestionService.getActionSuggestions({ filters, prisma });
    res.json(result);
  } catch (err) {
    // Fail-silent, never throw uncaught
    res.status(500).json({ error: "Internal error" });
  }
}
