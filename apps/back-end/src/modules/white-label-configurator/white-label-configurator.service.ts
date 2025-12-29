import type { MediaCallContext } from "../../core/ai/providers/media/media.types.js";
import { mediaStudioService, type WhiteLabelRequest } from "../media-studio/media-studio.service.js";

export const whiteLabelConfiguratorService = {
  // Persist WL config and emit event
  async createConfig(payload: WhiteLabelRequest): Promise<{ configId: string }> {
    // Simulate DB persistence
    const configId = "wlcfg-" + Math.random().toString(36).slice(2);
    // Track mockup (simulate)
    // Emit event
    const { emitWhiteLabelConfigCreated } = await import("./white-label-configurator.events.js");
    await emitWhiteLabelConfigCreated({
      configId,
      brandId: payload.brandId,
      productId: payload.productId,
      createdAt: new Date().toISOString(),
    });
    return { configId };
  },

  async preview(payload: WhiteLabelRequest, ctx: MediaCallContext) {
    const enriched: WhiteLabelRequest = {
      surfaces: ensureSurfaces(payload.surfaces),
      ...payload,
    };
    return mediaStudioService.productMockup(enriched, ctx);
  },

  async batch(payload: WhiteLabelRequest & { variants?: WhiteLabelRequest[] }, ctx: MediaCallContext) {
    const enriched: WhiteLabelRequest = {
      surfaces: ensureSurfaces(payload.surfaces),
      ...payload,
    };
    return mediaStudioService.whiteLabelBatch(enriched, ctx);
  },
};

function ensureSurfaces(surfaces?: string[]) {
  const required = ["front", "back", "side"];
  const provided = surfaces ?? [];
  const merged = [...required, ...provided];
  const seen = new Set<string>();
  return merged.filter((surface) => {
    if (seen.has(surface)) return false;
    seen.add(surface);
    return true;
  });
}
