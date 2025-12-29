export interface MarketingGenerateInput {
  goal: string;
  tone?: string;
  audience?: string;
  brandId?: string;
}

export interface MarketingSeoInput {
  topic: string;
  locale?: string;
  brandId?: string;
}

export interface MarketingCaptionsInput {
  topic: string;
  platform?: string;
  tone?: string;
  brandId?: string;
}

export interface MarketingGenerateResult {
  headline: string;
  body: string;
  cta?: string;
  keywords?: string[];
  tone?: string;
}

export interface MarketingSeoResult {
  title: string;
  keywords: string[];
  description: string;
}

export interface MarketingCaptionsResult {
  captions: string[];
}
