// This file has been moved to the integration tests folder.
import { jest } from '@jest/globals';
import { partnersService } from "../../modules/partners/partners.service.js";
import { partnersRepository } from "../../core/db/repositories/partners.repository.js";
import { Decimal } from "@prisma/client/runtime/library";
import type {
  PartnerContractRecord,
  PartnerMinimalRecord,
  PartnerPricingRecord,
  PartnerRecord,
  PartnerUserRecord as PartnerUserDbRecord,
} from "../../core/db/repositories/partners.repository.js";

const baseBrandId = "brand-abc";

const basePartner: PartnerMinimalRecord = {
  id: "partner-1",
  brandId: baseBrandId,
};

const now = new Date();

afterEach(() => {
  jest.restoreAllMocks();
});

describe("partners service", () => {
  it("creates a partner under the requested brand and normalizes location", async () => {
    const createInput = {
      brandId: baseBrandId,
      type: "RESELLER" as const,
      name: "North Star",
      country: "  United  States  ",
      city: "New   York ",
      tierId: "tier-gold",
      status: "ACTIVE" as const,
    };

    jest
      .spyOn(partnersRepository, "getBrandById")
      .mockResolvedValue({ id: createInput.brandId, defaultCurrency: "EUR" });
    jest.spyOn(partnersRepository, "getTierForBrand").mockResolvedValue({ id: createInput.tierId });
    jest.spyOn(partnersRepository, "findPartnerByName").mockResolvedValue(null);

    const createdPartner: PartnerRecord = {
      ...basePartner,
      type: createInput.type,
      name: createInput.name,
      country: "United States",
      city: "New York",
      status: "ACTIVE",
      tierId: createInput.tierId,
      tier: { id: createInput.tierId, name: "Gold" },
      createdAt: now,
      updatedAt: now,
    };

    const createSpy = jest.spyOn(partnersRepository, "createPartner").mockResolvedValue(createdPartner);

    const result = await partnersService.create(createInput);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: { connect: { id: createInput.brandId } },
        country: "United States",
        city: "New York",
        tier: { connect: { id: createInput.tierId } },
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: createdPartner.id,
        brandId: createdPartner.brandId,
        country: createdPartner.country,
        city: createdPartner.city,
        tierId: createdPartner.tierId,
      }),
    );
  });

  describe("partner contracts", () => {
    const contractTerms = { clauses: ["deliver"] };
    const contractStartDate = new Date("2025-01-01T00:00:00.000Z");
    const contractRow: PartnerContractRecord = {
      id: "contract-1",
      partnerId: basePartner.id,
      startDate: contractStartDate,
      endDate: null,
      termsJson: JSON.stringify(contractTerms),
      createdAt: now,
      updatedAt: now,
      partner: { brandId: baseBrandId },
    };

    it("serializes terms when creating a contract", async () => {
      jest.spyOn(partnersRepository, "getPartnerMinimal").mockResolvedValue(basePartner);
      const contractSpy = jest
        .spyOn(partnersRepository, "createOrUpdatePartnerContractAtomic")
        .mockResolvedValue(contractRow);

      const result = await partnersService.createPartnerContract({
        partnerId: basePartner.id,
        brandId: baseBrandId,
        terms: contractTerms,
      });

      expect(contractSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: null,
          createData: expect.objectContaining({
            termsJson: JSON.stringify(contractTerms),
          }),
        }),
      );
      expect(result.terms).toEqual(contractTerms);
    });

    it("updates a contract while preserving JSON terms", async () => {
      const updatedTerms = { clauses: ["deliver", "measure"] };
      const contractBefore: PartnerContractRecord = { ...contractRow, termsJson: JSON.stringify(contractTerms) };
      jest.spyOn(partnersRepository, "getPartnerMinimal").mockResolvedValue(basePartner);
      jest.spyOn(partnersRepository, "getPartnerContract").mockResolvedValue(contractBefore);
      const updatedContract: PartnerContractRecord = { ...contractRow, termsJson: JSON.stringify(updatedTerms) };
      const contractSpy = jest
        .spyOn(partnersRepository, "createOrUpdatePartnerContractAtomic")
        .mockResolvedValue(updatedContract);

      const result = await partnersService.updatePartnerContract(
        contractRow.id,
        basePartner.id,
        baseBrandId,
        { terms: updatedTerms, startDate: "2025-02-01" },
      );

      expect(contractSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: contractRow.id,
          updateData: expect.objectContaining({
            termsJson: JSON.stringify(updatedTerms),
          }),
        }),
      );
      expect(result.terms).toEqual(updatedTerms);
    });
  });

  describe("pricing upsert", () => {
    const productId = "product-9";

    it("enforces brand ownership before upserting pricing", async () => {
    jest.spyOn(partnersRepository, "getPartnerMinimal").mockResolvedValue(basePartner);
    jest.spyOn(partnersRepository, "getProductForBrand").mockResolvedValue({ id: productId });
    jest.spyOn(partnersRepository, "getBrandCurrency").mockResolvedValue({ defaultCurrency: "EUR" });
    const pricingRecord: PartnerPricingRecord = {
      id: "pricing-1",
      partnerId: basePartner.id,
      productId,
      netPrice: new Decimal(120),
      currency: "EUR",
      createdAt: now,
      updatedAt: now,
      product: { name: "Widget" },
    };
    const upsertSpy = jest.spyOn(partnersRepository, "upsertPartnerPricingAtomic").mockResolvedValue(pricingRecord);

      const result = await partnersService.upsertPartnerPricing({
        partnerId: basePartner.id,
        brandId: baseBrandId,
        productId,
        netPrice: 120,
      });

      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          partnerId: basePartner.id,
          productId,
          netPrice: 120,
          currency: "EUR",
        }),
      );
      expect(result.currency).toBe("EUR");
    });

    it("rejects pricing upserts when the product is not part of the brand", async () => {
      jest.spyOn(partnersRepository, "getPartnerMinimal").mockResolvedValue(basePartner);
      jest.spyOn(partnersRepository, "getProductForBrand").mockResolvedValue(null);

      await expect(
        partnersService.upsertPartnerPricing({
          partnerId: basePartner.id,
          brandId: baseBrandId,
          productId,
          netPrice: 90,
        }),
      ).rejects.toThrow("Product not found for this brand");
    });
  });

  describe("partner users", () => {
    it("attaches an existing user to the partner", async () => {
      const userId = "user-42";
      jest.spyOn(partnersRepository, "getPartnerMinimal").mockResolvedValue(basePartner);
      jest.spyOn(partnersRepository, "getUserById").mockResolvedValue({ id: userId });
      jest.spyOn(partnersRepository, "getPartnerUserByPartnerAndUser").mockResolvedValue(null);
      const attachedPartnerUser: PartnerUserDbRecord = {
        id: "partner-user-1",
        userId,
        partnerId: basePartner.id,
        role: "PARTNER_ADMIN",
        user: { id: userId, email: "lead@example.com" },
        createdAt: now,
        updatedAt: now,
      };
      const attachSpy = jest
        .spyOn(partnersRepository, "attachUserToPartnerAtomic")
        .mockResolvedValue(attachedPartnerUser);

      const result = await partnersService.createPartnerUser(basePartner.id, baseBrandId, {
        userId,
        role: "PARTNER_ADMIN",
      });

      expect(attachSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          partnerId: basePartner.id,
          role: "PARTNER_ADMIN",
        }),
      );
      expect(result.userEmail).toBe("lead@example.com");
    });

    it("removes a partner user after validating partner scope", async () => {
      const partnerUserId = "partner-user-2";
      jest.spyOn(partnersRepository, "getPartnerMinimal").mockResolvedValue(basePartner);
      const existingPartnerUser: PartnerUserDbRecord = {
        id: partnerUserId,
        userId: "user-7",
        partnerId: basePartner.id,
        role: "PARTNER_ADMIN",
        user: { id: "user-7", email: "existing@example.com" },
        createdAt: now,
        updatedAt: now,
      };
      jest.spyOn(partnersRepository, "getPartnerUser").mockResolvedValue(existingPartnerUser);
      const deleteSpy = jest.spyOn(partnersRepository, "deletePartnerUser").mockResolvedValue({ id: partnerUserId });

      const result = await partnersService.deactivatePartnerUser(
        basePartner.id,
        baseBrandId,
        partnerUserId,
      );

      expect(deleteSpy).toHaveBeenCalledWith(partnerUserId);
      expect(result.id).toBe(partnerUserId);
    });
  });
});
