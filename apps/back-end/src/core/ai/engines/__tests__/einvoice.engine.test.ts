import { describe, it, expect } from "@jest/globals";
import { XRECHNUNG_SKELETON, buildValidationPromptPayload } from "../einvoice.prompts.js";
import {
  generateEInvoiceSchema,
  sendEInvoiceSchema,
  validateEInvoiceSchema,
} from "../../../../modules/finance/einvoice.validators.js";
import * as controller from "../../../../modules/finance/einvoice.controller.js";
import { ApiError } from "../../../http/errors.js";

function mockResponse() {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: unknown) => {
    res.body = payload;
    return res;
  };
  return res;
}

function mockRequest(body: any = {}, params: any = {}, query: any = {}, user: any = {}) {
  return { body, params, query, user } as any;
}

describe("einvoice.engine", () => {
  it("XML generation skeleton contains EN 16931 structure", () => {
    expect(XRECHNUNG_SKELETON).toContain("CrossIndustryInvoice");
    expect(XRECHNUNG_SKELETON).toContain("GrandTotalAmount");
  });

  it("Validation prompt enforces monetary safety", () => {
    const prompt = buildValidationPromptPayload("XRECHNUNG", "<xml>demo</xml>");
    expect(prompt).toContain("Never correct monetary totals");
    expect(prompt).toContain("EN 16931");
  });
});


describe("einvoice.engine", () => {
  // ...existing code...

  it("Schemas guard required fields", () => {
    expect(generateEInvoiceSchema.safeParse({ invoiceId: "abc", format: "XRECHNUNG" }).success).toBe(true);
    expect(validateEInvoiceSchema.safeParse({ invoiceId: "abc", format: "XRECHNUNG", xml: "<x/>" }).success).toBe(true);
    expect(sendEInvoiceSchema.safeParse({ invoiceId: "abc", format: "ZUGFERD" }).success).toBe(true);
    expect(sendEInvoiceSchema.safeParse({ invoiceId: "", format: "ZUGFERD" }).success).toBe(false);
  });


  it("Controller returns validation error for bad request", async () => {
    const req = mockRequest({}, {}, {}, { id: "u1", role: "USER" });
    const res = mockResponse();
    let captured: unknown;
    const next = (err?: unknown) => {
      captured = err;
    };
    await controller.generate(req, res as any, next as any);
    expect(captured).toBeInstanceOf(ApiError);
    expect((captured as ApiError).status).toBe(400);
  });
});
