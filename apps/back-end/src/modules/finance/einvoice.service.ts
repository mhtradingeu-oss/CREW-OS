import { randomUUID } from "crypto";
import type {
  EInvoiceFormat,
  GenerateEInvoiceDto,
  SendEInvoiceDto,
  ValidateEInvoiceDto,
} from "@mh-os/shared";
import { badRequest, forbidden, notFound } from "../../core/http/errors.js";
import {
  findInvoiceWithItems,
  createEInvoice,
  updateEInvoice,
  updateManyEInvoice,
  findEInvoice
} from "../../core/db/repositories/finance.repository.js";
import type { PipelineActor } from "../../core/ai/pipeline/pipeline-types.js";
import { runEngine, type EInvoiceEngineOutput } from "../../core/ai/engines/einvoice.engine.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { buildValidationPromptPayload } from "../../core/ai/engines/einvoice.prompts.js";
import { buildInvoiceContext } from "../../ai/context/context-builders.js";
import { getDbGateway } from "../../bootstrap/db.js";

const SUPPORTED_FORMATS: EInvoiceFormat[] = ["XRECHNUNG", "ZUGFERD"];
const PEPPOL_HIGH_RISK_THRESHOLD = 10000;

export type SupportedEInvoiceFormat = EInvoiceFormat;

const peppolClient = {
  async sendDraft(payload: { invoiceId: string; format: SupportedEInvoiceFormat; xmlData: string }) {
    return { id: `peppol-${randomUUID()}`, status: "QUEUED", payload };
  },
};

function normalizeFormat(format: string): SupportedEInvoiceFormat {
  const upper = format.toUpperCase();
  if (SUPPORTED_FORMATS.includes(upper as SupportedEInvoiceFormat)) return upper as SupportedEInvoiceFormat;
  throw badRequest("Unsupported e-invoice format");
}

function normalizeActor(actor?: PipelineActor) {
  if (!actor) return undefined;
  return {
    actor,
    brandId: actor.brandId ?? undefined,
    tenantId: actor.tenantId ?? undefined,
  };
}


class EInvoiceService {

  private async loadInvoice(invoiceId: string) {
    const invoice = await findInvoiceWithItems(invoiceId);
    if (!invoice) {
      throw notFound("Invoice not found");
    }
    return invoice;
  }

