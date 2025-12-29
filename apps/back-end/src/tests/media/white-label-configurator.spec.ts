import assert from "node:assert/strict";
import test from "node:test";
import type { MediaCallContext } from "../../core/ai/providers/media/media.types.js";
import { whiteLabelConfiguratorService } from "../../modules/white-label-configurator/white-label-configurator.service.js";
import { mediaStudioService, type WhiteLabelRequest } from "../../modules/media-studio/media-studio.service.js";

const ctx: MediaCallContext = { brandId: "brand-test", tenantId: "tenant-test" };

test("preview ensures front/back/side surfaces are present", async (t) => {
  const calls: any[] = [];
  t.mock.method(mediaStudioService, "productMockup", async (payload: WhiteLabelRequest) => {
    calls.push(payload);
    return {
      outputs: [
        { surface: "front", url: "https://example.com/front.png", provider: "canva-style-mockup" },
        { surface: "back", url: "https://example.com/back.png", provider: "canva-style-mockup" },
      ],
      recipe: {},
    };
  });

  const result = await whiteLabelConfiguratorService.preview({ productName: "Test", surfaces: ["lid"] } as any, ctx);
  const invokedSurfaces = calls[0]?.surfaces ?? [];
  assert.ok(invokedSurfaces.includes("front"));
  assert.ok(invokedSurfaces.includes("back"));
  assert.ok(invokedSurfaces.includes("side"));
  assert.ok(invokedSurfaces.includes("lid"));
  assert.equal(result.outputs?.length ?? 0, 2);
});

test("batch normalizes variants and delegates to media studio", async (t) => {
  const calls: any[] = [];
  t.mock.method(mediaStudioService, "whiteLabelBatch", async (payload: WhiteLabelRequest & { variants?: WhiteLabelRequest[] }) => {
    calls.push(payload);
    return [{ previews: [], recipe: {} }];
  });

  await whiteLabelConfiguratorService.batch(
    { productName: "Bundle", variants: [{ surfaces: ["top"] }] } as any,
    ctx,
  );

  const surfaces = calls[0]?.surfaces ?? [];
  assert.ok(surfaces.includes("front"));
  assert.ok(surfaces.includes("back"));
  assert.ok(surfaces.includes("side"));
  assert.ok(surfaces.includes("top"));
});
