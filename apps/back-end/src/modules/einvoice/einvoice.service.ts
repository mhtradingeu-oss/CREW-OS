/**
 * E-INVOICE SERVICE — MH-OS v2
 * Spec: docs/os/21_finance-os.md, docs/os/22_einvoice-os.md
 */
import { createEInvoice, updateEInvoice, findEInvoice } from "./einvoice.repository.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { emitEInvoiceCreated, emitEInvoiceSent } from "./einvoice.events.js";
import type { EInvoiceDTO, CreateEInvoiceDTO, UpdateEInvoiceDTO } from "./einvoice.types.js";

class EInvoiceService {
  async generatePayload(input: CreateEInvoiceDTO): Promise<any> {
    // Generate a compliance-ready invoice payload (stub, replace with real logic)
    if (!input.invoiceId || !input.format) throw badRequest("Missing invoiceId or format");
    // Example: UBL XML, Factur-X, etc.
    return {
      invoiceId: input.invoiceId,
      format: input.format,
      xmlData: `<Invoice id='${input.invoiceId}' format='${input.format}'/>`,
      validationErrors: [],
    };
  }

  async markSent(invoiceId: string): Promise<EInvoiceDTO> {
    const einvoice = await findEInvoice({ where: { invoiceId } });
    if (!einvoice) throw notFound("E-invoice not found");
    const updated = await updateEInvoice(einvoice.id, { peppolSent: true });
    await emitEInvoiceSent({ einvoiceId: updated.id, invoiceId: updated.invoiceId, format: updated.format }, { source: "api" });
    return this.map(updated);
  }

  async getById(invoiceId: string): Promise<EInvoiceDTO> {
    const einvoice = await findEInvoice({ where: { invoiceId } });
    if (!einvoice) throw notFound("E-invoice not found");
    return this.map(einvoice);
  }

  async list(params: { invoiceId: string; format?: string }): Promise<EInvoiceDTO[]> {
    // EInvoiceWhere requires invoiceId
    if (!params.invoiceId) return [];
    const where: { invoiceId: string; format?: string } = { invoiceId: params.invoiceId };
    if (params.format) where.format = params.format;
    const einvoice = await findEInvoice({ where });
    return einvoice ? [this.map(einvoice)] : [];
  }

  private map(record: any): EInvoiceDTO {
    return {
      id: record.id,
      invoiceId: record.invoiceId,
      format: record.format,
      xmlData: record.xmlData,
      validationErrors: record.validationErrors ?? [],
      sentAt: record.sentAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const einvoiceService = new EInvoiceService();
