import { z } from "zod";

export const mediaEngineIdEnum = z.enum([
  "sdxl-local",
  "sdxl-http",
  "openai-images",
  "stability-images",
  "replicate-image",
  "huggingface-image",
  "canva-style-mockup",
  "stable-video",
  "pika-video",
  "runway-video",
  "replicate-video",
  "modelscope-video",
  "placeholder-sora",
]);

export const imageGenerationSchema = z.object({
  prompt: z.string().min(1, "prompt is required"),
  negativePrompt: z.string().optional(),
  engineId: mediaEngineIdEnum.optional(),
  width: z.number().int().positive().max(2048).optional(),
  height: z.number().int().positive().max(2048).optional(),
  steps: z.number().int().positive().max(150).optional(),
  cfgScale: z.number().positive().max(20).optional(),
  seed: z.number().int().nonnegative().optional(),
  stylePreset: z.string().optional(),
  format: z.enum(["png", "jpg", "webp"]).optional(),
  namespace: z.string().optional(),
});

export const videoGenerationSchema = z.object({
  prompt: z.string().min(1, "prompt is required"),
  engineId: mediaEngineIdEnum.optional(),
  durationSeconds: z.number().int().positive().max(30).default(5),
  fps: z.number().int().positive().max(60).optional(),
  aspectRatio: z.string().optional(),
  seed: z.number().int().nonnegative().optional(),
  stylePreset: z.string().optional(),
  namespace: z.string().optional(),
});

const colorSchema = z.object({
  primary: z.string().optional(),
  secondary: z.string().optional(),
  accent: z.string().optional(),
});

const dimensionSchema = z.object({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),
});

const surfaceEnum = z.enum(["front", "back", "side", "top", "lid", "bottom"]);

const whiteLabelBaseSchema = z.object({
  brandId: z.string().optional(),
  productId: z.string().optional(),
  baseProductId: z.string().optional(),
  customDimensions: dimensionSchema.optional(),
  surfaces: z.array(surfaceEnum).default(["front", "back"]),
  logoUrl: z.string().url().optional(),
  brandColors: colorSchema.optional(),
  style: z.string().default("modern"),
  scene: z.string().optional(),
  prompt: z.string().optional(),
  engineId: mediaEngineIdEnum.optional(),
  count: z.number().int().positive().max(8).default(1),
});

export const whiteLabelPreviewSchema = whiteLabelBaseSchema;

export const whiteLabelBatchSchema = whiteLabelBaseSchema.extend({
  variants: z.array(whiteLabelBaseSchema.partial({ count: true, engineId: true })).min(1).optional(),
});

export const whiteLabelProductMockupSchema = whiteLabelBaseSchema.extend({
  productName: z.string().optional(),
  description: z.string().optional(),
});

export const mediaIdeasSchema = z.object({
  brandId: z.string().trim().min(1),
  productId: z.string().trim().min(1).optional(),
  topic: z.string().trim().min(3).max(500).optional(),
});
