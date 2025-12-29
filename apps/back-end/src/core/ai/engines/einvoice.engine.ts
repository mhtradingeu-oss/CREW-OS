import { badRequest } from "../../http/errors.js";
import { createInsight } from "../../db/repositories/ai-insight.repository.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import {
  buildBrandContext,
  buildFinanceContext,
  buildInvoiceContext,
  type ContextBuilderOptions,
} from "../../../ai/context/context-builders.js";
import type { EngineRunOptions, EngineRunResponse } from "./engine-types.js";
import {
  buildInvoiceGenerationPrompt,
  buildValidationPromptPayload,
  XRECHNUNG_SKELETON,
  ZUGFERD_SKELETON,
} from "./einvoice.prompts.js";

const AGENT_ID = "EINVOICE_ENGINE" as const;
const VALIDATION_TASK = "VALIDATE_XML" as const;
const SUPPORTED_FORMATS = ["XRECHNUNG", "ZUGFERD"] as const;

type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

type InvoiceContext = NonNullable<Awaited<ReturnType<typeof buildInvoiceContext>>>;

export interface EInvoiceEngineInput {
  invoiceId: string;
  format: SupportedFormat;
}

export interface EInvoiceEngineOutput {
  xml: string;
  validated: boolean;
  validationErrors?: string[];
  reasoning?: string;
}

type ValidationResult = {
  validated: boolean;
  validationErrors: string[];
  reasoning?: string;
  pipeline?: PipelineResult | null;
};

function normalizeFormat(format: string): SupportedFormat {
  const upper = format.toUpperCase();
  if (SUPPORTED_FORMATS.includes(upper as SupportedFormat)) {
    return upper as SupportedFormat;
  }
  throw badRequest("Unsupported e-invoice format");
}

function computeLineTotals(ctx: InvoiceContext) {
  const lineNetTotal = ctx.items.reduce((sum: number, line: any) => sum + line.quantity * Number(line.unitPriceNet), 0);
  const taxTotal = ctx.items.reduce((sum: number, line: any) => {
    const vat = typeof line.vatPct === "number" ? line.vatPct : 0;
    return sum + (line.quantity * Number(line.unitPriceNet) * vat) / 100;
  }, 0);
  return { lineNetTotal, taxTotal, grandTotal: lineNetTotal + taxTotal };
}

function formatDateForXml(value?: Date | string | null) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10).replace(/-/g, "");
  }
  return value;
}

function buildContextOptions(options: EngineRunOptions, scope: { brandId?: string; tenantId?: string }) {
  return {
    brandId: options.brandId ?? scope.brandId,
    tenantId: options.tenantId ?? scope.tenantId,
    role: options.actor?.role ?? undefined,
    permissions: options.actor?.permissions,
    includeEmbeddings: options.includeEmbeddings,
  } satisfies ContextBuilderOptions;
}

