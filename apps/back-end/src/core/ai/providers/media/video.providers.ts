import { badRequest } from "../../../http/errors.js";
import { logger } from "../../../logger.js";
import type {
  MediaCallContext,
  VideoGenerationParams,
  VideoGenerationResult,
  VideoMediaProvider,
} from "./media.types.js";

const DEFAULT_TIMEOUT_MS = 60_000;

async function postJson(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = (json as { error?: string })?.error ?? `Media provider HTTP ${response.status}`;
      throw badRequest(message);
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function extractVideoUrl(data: any): { video?: string; preview?: string } {
  if (!data) return {};
  if (typeof data.url === "string") return { video: data.url, preview: data.preview }; // generic
  if (Array.isArray(data.output) && data.output[0]) return { video: String(data.output[0]) };
  if (data.video_url) return { video: String(data.video_url), preview: data.preview_url };
  if (data.result?.video) return { video: String(data.result.video), preview: data.result.preview };
  return {};
}

function finalizeVideo(
  provider: VideoMediaProvider["id"],
  params: VideoGenerationParams,
  payload: any,
): VideoGenerationResult {
  const { video, preview } = extractVideoUrl(payload);
  if (!video) {
    throw badRequest("Media provider did not return a video URL");
  }
  return {
    url: video,
    previewImageUrl: preview,
    provider,
    meta: payload,
  };
}

export function getVideoProviderDefinitions(): VideoMediaProvider[] {
  const stableVideoUrl = process.env.MEDIA_STABLE_VIDEO_URL;
  const pikaKey = process.env.PIKA_API_KEY;
  const runwayKey = process.env.RUNWAY_API_KEY;
  const replicateKey = process.env.REPLICATE_API_KEY;
  const modelScopeUrl = process.env.MODELSCOPE_VIDEO_URL;

  const providers: VideoMediaProvider[] = [
    {
      id: "stable-video",
      kind: "video",
      label: "Stable Video Diffusion (HTTP)",
      description: "Self-hosted or HTTP Stable Video Diffusion",
      isFree: true,
      requiresApiKey: false,
      envVarKeys: ["MEDIA_STABLE_VIDEO_URL"],
      enabledByDefault: Boolean(stableVideoUrl),
      async generate(params: VideoGenerationParams) {
        if (!stableVideoUrl) {
          throw badRequest("MEDIA_STABLE_VIDEO_URL not configured");
        }
        const payload = await postJson(
          stableVideoUrl,
          {
            prompt: params.prompt,
            num_frames: Math.max(20, (params.durationSeconds ?? 5) * (params.fps ?? 8)),
            fps: params.fps ?? 8,
            aspect_ratio: params.aspectRatio ?? "16:9",
            seed: params.seed,
          },
          {},
          90_000,
        );
        return finalizeVideo("stable-video", params, payload);
      },
    },
    {
      id: "pika-video",
      kind: "video",
      label: "Pika Video",
      description: "Pika Labs video generation",
      isFree: false,
      requiresApiKey: true,
      envVarKeys: ["PIKA_API_KEY"],
      enabledByDefault: true,
      async generate(params: VideoGenerationParams) {
        if (!pikaKey) {
          throw badRequest("PIKA_API_KEY not configured");
        }
        const payload = await postJson(
          process.env.PIKA_API_URL ?? "https://api.pika.art/v1/video",
          {
            prompt: params.prompt,
            aspect_ratio: params.aspectRatio ?? "16:9",
            duration: params.durationSeconds ?? 5,
            fps: params.fps ?? 24,
            guidance_scale: 7,
            seed: params.seed,
          },
          { Authorization: `Bearer ${pikaKey}` },
          90_000,
        );
        return finalizeVideo("pika-video", params, payload);
      },
    },
    {
      id: "runway-video",
      kind: "video",
      label: "Runway",
      description: "Runway ML video generation",
      isFree: false,
      requiresApiKey: true,
      envVarKeys: ["RUNWAY_API_KEY"],
      enabledByDefault: true,
      async generate(params: VideoGenerationParams) {
        if (!runwayKey) {
          throw badRequest("RUNWAY_API_KEY not configured");
        }
        const payload = await postJson(
          process.env.RUNWAY_API_URL ?? "https://api.runwayml.com/v1/videos",
          {
            prompt: params.prompt,
            duration: params.durationSeconds ?? 5,
            ratio: params.aspectRatio ?? "16:9",
            fps: params.fps ?? 24,
            seed: params.seed,
          },
          { Authorization: `Bearer ${runwayKey}` },
          90_000,
        );
        return finalizeVideo("runway-video", params, payload);
      },
    },
    {
      id: "replicate-video",
      kind: "video",
      label: "Replicate Video",
      description: "Replicate hosted video models",
      isFree: false,
      requiresApiKey: true,
      envVarKeys: ["REPLICATE_API_KEY"],
      enabledByDefault: true,
      async generate(params: VideoGenerationParams, ctx: MediaCallContext) {
        if (!replicateKey) {
          throw badRequest("REPLICATE_API_KEY not configured");
        }
        const version =
          process.env.REPLICATE_VIDEO_VERSION ??
          "a475f0a9d939f1042e35d5ad9d1fba07f6576682189e50e54f9b89e0c8a2c188";
        const payload = await postJson(
          process.env.REPLICATE_API_URL ?? "https://api.replicate.com/v1/predictions",
          {
            version,
            input: {
              prompt: params.prompt,
              fps: params.fps ?? 24,
              aspect_ratio: params.aspectRatio ?? "16:9",
              duration: params.durationSeconds ?? 8,
              seed: params.seed,
            },
            webhook: ctx.traceId ? `${process.env.MEDIA_REPLICATE_WEBHOOK_BASE ?? ""}/media/${ctx.traceId}` : undefined,
          },
          { Authorization: `Token ${replicateKey}` },
          90_000,
        );
        const url = extractVideoUrl(payload.output).video ?? extractVideoUrl(payload).video;
        return finalizeVideo("replicate-video", params, { ...payload, url });
      },
    },
    {
      id: "modelscope-video",
      kind: "video",
      label: "ModelScope Video",
      description: "ModelScope/SVD HTTP endpoint",
      isFree: true,
      requiresApiKey: false,
      envVarKeys: ["MODELSCOPE_VIDEO_URL"],
      enabledByDefault: Boolean(modelScopeUrl),
      async generate(params: VideoGenerationParams) {
        if (!modelScopeUrl) {
          throw badRequest("MODELSCOPE_VIDEO_URL not configured");
        }
        const payload = await postJson(
          modelScopeUrl,
          {
            prompt: params.prompt,
            duration: params.durationSeconds ?? 6,
            fps: params.fps ?? 12,
            aspect_ratio: params.aspectRatio ?? "16:9",
            seed: params.seed,
          },
          {},
          90_000,
        );
        return finalizeVideo("modelscope-video", params, payload);
      },
    },
    {
      id: "placeholder-sora",
      kind: "video",
      label: "Placeholder (Sora)",
      description: "Stub placeholder until Sora or equivalent is available",
      isFree: true,
      requiresApiKey: false,
      envVarKeys: [],
      enabledByDefault: true,
      async generate(params: VideoGenerationParams) {
        const widthHeight = (params.aspectRatio ?? "16:9").includes("9:16") ? "720x1280" : "1280x720";
        const url = `https://placehold.co/${widthHeight}?text=${encodeURIComponent(
          params.prompt.slice(0, 50) || "preview",
        )}`;
        return {
          url,
          provider: "placeholder-sora",
          previewImageUrl: url,
          meta: { placeholder: true, message: "Sora-style preview placeholder" },
        };
      },
    },
  ];

  logger.debug("[media] video provider definitions initialized", { count: providers.length });
  return providers;
}
