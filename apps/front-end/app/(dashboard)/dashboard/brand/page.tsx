"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/lib/api/client";
import type { BrandAiIdentityResponse } from "@/lib/api/brand";
import { useBrandIdentity, useBrandList, useRefreshBrandIdentity } from "@/lib/hooks/use-brand";

export default function BrandIdentityPage() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();
  const [latestInsight, setLatestInsight] = useState<BrandAiIdentityResponse | null>(null);

  const {
    data: brandList,
    isLoading: isBrandsLoading,
    isError: hasBrandError,
    error: brandListError,
  } = useBrandList({ page: 1, pageSize: 32 });

  const {
    data: identity,
    isFetching: isIdentityLoading,
    isError: hasIdentityError,
    error: identityError,
  } = useBrandIdentity(selectedBrandId);
  const refreshMutation = useRefreshBrandIdentity();

  useEffect(() => {
    if (!selectedBrandId && brandList?.data?.length) {
      const firstBrand = brandList.data[0];
      if (firstBrand?.id) {
        setSelectedBrandId(firstBrand.id);
      }
    }
  }, [brandList, selectedBrandId]);

  useEffect(() => {
    setLatestInsight(null);
  }, [selectedBrandId]);

  const brands = brandList?.data ?? [];
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId);

  const keywords = identity?.keywords
    ? identity.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    : [];

  const socialProfiles = identity?.socialProfiles
    ? Object.entries(identity.socialProfiles)
    : [];

  const handleRefresh = async () => {
    if (!selectedBrandId) return;
    try {
      const insight = await refreshMutation.mutateAsync({
        brandId: selectedBrandId,
        forceRegenerate: true,
      });
      setLatestInsight(insight);
      toast.success("AI identity refreshed");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">MH-OS</p>
          <h1 className="text-3xl font-semibold text-slate-900">Brand identity lab</h1>
          <p className="text-sm text-slate-500">
            Review mission, vision, tone, and keywords, then refresh the AI voice in one tap.
          </p>
        </div>
        <div className="min-w-[240px]">
          <Label htmlFor="brand-select">Brand</Label>
          <Select
            id="brand-select"
            value={selectedBrandId ?? ""}
            onChange={(event) => setSelectedBrandId(event.target.value || undefined)}
            disabled={isBrandsLoading}
          >
            <option value="">Choose a brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
          {isBrandsLoading && (
            <p className="text-xs text-muted-foreground">Loading brands...</p>
          )}
          {hasBrandError && (
            <p className="text-xs text-destructive">
              {apiErrorMessage(brandListError)} while fetching brands.
            </p>
          )}
        </div>
      </div>

      {!selectedBrandId ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Select a brand to inspect its identity profile.
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Brand identity</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Vision, mission, tone, and keywords live here.
                  </p>
                </div>
                {selectedBrand && (
                  <Badge variant="outline">{selectedBrand.slug}</Badge>
                )}
              </div>
              {selectedBrand && selectedBrand.description && (
                <p className="text-sm text-slate-500">{selectedBrand.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {hasIdentityError ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                  Failed to load identity: {apiErrorMessage(identityError)}
                </div>
              ) : isIdentityLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="space-y-2 rounded-md border bg-muted/30 p-3 animate-pulse">
                      <div className="h-2 w-24 rounded bg-muted-foreground/30" />
                      <div className="h-4 w-full rounded bg-muted-foreground/30" />
                    </div>
                  ))}
                </div>
              ) : !identity ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No identity saved yet. Update the brand identity to see tone and mission.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Vision
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {identity.vision ?? "Vision pending"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Mission
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {identity.mission ?? "Mission pending"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Tone of voice
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {identity.toneOfVoice ?? "Tone not defined"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Keywords
                    </p>
                    {keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No keywords yet</p>
                    )}
                  </div>
                  {identity.persona && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Persona
                      </p>
                      <p className="text-sm text-slate-700">{identity.persona}</p>
                    </div>
                  )}
                  {identity.brandStory && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Brand story
                      </p>
                      <p className="text-sm text-slate-700">{identity.brandStory}</p>
                    </div>
                  )}
                  {socialProfiles.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Social profiles
                      </p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {socialProfiles.map(([platform, handle]) => (
                          <li key={platform}>
                            <span className="font-semibold">{platform}</span>: {handle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>AI identity refresh</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Regenerate a summary and detailed tone guidance with MH-OS AI.
                  </p>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshMutation.isLoading}
                  className="whitespace-nowrap"
                >
                  {refreshMutation.isLoading ? "Regenerating..." : "Refresh identity"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {refreshMutation.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Asking the brand strategist to rewrite the voice...
                </div>
              ) : latestInsight ? (
                <>
                  <p className="text-base font-semibold text-slate-900">{latestInsight.summary}</p>
                  <pre className="rounded-md border border-slate-200 bg-slate-900/5 p-4 text-sm text-slate-800">
                    {latestInsight.details}
                  </pre>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Press refresh to capture a fresh AI summary plus tone guidance.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
