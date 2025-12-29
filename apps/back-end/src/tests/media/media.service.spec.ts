import assert from "node:assert/strict";
import test from "node:test";
import { forbidden } from "../../core/http/errors.js";
import type { MediaCallContext } from "../../core/ai/providers/media/media.types.js";
import { mediaStudioService } from "../../modules/media-studio/media-studio.service.js";
import * as mediaEngine from "../../core/ai/engines/media.engine.js";

const ctx: MediaCallContext = { brandId: "b-test", tenantId: "t-test" };

test("media-studio generate image returns provider output", async (t) => {
  t.mock.method(mediaEngine, "generateImage", async () => ({
    url: "https://example.com/image.png",
    width: 512,
    height: 512,
    provider: "canva-style-mockup",
  }));

  const result = await mediaStudioService.generateImage({ prompt: "hero shot" } as any, ctx);
  assert.equal(result.provider, "canva-style-mockup");
  assert.equal(result.url.endsWith(".png"), true);
});

test("media-studio propagate safety errors from engine", async (t) => {
  t.mock.method(mediaEngine, "generateVideo", async () => {
    throw forbidden("blocked by safety");
  });

  await assert.rejects(
    () => mediaStudioService.generateVideo({ prompt: "nsfw" } as any, ctx),
    /blocked by safety/i,
  );
});
