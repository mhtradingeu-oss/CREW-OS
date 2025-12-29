export type MediaProviderKind = "image" | "video";

export type MediaEngineId =
  | "sdxl-local"
  | "sdxl-http"
  | "openai-images"
  | "stability-images"
  | "replicate-image"
  | "huggingface-image"
  | "canva-style-mockup"
  | "stable-video"
  | "pika-video"
  | "runway-video"
  | "replicate-video"
  | "modelscope-video"
  | "placeholder-sora";

export interface BaseMediaProviderConfig {
  id: MediaEngineId;
  kind: MediaProviderKind;
  label: string;
  description?: string;
  isFree: boolean;
  requiresApiKey: boolean;
  envVarKeys?: string[];
  enabledByDefault: boolean;
}

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  stylePreset?: string;
  format?: "png" | "jpg" | "webp";
}

export interface ImageGenerationResult {
  url: string;
  width: number;
  height: number;
  provider: MediaEngineId;
  meta?: Record<string, unknown>;
}

export interface VideoGenerationParams {
  prompt: string;
  durationSeconds?: number;
  fps?: number;
  aspectRatio?: string;
  seed?: number;
  stylePreset?: string;
}

export interface VideoGenerationResult {
  url: string;
  provider: MediaEngineId;
  previewImageUrl?: string;
  meta?: Record<string, unknown>;
}

export interface MediaCallContext {
  brandId?: string;
  tenantId?: string;
  userId?: string;
  traceId?: string;
  namespace?: string;
}

export interface ImageMediaProvider extends BaseMediaProviderConfig {
  kind: "image";
  generate: (
    params: ImageGenerationParams,
    ctx: MediaCallContext,
  ) => Promise<ImageGenerationResult>;
}

export interface VideoMediaProvider extends BaseMediaProviderConfig {
  kind: "video";
  generate: (
    params: VideoGenerationParams,
    ctx: MediaCallContext,
  ) => Promise<VideoGenerationResult>;
}

export type MediaProvider = ImageMediaProvider | VideoMediaProvider;

export type ResolvedMediaProvider<T extends MediaProvider> = T & {
  available: boolean;
  missingKeys: string[];
};
