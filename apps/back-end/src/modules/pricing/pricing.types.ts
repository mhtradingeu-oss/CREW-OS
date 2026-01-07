import type {
  PricingRecordDto,
  PricingDraftCreateDto,
  PricingSuggestionInputDto,
  PricingSuggestionOutputDto,
  CreatePricingInputDto,
  UpdatePricingInputDto,
} from "@mh-os/shared";

export type PricingID = string;
export type ProductID = string;

export type CreatePricingDTO = CreatePricingInputDto;
export type UpdatePricingDTO = UpdatePricingInputDto;
export type PricingRecord = PricingRecordDto;
export type PricingDraft = {
  id: string;
  productId: string;
  brandId?: string;
  channel?: string;
  oldNet: number | null;
  newNet: number | null;
  status?: string;
  statusReason?: string;
  createdById?: string;
  approvedById?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type AIPricingSuggestion = {
  id: string;
  productId: string;
  suggestionJson: PricingSuggestionOutputDto;
  createdAt: Date | string;
};

export type AIPricingRequestDTO = PricingSuggestionInputDto & {
  productId: string;
  market: string;
  competitors: { name: string; price: number }[];
  strategy?: string;
};

export type PricingSuggestionInput = PricingSuggestionInputDto;

export function isPricingRecord(obj: unknown): obj is PricingRecord {
  return typeof (obj as PricingRecord)?.id === "string" && typeof (obj as PricingRecord)?.productId === "string";
}

export function isAIPricingRequest(obj: unknown): obj is AIPricingRequestDTO {
  const candidate = obj as Partial<AIPricingRequestDTO>;
  return Boolean(candidate?.productId) && Array.isArray(candidate?.competitors);
}