function renderLineItemsXml(ctx: InvoiceContext, currency: string) {
  return ctx.items
    .map((item: any, index: number) => {
      const lineNet = item.quantity * Number(item.unitPriceNet);
      const vatPct = typeof item.vatPct === "number" ? item.vatPct : 0;
      const vatAmount = (lineNet * vatPct) / 100;
      return [
        "    <ram:IncludedSupplyChainTradeLineItem>",
        `      <ram:AssociatedDocumentLineDocument><ram:LineID>${index + 1}</ram:LineID><ram:IncludedNote>${
          item.name ?? item.sku ?? item.productId
        }</ram:IncludedNote></ram:AssociatedDocumentLineDocument>`,
        "      <ram:SpecifiedTradeProduct>",
        `        <ram:Name>${item.name ?? "Line Item"}</ram:Name>`,
        item.sku ? `        <ram:SellerAssignedID>${item.sku}</ram:SellerAssignedID>` : "",
        "      </ram:SpecifiedTradeProduct>",
        "      <ram:SpecifiedLineTradeAgreement>",
        `        <ram:GrossPriceProductTradePrice><ram:ChargeAmount currencyID="${currency}">${Number(
          item.unitPriceNet,
        ).toFixed(2)}</ram:ChargeAmount><ram:BasisQuantity unitCode="C62">${item.quantity}</ram:BasisQuantity></ram:GrossPriceProductTradePrice>`,
        "      </ram:SpecifiedLineTradeAgreement>",
        "      <ram:SpecifiedLineTradeDelivery>",
        `        <ram:BilledQuantity unitCode="C62">${item.quantity}</ram:BilledQuantity>`,
        "      </ram:SpecifiedLineTradeDelivery>",
        "      <ram:SpecifiedLineTradeSettlement>",
        `        <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:RateApplicablePercent>${vatPct.toFixed(
          2,
        )}</ram:RateApplicablePercent></ram:ApplicableTradeTax>`,
        `        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount currencyID="${currency}">${lineNet.toFixed(
          2,
        )}</ram:LineTotalAmount><ram:TaxTotalAmount currencyID="${currency}">${vatAmount.toFixed(
          2,
        )}</ram:TaxTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>`,
        "      </ram:SpecifiedLineTradeSettlement>",
        "    </ram:IncludedSupplyChainTradeLineItem>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
}

function buildXml(format: SupportedFormat, ctx: InvoiceContext): { xml: string; reasoning: string } {
  const currency = ctx.invoice.currency ?? "EUR";
  const totals = computeLineTotals(ctx);
  const declaredGrandTotal = ctx.invoice.totalGross ?? totals.grandTotal;
  const declaredNet = ctx.invoice.totalNet ?? totals.lineNetTotal;
  const skeleton = format === "XRECHNUNG" ? XRECHNUNG_SKELETON : ZUGFERD_SKELETON;
  const issueDate = formatDateForXml(ctx.invoice.createdAt ?? ctx.invoice.updatedAt ?? ctx.fetchedAt);
  const deliveryDate = formatDateForXml(ctx.invoice.updatedAt ?? ctx.fetchedAt);

  const xml = skeleton
    .replace("{invoiceNumber}", ctx.invoice.id)
    .replace("{issueDate}", issueDate)
    .replace("{sellerName}", ctx.brand?.name ?? "")
    .replace("{sellerVat}", "")
    .replace("{buyerName}", ctx.invoice.customerType ?? "CUSTOMER")
    .replace("{buyerId}", ctx.invoice.customerId ?? "")
    .replace(/\{currency\}/g, currency)
    .replace("{paymentReference}", ctx.invoice.id)
    .replace("{deliveryDate}", deliveryDate)
    .replace("{taxTotal}", totals.taxTotal.toFixed(2))
    .replace("{vatRate}", ctx.items.find((i: any) => typeof i.vatPct === "number")?.vatPct?.toFixed(2) ?? "0.00")
    .replace("{lineNetTotal}", declaredNet.toFixed(2))
    .replace("{grandTotal}", declaredGrandTotal.toFixed(2))
    .replace("<ram:IncludedSupplyChainTradeLineItem>... line items ...</ram:IncludedSupplyChainTradeLineItem>", renderLineItemsXml(ctx, currency));

  const reasoning = [
    `Generated ${format} XML using invoice context with ${ctx.items.length} lines`,
    `Declared totals preserved (net=${declaredNet.toFixed(2)}, gross=${declaredGrandTotal.toFixed(2)})`,
    format === "ZUGFERD" ? "Hybrid mode respected (XML only, no PDF binary)." : "",
  ]
    .filter(Boolean)
    .join("; ");

  return { xml, reasoning };
}

function runFallbackValidation(xml: string, ctx: InvoiceContext, format: SupportedFormat): ValidationResult {
  const errors: string[] = [];
  if (!xml.includes("<rsm:CrossIndustryInvoice")) errors.push("Missing CrossIndustryInvoice root element");
  if (!xml.includes("<ram:InvoiceCurrencyCode")) errors.push("Missing InvoiceCurrencyCode");
  if (format === "XRECHNUNG" && !xml.includes("ApplicableTradeTax")) errors.push("Missing VAT tax block");

  const totals = computeLineTotals(ctx);
  const declaredGross = ctx.invoice.totalGross ?? totals.grandTotal;
  const declaredNet = ctx.invoice.totalNet ?? totals.lineNetTotal;
  if (declaredGross < totals.grandTotal * 0.8 || declaredGross > totals.grandTotal * 1.2) {
    errors.push("Grand total diverges from line calculations; manual approval required");
  }
  if (declaredNet < totals.lineNetTotal * 0.8 || declaredNet > totals.lineNetTotal * 1.2) {
    errors.push("Net total diverges from line calculations; manual approval required");
  }

  return {
    validated: errors.length === 0,
    validationErrors: errors,
    reasoning: errors.length ? "Fallback validation detected issues" : "Fallback validation passed",
    pipeline: null,
  };
}

function buildFallbackPipeline(validation: ValidationResult): PipelineResult {
  return {
    success: validation.validated,
    agent: null,
    output: {
      validated: validation.validated,
      validationErrors: validation.validationErrors,
      reasoning: validation.reasoning,
    },
    cached: true,
    contexts: {},
    logs: [],
  };
}

function normalizeValidationOutput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { validated: false, validationErrors: ["Validator returned empty payload"], pipeline: null };
  }
  const data = raw as Record<string, unknown>;
  const validated = typeof data.validated === "boolean" ? data.validated : false;
  const validationErrors = Array.isArray(data.validationErrors)
    ? data.validationErrors.filter((err): err is string => typeof err === "string")
    : [];
  const reasoning = typeof data.reasoning === "string" ? data.reasoning : undefined;
  return { validated, validationErrors, reasoning, pipeline: null };
}

async function validateWithAI(
  payload: { xml: string; format: SupportedFormat; invoiceId: string; context: InvoiceContext },
  options?: EngineRunOptions,
): Promise<ValidationResult> {
  try {
    const pipeline = await runAIPipeline({
      agentId: AGENT_ID,
      task: {
        input: {
          invoiceId: payload.invoiceId,
          format: payload.format,
          xml: payload.xml,
          context: payload.context,
          prompt: buildValidationPromptPayload(payload.format, payload.xml),
        },
        message: VALIDATION_TASK,
      },
      actor: options?.actor,
      brandId: options?.brandId ?? payload.context.scope?.brandId,
      tenantId: options?.tenantId ?? payload.context.scope?.tenantId,
      includeEmbeddings: options?.includeEmbeddings,
      dryRun: options?.dryRun,
    });

    const normalized = normalizeValidationOutput(pipeline.output);
    return { ...normalized, pipeline };
  } catch (err) {
    return {
      validated: false,
      validationErrors: [(err as Error).message ?? "AI validation failed"],
      reasoning: "AI validation failed; fallback validation required",
      pipeline: null,
    };
  }
}

async function persistInsight(
  input: EInvoiceEngineInput,
  output: ValidationResult,
  xml: string,
  scope: { brandId?: string | null },
) {
  const details = {
    format: input.format,
    xml,
    validationErrors: output.validationErrors,
    reasoning: output.reasoning,
  };

  const created = await createInsight({
    brandId: scope.brandId ?? null,
    os: "finance",
    entityType: "EInvoice",
    entityId: input.invoiceId,
    summary: `E-Invoice ${input.format} for ${input.invoiceId}`,
    details: JSON.stringify(details),
  });

  return created.id;
}

export async function runEngine(
  input: EInvoiceEngineInput,
  options: EngineRunOptions = {},
): Promise<EngineRunResponse<EInvoiceEngineOutput>> {
  const format = normalizeFormat(input.format);
  const dbGateway = getDbGateway();
  const invoiceCtx = await buildInvoiceContext(dbGateway, input.invoiceId, buildContextOptions(options, {}));
  if (!invoiceCtx) {
    throw badRequest("Invoice not found for e-invoice generation");
  }

  const scope = invoiceCtx.scope ?? {};
  const contextOptions = buildContextOptions(options, scope);

  const [brandCtx, financeCtx] = await Promise.all([
    scope.brandId ? buildBrandContext(dbGateway, scope.brandId, contextOptions).catch(() => null) : Promise.resolve(null),
    scope.brandId ? buildFinanceContext(dbGateway, scope.brandId, contextOptions).catch(() => null) : Promise.resolve(null),
  ]);

  const { xml, reasoning } = buildXml(format, invoiceCtx);

  const aiValidation = await validateWithAI(
    { xml, format, invoiceId: input.invoiceId, context: invoiceCtx },
    options,
  );

  const fallback = aiValidation.validated ? aiValidation : runFallbackValidation(xml, invoiceCtx, format);
  const validation = aiValidation.validated ? aiValidation : fallback;

  const insightId = await persistInsight(
    input,
    validation,
    xml,
    { brandId: scope.brandId ?? null },
  );

  const pipelineResult = validation.pipeline ?? buildFallbackPipeline(validation);

  return {
    output: {
      xml,
      validated: validation.validated,
      validationErrors: validation.validationErrors,
      reasoning: validation.reasoning ?? reasoning,
    },
    pipeline: pipelineResult,
    contexts: {
      invoice: invoiceCtx,
      brand: brandCtx ?? undefined,
      finance: financeCtx ?? undefined,
      generationPrompt: buildInvoiceGenerationPrompt(format, invoiceCtx),
    },
    insightId,
  };
}
