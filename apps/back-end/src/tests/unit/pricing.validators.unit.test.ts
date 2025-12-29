import { z } from "zod";
import {
  createPricingInputSchema,
  pricingDraftCreateSchema,
  pricingDraftApprovalSchema,
  pricingDraftRejectionSchema,
  competitorPriceCreateSchema,
  pricingListQuerySchema,
} from "@mh-os/shared";

describe("pricing validators", () => {
  it("validates createPricingInputSchema: valid", () => {
    const valid = { productId: "p1", currency: "USD", basePrice: 10, cost: 5 };
    expect(createPricingInputSchema.parse(valid)).toMatchObject(valid);
  });
  it("createPricingInputSchema: throws on missing productId", () => {
    expect(() => createPricingInputSchema.parse({ currency: "USD", basePrice: 10, cost: 5 })).toThrow();
  });

  it("validates pricingDraftCreateSchema: valid", () => {
    const valid = { channel: "web", oldNet: 10, newNet: 12 };
    expect(pricingDraftCreateSchema.parse(valid)).toMatchObject(valid);
  });
  it("pricingDraftCreateSchema: throws on missing channel", () => {
    expect(() => pricingDraftCreateSchema.parse({ oldNet: 10, newNet: 12 })).toThrow();
  });

  it("validates pricingDraftApprovalSchema: valid", () => {
    expect(pricingDraftApprovalSchema.parse({ approvedById: "u1" })).toMatchObject({ approvedById: "u1" });
  });

  it("validates pricingDraftRejectionSchema: valid", () => {
    expect(pricingDraftRejectionSchema.parse({ reason: "bad" })).toMatchObject({ reason: "bad" });
  });

  it("validates competitorPriceCreateSchema: valid", () => {
    const valid = { competitor: "c1", priceNet: 10, priceGross: 12 };
    expect(competitorPriceCreateSchema.parse(valid)).toMatchObject(valid);
  });
});
