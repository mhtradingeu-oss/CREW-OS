// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.

export async function listImageEngines(): Promise<MediaEngine[]> {
  return [];
}

export async function listVideoEngines(): Promise<MediaEngine[]> {
  return [];
}

export async function generateImage(_payload: ImageGeneratePayload): Promise<null> {
  return null;
}

export async function generateVideo(_payload: VideoGeneratePayload): Promise<null> {
  return null;
}

type ApiEnvelope<T> = { success?: boolean; data: T };

export type MediaEngine = {
  id: string;
  label: string;
  description?: string;
  isFree: boolean;
  requiresApiKey: boolean;
  enabledByDefault: boolean;
  envVarKeys?: string[];
  available?: boolean;
  missingKeys?: string[];
};

export type ImageGeneratePayload = {
  prompt: string;
  negativePrompt?: string;
  engineId?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  stylePreset?: string;
  format?: "png" | "jpg" | "webp";
};

export type VideoGeneratePayload = {
  prompt: string;
  engineId?: string;
  durationSeconds?: number;
  fps?: number;
  aspectRatio?: string;
  seed?: number;
  stylePreset?: string;
};

export type MediaGeneratePayload =
  | (ImageGeneratePayload & { type: "image"; resolution?: string })
  | (VideoGeneratePayload & { type: "video" });

export type MediaAsset = {
  url: string;
  provider: string;
  kind: "image" | "video";
  width?: number;
  height?: number;
  previewImageUrl?: string;
  meta?: Record<string, unknown>;
  riskLevel?: string;
  runId?: string;
};

// V1 stub already defined above

// V1 stub already defined above

// V1 stub already defined above

// V1 stub already defined above

// V1: generateMedia is disabled (read-only build)
export async function generateMedia(_payload: MediaGeneratePayload): Promise<null> {
  return null;
}
