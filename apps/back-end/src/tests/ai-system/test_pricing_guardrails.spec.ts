import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../core/http/errors.js";
import { __test__ as pricingTest } from "../../modules/pricing/pricing.service.js";

test("guardrail allows prices at or above cost", () => {
  assert.doesNotThrow(() => pricingTest.assertNonNegativeMargin(10, 5));
  assert.doesNotThrow(() => pricingTest.assertNonNegativeMargin(5, 5));
});

test("guardrail blocks prices below cost with code", () => {
  assert.throws(
    () => pricingTest.assertNonNegativeMargin(4.99, 5),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.equal(err.code, "PRICING_BELOW_COST");
      return true;
    },
  );
});

test("minNonNull returns smallest present value", () => {
  assert.equal(pricingTest.minNonNull([null, undefined, 5, 3, 8]), 3);
  assert.equal(pricingTest.minNonNull([null, undefined]), null);
});

test("clampToCostFloor raises price and risk when below cost", () => {
  const guarded = pricingTest.clampToCostFloor(
    { suggestedPrice: 90, reasoning: "raw", riskLevel: "MEDIUM" },
    100,
  );
  assert.equal(guarded.suggestedPrice, 100);
  assert.equal(guarded.riskLevel, "HIGH");
  assert.match(guarded.reasoning, /Clamped to cost floor/);
});
