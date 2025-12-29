export interface CreateEInvoiceDTO {
  invoiceId: string;
  format: string;
}

export interface UpdateEInvoiceDTO {
  xmlData?: string;
  validationErrors?: string[];
  sentAt?: Date;
}

export interface EInvoiceDTO {
  id: string;
  invoiceId: string;
  format: string;
  xmlData: string;
  validationErrors: string[];
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
