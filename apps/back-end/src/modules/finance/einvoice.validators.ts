import { z } from "zod";

const formatEnum = z.enum(["XRECHNUNG", "ZUGFERD"]);

export const generateEInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  format: formatEnum,
});

export const validateEInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  format: formatEnum,
  xml: z.string().min(1),
});

export const sendEInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  format: formatEnum,
  approved: z.boolean().optional(),
});
