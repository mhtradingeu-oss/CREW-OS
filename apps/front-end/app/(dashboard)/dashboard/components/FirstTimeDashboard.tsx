"use client";

import type {
  BrandIdentityAIResponse,
  MarketingPlanDTO,
  ProductDTO,
  ProductPricingDTO,
} from "@/types/onboarding.types";

interface FirstTimeDashboardProps {
  brandIdentity?: BrandIdentityAIResponse;
  products?: ProductDTO[];
  pricing?: ProductPricingDTO[];
  marketingPlan?: MarketingPlanDTO;
}

const getProductName = (products: ProductDTO[] = [], pricing: ProductPricingDTO) => {
  const match =
    products.find((product) => product.id && pricing.productId === product.id) ??
    products.find((product) => product.name === pricing.productIdOrTempId);
  return match?.name ?? pricing.productIdOrTempId;
};

export function FirstTimeDashboard({
  brandIdentity,
  products = [],
  pricing = [],
  marketingPlan,
}: FirstTimeDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Brand identity</p>
          <h3 className="text-lg font-semibold text-slate-900">{brandIdentity?.tone ?? "Tone TBD"}</h3>
          <p className="text-sm text-slate-500">{brandIdentity?.brandStory ?? "A brand story is being crafted by AI."}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Persona</p>
          <p className="text-sm font-semibold text-slate-700">{brandIdentity?.persona ?? "Persona pending"}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Keywords</p>
          <div className="flex flex-wrap gap-1">
            {brandIdentity?.keywords?.map((keyword) => (
              <span key={keyword} className="rounded-full bg-slate-900/10 px-2 py-1 text-xxs uppercase tracking-[0.2em] text-slate-600">
                {keyword}
              </span>
            )) ?? <span className="text-xxs text-slate-400">No keywords yet</span>}
          </div>
        </article>

        <article className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Products</p>
          {products.length ? (
            <ul className="space-y-2">
              {products.map((product) => (
                <li key={product.id ?? product.name} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                  <p className="text-sm text-slate-600">{product.description ?? "AI description pending."}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No products yet.</p>
          )}
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pricing overview</p>
          <div className="mt-3 space-y-3">
            {pricing.length ? (
              pricing.map((item) => (
                <div key={item.productIdOrTempId} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xxs uppercase tracking-[0.3em] text-slate-400">
                    {item.strategy}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {getProductName(products, item)}
                  </p>
                  <p className="text-sm text-slate-700">B2C net: {item.b2cNet.toFixed(2)}</p>
                  <p className="text-sm text-slate-700">B2C gross: {item.b2cGross.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Pricing data will show up once AI runs.</p>
            )}
          </div>
        </article>

        <article className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Marketing starter plan</p>
          <div className="text-xs text-slate-500">
            Channels: {(marketingPlan?.posts.map((post) => post.channel) ?? []).join(", ") || "Not yet"}
          </div>
          {marketingPlan?.posts.length ? (
            <div className="mt-3 space-y-2">
              {marketingPlan.posts.slice(0, 3).map((post) => (
                <div key={`${post.channel}-${post.title}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xxs uppercase tracking-[0.3em] text-slate-400">{post.channel}</p>
                  <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                  <p className="text-sm text-slate-600">{post.caption}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Marketing plan not generated yet.</p>
          )}
          {marketingPlan?.ideas.length ? (
            <ul className="mt-3 space-y-1">
              {marketingPlan.ideas.slice(0, 3).map((idea) => (
                <li key={idea} className="text-sm text-slate-600">
                  • {idea}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>
    </div>
  );
}
