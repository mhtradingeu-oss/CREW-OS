import {
  generateImage,
  generateVideo,
  getDefaultImageProviderId,
  getDefaultVideoProviderId,
  listImageEngines,
  listVideoEngines,
  type ImageEngineRequest,
  type VideoEngineRequest,
} from "../../core/ai/engines/media.engine.js";
import type { MediaCallContext, MediaEngineId } from "../../core/ai/providers/media/media.types.js";
import { logger } from "../../core/logger.js";
import { mediaStudioRepository } from "../../core/db/repositories/media-studio.repository.js";

export type WhiteLabelRequest = {
  brandId?: string;
  productId?: string;
  baseProductId?: string;
  customDimensions?: { width?: number; height?: number; depth?: number };
  surfaces?: string[];
  logoUrl?: string;
  brandColors?: { primary?: string; secondary?: string; accent?: string };
  style?: string;
  scene?: string;
  prompt?: string;
  engineId?: MediaEngineId;
  count?: number;
  productName?: string;
  description?: string;
};

export const mediaStudioService = {
    generateImage: generateImage,
    generateVideo: generateVideo,
    listImageEngines: listImageEngines,
    listVideoEngines: listVideoEngines,
  // Persist mockup request and track generation state

  async persistMockupRequest(payload: WhiteLabelRequest): Promise<{ requestId: string; state: string }> {
    // Persist request (simulate DB save)
    const requestId = "mockup-" + Math.random().toString(36).slice(2);
    const state = "pending";
    // Here you would call mediaStudioRepository.saveMockupRequest(payload, requestId, state)
    // Track state (simulate)
    const { emitMediaGenerated } = await import("./media-studio.events.js");
    await emitMediaGenerated({
      requestId,
      brandId: payload.brandId,
      productId: payload.productId,
      state,
      generatedAt: new Date().toISOString(),
    });
    return { requestId, state };
  },

  async whiteLabelPreview(payload: WhiteLabelRequest, ctx: MediaCallContext) {
    const normalized = normalizeWhiteLabelPayload(payload);
    const count = normalized.count ?? 1;
    const previews = [] as Array<{ url: string; provider: MediaEngineId; meta?: Record<string, unknown> }>;
    for (let i = 0; i < count; i += 1) {
      const prompt = buildWhiteLabelPrompt(normalized, i);
      const result = await generateImage(
        {
          prompt,
          negativePrompt: normalized.prompt ? undefined : "nsfw, blurry, low quality, distorted, gore, weapons",
          engineId: normalized.engineId ?? getDefaultImageProviderId(),
          stylePreset: normalized.style,
        },
        ctx,
      );
      previews.push({ url: result.url, provider: result.provider, meta: result.meta });
    }

    return {
      previews,
      recipe: buildRecipe(normalized, ctx, previews.map((p) => p.url)),
    };
  },

  async whiteLabelBatch(payload: WhiteLabelRequest & { variants?: WhiteLabelRequest[] }, ctx: MediaCallContext) {
    if (!payload.variants || !payload.variants.length) {
      return this.whiteLabelPreview(payload, ctx);
    }
    const outputs = [] as Array<{ previews: { url: string; provider: MediaEngineId }[]; recipe: unknown }>;
    const base = normalizeWhiteLabelPayload(payload);
    for (const variant of payload.variants) {
      const merged: WhiteLabelRequest = normalizeWhiteLabelPayload({ ...base, ...variant });
      const preview = await this.whiteLabelPreview(merged, ctx);
      outputs.push(preview);
    }
    return outputs;
  },

  async productMockup(payload: WhiteLabelRequest, ctx: MediaCallContext) {
    const normalized = normalizeWhiteLabelPayload(payload);
    const basePrompt = buildWhiteLabelPrompt(normalized, 0);
    const surfaces = normalized.surfaces ?? ["front", "back", "side"];
    const outputs = [] as Array<{ surface: string; url: string; provider: MediaEngineId; meta?: Record<string, unknown> }>;

    for (const surface of surfaces) {
      const prompt = `${basePrompt} | Surface: ${surface}`;
      const result = await generateImage(
        {
          prompt,
          engineId: normalized.engineId ?? getDefaultImageProviderId(),
          stylePreset: normalized.style,
        },
        ctx,
      );
      outputs.push({ surface, url: result.url, provider: result.provider, meta: result.meta });
    }

    return {
      outputs,
      recipe: buildRecipe(normalized, ctx, outputs.map((o) => o.url)),
    };
  },

  async recordMediaInsight(payload: {
    brandId?: string;
    entityType: string;
    entityId: string;
    summary: string;
    details: string;
  }) {
    return mediaStudioRepository.createAIInsight({
      brandId: payload.brandId ?? null,
      os: "media",
      entityType: payload.entityType,
      entityId: payload.entityId,
      summary: payload.summary,
      details: payload.details,
    });
  },
};

function normalizeWhiteLabelPayload(payload: WhiteLabelRequest): WhiteLabelRequest {
  const surfaces = ensureSurfaces(payload.surfaces);
  return { ...payload, surfaces, style: payload.style ?? "modern" };
}

function buildWhiteLabelPrompt(payload: WhiteLabelRequest, index: number) {
  const base = payload.prompt ?? `White-label product mockup for ${payload.productName ?? "brand product"}`;
  const scene = payload.scene ? `Scene: ${payload.scene}` : "Studio lighting";
  const colors = payload.brandColors
    ? `Brand colors primary ${payload.brandColors.primary ?? ""}, secondary ${payload.brandColors.secondary ?? ""}, accent ${payload.brandColors.accent ?? ""}`
    : "";
  const surfaces = payload.surfaces?.length ? `Surfaces: ${payload.surfaces.join(", ")}` : "Surfaces: front and back";
  const dimensions = payload.customDimensions
    ? `Dimensions W:${payload.customDimensions.width ?? "?"} H:${payload.customDimensions.height ?? "?"} D:${payload.customDimensions.depth ?? "?"}`
    : "";
  const logo = payload.logoUrl ? "Include logo overlay" : "Placeholder logo position";
  const style = payload.style ? `Style: ${payload.style}` : "Style: modern, minimal";
  return `${base} | ${scene} | ${colors} | ${surfaces} | ${dimensions} | ${logo} | ${style} | variant ${index + 1}`.trim();
}

function buildRecipe(payload: WhiteLabelRequest, ctx: MediaCallContext, outputs: string[]) {
  return {
    brandId: payload.brandId ?? ctx.brandId,
    productId: payload.productId,
    engineId: payload.engineId ?? getDefaultImageProviderId(),
    style: payload.style,
    scene: payload.scene,
    colors: payload.brandColors,
    surfaces: payload.surfaces,
    logoUrl: payload.logoUrl,
    customDimensions: payload.customDimensions,
    outputs,
    generatedAt: new Date().toISOString(),
  };
}

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

logger.debug("[media] media-studio service initialized");