  private mapInvoiceToSchema(invoice: Awaited<ReturnType<EInvoiceService["loadInvoice"]>>) {
    return {
      id: invoice.id,
      currency: invoice.currency ?? invoice.brand?.defaultCurrency ?? "EUR",
      status: invoice.status,
      customerType: invoice.customerType,
      customerId: invoice.customerId,
      totals: {
        net: invoice.totalNet ? Number(invoice.totalNet) : null,
        gross: invoice.totalGross ? Number(invoice.totalGross) : null,
      },
      lines: invoice.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceNet: Number(item.unitPriceNet),
        vatPct: item.vatPct ? Number(item.vatPct) : null,
      })),
    };
  }

  private evaluatePeppolPolicy(amount: number, approved?: boolean) {
    const requiresApproval = amount >= PEPPOL_HIGH_RISK_THRESHOLD;
    if (requiresApproval && !approved) {
      return { allowed: false, requiresApproval, reason: "High-risk amount requires approval" } as const;
    }
    return { allowed: true, requiresApproval, reason: requiresApproval ? "Approved high-risk send" : undefined } as const;
  }

  async generate(input: GenerateEInvoiceDto, actor?: PipelineActor) {
    const format = normalizeFormat(input.format);
    const invoice = await this.loadInvoice(input.invoiceId);
    const engineResult = await runEngine(
      { invoiceId: input.invoiceId, format },
      normalizeActor(actor) ?? { brandId: invoice.brandId ?? undefined, tenantId: invoice.brand?.tenantId ?? undefined },
    );

    const persisted = await createEInvoice({
      invoiceId: invoice.id,
      format,
      xmlData: engineResult.output.xml,
      validationErrors: engineResult.output.validationErrors?.length
        ? engineResult.output.validationErrors
        : undefined,
      validated: engineResult.output.validated,
      peppolSent: false,
      peppolMessageId: null,
    });

    const policy = this.evaluatePeppolPolicy(Number(invoice.totalGross ?? invoice.totalNet ?? 0), false);

    return {
      record: persisted,
      validation: engineResult.output,
      peppol: { allowed: engineResult.output.validated && policy.allowed, requiresApproval: policy.requiresApproval },
      schema: this.mapInvoiceToSchema(invoice),
    };
  }

  async validate(input: ValidateEInvoiceDto, actor?: PipelineActor) {
    const format = normalizeFormat(input.format);
    const invoice = await this.loadInvoice(input.invoiceId);
    const dbGateway = getDbGateway();
    const invoiceContext = await buildInvoiceContext(dbGateway, input.invoiceId, {
      brandId: invoice.brandId ?? undefined,
      tenantId: invoice.brand?.tenantId ?? undefined,
      role: actor?.role ?? undefined,
      permissions: actor?.permissions,
    });
    if (!invoiceContext) {
      throw badRequest("Invoice context unavailable");
    }

    const pipeline = await runAIPipeline({
      agentId: "EINVOICE_ENGINE",
      task: {
        input: {
          invoiceId: input.invoiceId,
          format,
          xml: input.xml,
          context: invoiceContext,
          prompt: buildValidationPromptPayload(format, input.xml),
        },
        message: "VALIDATE_XML",
      },
      actor,
      brandId: invoice.brandId ?? undefined,
      tenantId: invoice.brand?.tenantId ?? undefined,
    });

    const validation = this.normalizeValidationResult(pipeline.output);

    if (validation.validated) {
      await updateManyEInvoice({ invoiceId: input.invoiceId, format }, {
        validated: true,
        validationErrors: validation.validationErrors?.length
          ? validation.validationErrors
          : undefined,
      });
    }

    return { validation, pipeline, schema: this.mapInvoiceToSchema(invoice) };
  }

  async send(input: SendEInvoiceDto, actor?: PipelineActor) {
    const format = normalizeFormat(input.format);
    const invoice = await this.loadInvoice(input.invoiceId);
    const existing = await findEInvoice({
      where: { invoiceId: input.invoiceId, format },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      throw badRequest("Generate an e-invoice before sending");
    }
    if (!existing.validated) {
      throw forbidden("Cannot send unvalidated e-invoice");
    }

    const amount = Number(invoice.totalGross ?? invoice.totalNet ?? 0);
    const policy = this.evaluatePeppolPolicy(amount, input.approved);
    if (!policy.allowed) {
      return { status: "PENDING_APPROVAL", requiresApproval: true, reason: policy.reason } as const;
    }

    const response = await peppolClient.sendDraft({
      invoiceId: existing.invoiceId,
      format,
      xmlData: existing.xmlData,
    });

    const updated = await updateEInvoice(existing.id, {
      peppolSent: true,
      peppolMessageId: response.id,
      validationErrors: this.parseValidationErrors(existing.validationErrors),
    });

    return { status: "SENT", peppolMessageId: response.id, record: updated, requiresApproval: policy.requiresApproval } as const;
  }

  async getByInvoice(invoiceId: string, format?: SupportedEInvoiceFormat) {
    const record = await findEInvoice({
      where: { invoiceId, ...(format ? { format } : {}) },
      orderBy: { createdAt: "desc" },
    });
    if (!record) {
      throw notFound("E-invoice not found for invoice");
    }
    return record;
  }

  private normalizeValidationResult(raw: unknown): EInvoiceEngineOutput {
    if (!raw || typeof raw !== "object") {
      return { xml: "", validated: false, validationErrors: ["Empty validator output"] };
    }
    const data = raw as Record<string, unknown>;
    const filteredErrors = Array.isArray(data.validationErrors)
      ? data.validationErrors.filter((entry): entry is string => typeof entry === "string")
      : [];
    return {
      xml: typeof data.xml === "string" ? data.xml : "",
      validated: typeof data.validated === "boolean" ? data.validated : false,
      validationErrors: filteredErrors.length ? filteredErrors : undefined,
      reasoning: typeof data.reasoning === "string" ? data.reasoning : undefined,
    };
  }

  private parseValidationErrors(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const filtered = value.filter((entry): entry is string => typeof entry === "string");
    return filtered.length ? filtered : undefined;
  }
}

export const einvoiceService = new EInvoiceService();
