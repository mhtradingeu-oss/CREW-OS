export type EInvoiceFormat = "XRECHNUNG" | "ZUGFERD";

export interface GenerateEInvoiceDto {
  invoiceId: string;
  format: EInvoiceFormat;
}

export interface ValidateEInvoiceDto {
  invoiceId: string;
  xml: string;
  format: EInvoiceFormat;
}

export interface SendEInvoiceDto {
  invoiceId: string;
  format: EInvoiceFormat;
  approved?: boolean;
}
