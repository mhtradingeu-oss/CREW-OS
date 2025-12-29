import { badRequest } from "../../../http/errors.js";
import { logger } from "../../../logger.js";
import type {
  ImageGenerationParams,
  ImageGenerationResult,
  ImageMediaProvider,
  MediaCallContext,
} from "./media.types.js";

const DEFAULT_TIMEOUT_MS = 45_000;

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

function extractImageUrl(data: any): string {
  if (!data) return "";
  if (typeof data.url === "string") return data.url;
  if (Array.isArray(data.data) && data.data[0]?.url) return String(data.data[0].url);
  if (Array.isArray(data.output) && data.output[0]) return String(data.output[0]);
  if (Array.isArray(data.images) && data.images[0]) return String(data.images[0]);
  if (Array.isArray(data.artifacts) && data.artifacts[0]?.url) return String(data.artifacts[0].url);
  if (Array.isArray(data.artifacts) && data.artifacts[0]?.base64) {
    return `data:image/png;base64,${data.artifacts[0].base64}`;
  }
  if (Array.isArray(data.data) && data.data[0]?.b64_json) {
    return `data:image/png;base64,${data.data[0].b64_json}`;
  }
  return "";
}

function finalizeImage(
  provider: ImageMediaProvider["id"],
  params: ImageGenerationParams,
  payload: any,
): ImageGenerationResult {
  const url = extractImageUrl(payload);
  if (!url) {
    throw badRequest("Media provider did not return an image URL");
  }
  return {
    url,
    width: params.width ?? Number((payload as any)?.width ?? 1024),
    height: params.height ?? Number((payload as any)?.height ?? 1024),
    provider,
    meta: payload,
  };
}

