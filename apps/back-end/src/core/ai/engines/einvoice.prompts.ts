export const EN16931_MANDATORY_FIELDS = [
  "Document level currency and invoice number",
  "Seller and buyer trade party with VAT IDs where available",
  "Payment due date and payment means",
  "Tax total per rate and grand totals",
  "At least one invoice line with quantity, unit price, and VAT classification",
];

export const VAT_RULES = [
  "Apply VAT rate per line item; do not infer new rates if missing",
  "Compute tax total as sum of (line net * vatPct) for provided lines",
  "Respect reverse-charge or exempt flags when provided; otherwise assume standard taxation",
];

export const LINE_ITEM_RULES = [
  "Each line requires id, name, quantity, unit price net, VAT percentage, and line total",
  "Line totals are quantity * unitPriceNet; do not override invoice totals even if mismatched",
  "Reference product identifiers (SKU) when provided",
];

export const VALIDATION_RULES = [
  "Reject XML if required EN 16931 elements are missing",
  "Flag VAT mismatches but do not correct invoice totals automatically",
  "Ensure currency codes use ISO 4217",
  "Ensure dates are ISO 8601",
  "Detect structural XML errors (unclosed tags, invalid namespaces)",
];

export const ERROR_DETECTION_INSTRUCTIONS = [
  "List validationErrors as short machine-readable messages",
  "Provide correctionProposals without changing monetary amounts",
  "Mark validated=false when any blocking issue exists",
];

export const XRECHNUNG_SKELETON = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:ferd:CrossIndustryDocument:invoice:1p0" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:12" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:15">
  <rsm:ExchangedDocument>
    <ram:ID>{invoiceNumber}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">{issueDate}</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>{sellerName}</ram:Name><ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">{sellerVat}</ram:ID></ram:SpecifiedTaxRegistration></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>{buyerName}</ram:Name><ram:ID>{buyerId}</ram:ID></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">{deliveryDate}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>{currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>30</ram:TypeCode><ram:Information>{paymentReference}</ram:Information></ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax><ram:CalculatedAmount currencyID="{currency}">{taxTotal}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>{vatRate}</ram:RateApplicablePercent></ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount currencyID="{currency}">{lineNetTotal}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount currencyID="{currency}">{lineNetTotal}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="{currency}">{taxTotal}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount currencyID="{currency}">{grandTotal}</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
    <ram:IncludedSupplyChainTradeLineItem>... line items ...</ram:IncludedSupplyChainTradeLineItem>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

export const ZUGFERD_SKELETON = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:ferd:CrossIndustryDocument:invoice:1p0" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:12" xmlns:xs="http://www.w3.org/2001/XMLSchema" profile="EN16931" type="HYBRID">
  <rsm:HeaderExchangedDocument>
    <ram:ID>{invoiceNumber}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><ram:DateTimeString format="102">{issueDate}</ram:DateTimeString></ram:IssueDateTime>
  </rsm:HeaderExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>{sellerName}</ram:Name><ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">{sellerVat}</ram:ID></ram:SpecifiedTaxRegistration></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>{buyerName}</ram:Name><ram:ID>{buyerId}</ram:ID></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>{currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>30</ram:TypeCode><ram:Information>{paymentReference}</ram:Information></ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CalculatedAmount currencyID="{currency}">{taxTotal}</ram:CalculatedAmount><ram:RateApplicablePercent>{vatRate}</ram:RateApplicablePercent></ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount currencyID="{currency}">{lineNetTotal}</ram:LineTotalAmount>
        <ram:TaxTotalAmount currencyID="{currency}">{taxTotal}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount currencyID="{currency}">{grandTotal}</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
    <ram:IncludedSupplyChainTradeLineItem>... line items ...</ram:IncludedSupplyChainTradeLineItem>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

export function buildInvoiceGenerationPrompt(format: "XRECHNUNG" | "ZUGFERD", context: Record<string, unknown>) {
  return `Generate ${format} XML that aligns with EN 16931. Use seller/buyer data, VAT rates, and invoice lines exactly as provided. Do not change totals. Fill placeholders from context. Context: ${JSON.stringify(
    context,
  )}`;
}

export function buildValidationPromptPayload(format: "XRECHNUNG" | "ZUGFERD", xml: string) {
  return [
    `Validate the provided ${format} XML against EN 16931 and PEPPOL BIS Billing 3.0 where applicable.`,
    `Mandatory fields: ${EN16931_MANDATORY_FIELDS.join("; ")}.`,
    `VAT rules: ${VAT_RULES.join("; ")}.`,
    `Line item rules: ${LINE_ITEM_RULES.join("; ")}.`,
    `Validation rules: ${VALIDATION_RULES.join("; ")}.`,
    `Error handling: ${ERROR_DETECTION_INSTRUCTIONS.join("; ")}.`,
    "Return JSON {validated:boolean, validationErrors:string[], reasoning:string}",
    "Never correct monetary totals; only report mismatches.",
    `XML payload: ${xml.substring(0, 4000)}`,
  ].join("\n");
}