export function getImageProviderDefinitions(): ImageMediaProvider[] {
  const sdxlHttpUrl = process.env.MEDIA_SDXL_HTTP_URL;
  const sdxlLocalUrl = process.env.MEDIA_SDXL_LOCAL_URL;
  const openaiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const stabilityKey = process.env.STABILITY_API_KEY;
  const replicateKey = process.env.REPLICATE_API_KEY;
  const hfKey = process.env.HF_API_KEY;

  const providers: ImageMediaProvider[] = [
    {
      id: "sdxl-http",
      kind: "image",
      label: "SDXL HTTP",
      description: "Self-hosted SDXL over HTTP",
      isFree: true,
      requiresApiKey: false,
      envVarKeys: ["MEDIA_SDXL_HTTP_URL"],
      enabledByDefault: Boolean(sdxlHttpUrl),
      async generate(params: ImageGenerationParams, _ctx: MediaCallContext) {
        if (!sdxlHttpUrl) {
          throw badRequest("MEDIA_SDXL_HTTP_URL not configured");
        }
        const payload = await postJson(
          sdxlHttpUrl,
          {
            prompt: params.prompt,
            negative_prompt: params.negativePrompt,
            width: params.width,
            height: params.height,
            steps: params.steps,
            cfg_scale: params.cfgScale,
            seed: params.seed,
            style: params.stylePreset,
            format: params.format ?? "png",
          },
          {},
          60_000,
        );
        return finalizeImage("sdxl-http", params, payload);
      },
    },
    {
      id: "sdxl-local",
      kind: "image",
      label: "SDXL Local",
      description: "Local SDXL node (HTTP)",
      isFree: true,
      requiresApiKey: false,
      envVarKeys: ["MEDIA_SDXL_LOCAL_URL"],
      enabledByDefault: Boolean(sdxlLocalUrl),
      async generate(params: ImageGenerationParams, _ctx: MediaCallContext) {
        if (!sdxlLocalUrl && !sdxlHttpUrl) {
          throw badRequest("SDXL local URL not configured");
        }
        const target = sdxlLocalUrl ?? sdxlHttpUrl!;
        const payload = await postJson(
          target,
          {
            prompt: params.prompt,
            negative_prompt: params.negativePrompt,
            width: params.width,
            height: params.height,
            steps: params.steps ?? 30,
            cfg_scale: params.cfgScale ?? 7,
            seed: params.seed,
            style: params.stylePreset,
            format: params.format ?? "png",
          },
          {},
          60_000,
        );
        return finalizeImage("sdxl-local", params, payload);
      },
    },
    {
      id: "openai-images",
      kind: "image",
      label: "OpenAI Images",
      description: "OpenAI images (DALL·E)",
      isFree: false,
      requiresApiKey: true,
      envVarKeys: ["OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_API_KEY"],
      enabledByDefault: true,
      async generate(params: ImageGenerationParams, _ctx: MediaCallContext) {
        if (!openaiKey) {
          throw badRequest("OPENAI_API_KEY not configured");
        }
        const payload = await postJson(
          process.env.OPENAI_IMAGE_BASE_URL ?? "https://api.openai.com/v1/images/generations",
          {
            prompt: params.prompt,
            size: params.width && params.height ? `${params.width}x${params.height}` : undefined,
            response_format: "url",
            n: 1,
          },
          {
            Authorization: `Bearer ${openaiKey}`,
          },
        );
        return finalizeImage("openai-images", params, payload);
      },
    },
    {
      id: "stability-images",
      kind: "image",
      label: "Stability AI",
      description: "Stability diffusion image generation",
      isFree: false,
      requiresApiKey: true,
      envVarKeys: ["STABILITY_API_KEY"],
      enabledByDefault: true,
      async generate(params: ImageGenerationParams, _ctx: MediaCallContext) {
        if (!stabilityKey) {
          throw badRequest("STABILITY_API_KEY not configured");
        }
        const payload = await postJson(
          process.env.STABILITY_API_URL ??
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
          {
            text_prompts: [
              { text: params.prompt },
              params.negativePrompt ? { text: params.negativePrompt, weight: -1 } : undefined,
            ].filter(Boolean),
            width: params.width ?? 1024,
            height: params.height ?? 1024,
            steps: params.steps ?? 30,
            cfg_scale: params.cfgScale ?? 7,
            seed: params.seed,
            samples: 1,
          },
          { Authorization: `Bearer ${stabilityKey}` },
        );
        return finalizeImage("stability-images", params, payload);
      },
    },
    {
      id: "replicate-image",
      kind: "image",
      label: "Replicate Image",
      description: "Replicate hosted models (SDXL)",
      isFree: false,
      requiresApiKey: true,
      envVarKeys: ["REPLICATE_API_KEY"],
      enabledByDefault: true,
      async generate(params: ImageGenerationParams, ctx: MediaCallContext) {
        if (!replicateKey) {
          throw badRequest("REPLICATE_API_KEY not configured");
        }
        const version =
          process.env.REPLICATE_IMAGE_VERSION ??
          "8f8cd74e1d0e0364ff6cae7fd009a9d19b60aecb4b14a57567a0fd1f6f0656be";
        const payload = await postJson(
          process.env.REPLICATE_API_URL ?? "https://api.replicate.com/v1/predictions",
          {
            version,
            input: {
              prompt: params.prompt,
              negative_prompt: params.negativePrompt,
              image_dimensions:
                params.width && params.height ? `${params.width}x${params.height}` : undefined,
              guidance_scale: params.cfgScale ?? 7,
              num_inference_steps: params.steps ?? 30,
              seed: params.seed,
              output_format: params.format ?? "png",
            },
            webhook: ctx.traceId ? `${process.env.MEDIA_REPLICATE_WEBHOOK_BASE ?? ""}/media/${ctx.traceId}` : undefined,
          },
          { Authorization: `Token ${replicateKey}` },
          60_000,
        );
        const url =
          extractImageUrl(payload.output) || extractImageUrl(payload) || extractImageUrl(payload.data ?? {});
        return finalizeImage("replicate-image", params, { ...payload, url });
      },
    },
    {
      id: "huggingface-image",
      kind: "image",
      label: "HuggingFace Inference",
      description: "HuggingFace text-to-image endpoint",
      isFree: false,
      requiresApiKey: false,
      envVarKeys: ["HF_API_KEY", "HF_IMAGE_MODEL_URL"],
      enabledByDefault: true,
      async generate(params: ImageGenerationParams) {
        const target = process.env.HF_IMAGE_MODEL_URL;
        if (!target) {
          throw badRequest("HF_IMAGE_MODEL_URL not configured");
        }
        const headers: Record<string, string> = {};
        if (hfKey) {
          headers.Authorization = `Bearer ${hfKey}`;
        }
        const payload = await postJson(
          target,
          {
            inputs: params.prompt,
            parameters: {
              negative_prompt: params.negativePrompt,
              width: params.width,
              height: params.height,
              num_inference_steps: params.steps,
              guidance_scale: params.cfgScale,
              seed: params.seed,
            },
          },
          headers,
          60_000,
        );
        return finalizeImage("huggingface-image", params, payload);
      },
    },
    {
      id: "canva-style-mockup",
      kind: "image",
      label: "Canva-style Mockup",
      description: "Simple placeholder mockup generator",
      isFree: true,
      requiresApiKey: false,
      envVarKeys: [],
      enabledByDefault: true,
      async generate(params: ImageGenerationParams) {
        // Generates a deterministic placeholder URL so callers can proceed without a paid provider.
        const width = params.width ?? 1024;
        const height = params.height ?? 1024;
        const text = encodeURIComponent(params.prompt.slice(0, 60) || "mockup");
        const url = `https://placehold.co/${width}x${height}?text=${text}`;
        return {
          url,
          width,
          height,
          provider: "canva-style-mockup",
          meta: { placeholder: true, prompt: params.prompt },
        };
      },
    },
  ];

  logger.debug("[media] image provider definitions initialized", { count: providers.length });
  return providers;
}
