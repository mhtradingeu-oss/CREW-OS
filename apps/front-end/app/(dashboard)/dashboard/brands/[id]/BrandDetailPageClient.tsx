"use client";

import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getBrand, updateBrand } from "@/lib/api/brand";
import { listActivity } from "@/lib/api/activity";
import {
  useBrandIdentity,
  useSaveBrandIdentity,
  useBrandRules,
  useSaveBrandRules,
  useBrandAiConfig,
  useSaveBrandAiConfig,
  useRefreshBrandIdentity,
  useRefreshBrandRules,
} from "@/lib/hooks/use-brand";
import { useAiInsights } from "@/lib/hooks/use-ai-insights";
import { useAuth } from "@/lib/auth/auth-context";
import { apiErrorMessage } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ActivityTimeline, type TimelineItem } from "@/components/ui/activity-timeline";

const brandSchema = z.object({
  name: z.string().min(1, "Required"),
  slug: z.string().min(1, "Required"),
  description: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  defaultCurrency: z.string().optional(),
  settings: z.string().optional(),
});

const identitySchema = z.object({
  vision: z.string().optional(),
  mission: z.string().optional(),
  values: z.string().optional(),
  toneOfVoice: z.string().optional(),
  persona: z.string().optional(),
  brandStory: z.string().optional(),
  keywords: z.string().optional(),
  colorPalette: z.string().optional(),
  packagingStyle: z.string().optional(),
  socialProfiles: z.string().optional(),
});

const rulesSchema = z.object({
  namingRules: z.string().optional(),
  descriptionRules: z.string().optional(),
  marketingRules: z.string().optional(),
  discountRules: z.string().optional(),
  pricingConstraints: z.string().optional(),
  restrictedWords: z.string().optional(),
  allowedWords: z.string().optional(),
  aiRestrictions: z.string().optional(),
});

const aiConfigSchema = z.object({
  aiPersonality: z.string().optional(),
  aiTone: z.string().optional(),
  aiContentStyle: z.string().optional(),
  aiPricingStyle: z.string().optional(),
  aiEnabledActions: z.string().optional(),
  aiBlockedTopics: z.string().optional(),
  aiModelVersion: z.string().optional(),
});

export default function BrandDetailPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const brandQuery = useQuery({
    queryKey: ["brand", id],
    queryFn: () => getBrand(id),
    enabled: Boolean(id),
  });

  const identityQuery = useBrandIdentity(id);
  const rulesQuery = useBrandRules(id);
  const aiConfigQuery = useBrandAiConfig(id);
  const insightsQuery = useAiInsights({ brandId: id, limit: 5, sortOrder: "desc" });
  const activityQuery = useQuery({
    queryKey: ["activity", id],
    enabled: Boolean(id),
    queryFn: () => listActivity({ brandId: id, page: 1, pageSize: 10 }),
  });

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      countryOfOrigin: "",
      defaultCurrency: "",
      settings: "",
    },
  });

  const identityForm = useForm<z.infer<typeof identitySchema>>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      vision: "",
      mission: "",
      values: "",
      toneOfVoice: "",
      persona: "",
      brandStory: "",
      keywords: "",
      colorPalette: "",
      packagingStyle: "",
      socialProfiles: "",
    },
  });

  const rulesForm = useForm<z.infer<typeof rulesSchema>>({
    resolver: zodResolver(rulesSchema),
    defaultValues: {
      namingRules: "",
      descriptionRules: "",
      marketingRules: "",
      discountRules: "",
      pricingConstraints: "",
      restrictedWords: "",
      allowedWords: "",
      aiRestrictions: "",
    },
  });

  const aiConfigForm = useForm<z.infer<typeof aiConfigSchema>>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      aiPersonality: "",
      aiTone: "",
      aiContentStyle: "",
      aiPricingStyle: "",
      aiEnabledActions: "",
      aiBlockedTopics: "",
      aiModelVersion: "",
    },
  });

  useEffect(() => {
    if (brandQuery.data) {
      form.reset({
        name: brandQuery.data.name,
        slug: brandQuery.data.slug,
        description: brandQuery.data.description ?? "",
        countryOfOrigin: brandQuery.data.countryOfOrigin ?? "",
        defaultCurrency: brandQuery.data.defaultCurrency ?? "",
        settings: brandQuery.data.settings ? JSON.stringify(brandQuery.data.settings, null, 2) : "",
      });
    }
  }, [brandQuery.data, form]);

  useEffect(() => {
    if (identityQuery.data) {
      identityForm.reset({
        vision: identityQuery.data.vision ?? "",
        mission: identityQuery.data.mission ?? "",
        values: identityQuery.data.values ?? "",
        toneOfVoice: identityQuery.data.toneOfVoice ?? "",
        persona: identityQuery.data.persona ?? "",
        brandStory: identityQuery.data.brandStory ?? "",
        keywords: identityQuery.data.keywords ?? "",
        colorPalette: identityQuery.data.colorPalette ?? "",
        packagingStyle: identityQuery.data.packagingStyle ?? "",
        socialProfiles: identityQuery.data.socialProfiles
          ? JSON.stringify(identityQuery.data.socialProfiles, null, 2)
          : "",
      });
    }
  }, [identityQuery.data, identityForm]);

  useEffect(() => {
    if (rulesQuery.data) {
      rulesForm.reset({
        namingRules: rulesQuery.data.namingRules ?? "",
        descriptionRules: rulesQuery.data.descriptionRules ?? "",
        marketingRules: rulesQuery.data.marketingRules ?? "",
        discountRules: rulesQuery.data.discountRules ?? "",
        pricingConstraints: rulesQuery.data.pricingConstraints ?? "",
        restrictedWords: rulesQuery.data.restrictedWords ?? "",
        allowedWords: rulesQuery.data.allowedWords ?? "",
        aiRestrictions: rulesQuery.data.aiRestrictions ?? "",
      });
    }
  }, [rulesQuery.data, rulesForm]);

  useEffect(() => {
    if (aiConfigQuery.data) {
      aiConfigForm.reset({
        aiPersonality: aiConfigQuery.data.aiPersonality ?? "",
        aiTone: aiConfigQuery.data.aiTone ?? "",
        aiContentStyle: aiConfigQuery.data.aiContentStyle ?? "",
        aiPricingStyle: aiConfigQuery.data.aiPricingStyle ?? "",
        aiEnabledActions: aiConfigQuery.data.aiEnabledActions?.join(", ") ?? "",
        aiBlockedTopics: aiConfigQuery.data.aiBlockedTopics?.join(", ") ?? "",
        aiModelVersion: aiConfigQuery.data.aiModelVersion ?? "",
      });
    }
  }, [aiConfigQuery.data, aiConfigForm]);

  const updateBrandMutation = useMutation({
    mutationFn: (payload: z.infer<typeof brandSchema>) => {
      let parsedSettings: Record<string, unknown> | undefined;
      if (payload.settings) {
        try {
          parsedSettings = JSON.parse(payload.settings) as Record<string, unknown>;
        } catch (error) {
          form.setError("settings", { type: "validate", message: "Invalid JSON" });
          throw error;
        }
      }
      const { settings, ...rest } = payload;
      return updateBrand(id, { ...rest, settings: parsedSettings });
    },
    onSuccess: () => {
      toast.success("Brand updated");
      void queryClient.invalidateQueries({ queryKey: ["brand", id] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const saveIdentity = useSaveBrandIdentity();
  const saveRules = useSaveBrandRules();
  const saveAiConfig = useSaveBrandAiConfig();
  const refreshIdentity = useRefreshBrandIdentity();
  const refreshRules = useRefreshBrandRules();

  const onSubmitIdentity = (values: z.infer<typeof identitySchema>) => {
    let socialProfiles: Record<string, string> | undefined;
    if (values.socialProfiles) {
      try {
        const parsed = JSON.parse(values.socialProfiles);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Expected an object");
        }
        socialProfiles = parsed as Record<string, string>;
      } catch (error) {
        identityForm.setError("socialProfiles", {
          type: "validate",
          message: "Use valid JSON object { \"twitter\": \"@brand\" }",
        });
        toast.error("Invalid social profiles JSON");
        return;
      }
    }

    saveIdentity.mutate(
      { brandId: id, values: { ...values, socialProfiles } },
      {
        onSuccess: () => toast.success("Identity saved"),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  const onSubmitRules = (values: z.infer<typeof rulesSchema>) => {
    saveRules.mutate(
      { brandId: id, values },
      {
        onSuccess: () => toast.success("Rules saved"),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  const onSubmitAiConfig = (values: z.infer<typeof aiConfigSchema>) => {
    const toList = (value?: string) =>
      value
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    saveAiConfig.mutate(
      {
        brandId: id,
        values: {
          aiPersonality: values.aiPersonality,
          aiTone: values.aiTone,
          aiContentStyle: values.aiContentStyle,
          aiPricingStyle: values.aiPricingStyle,
          aiEnabledActions: toList(values.aiEnabledActions),
          aiBlockedTopics: toList(values.aiBlockedTopics),
          aiModelVersion: values.aiModelVersion,
        },
      },
      {
        onSuccess: () => toast.success("AI config saved"),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  const activityTimeline = useMemo(() => {
    if (!activityQuery.data?.data) return [];
    const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
    const grouped: Record<string, TimelineItem[]> = {};

    activityQuery.data.data.forEach((log) => {
      const at = new Date(log.createdAt);
      const day = formatter.format(at);
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push({
        id: log.id,
        title: log.type ?? "Activity",
        subtitle: log.module ?? log.source ?? "brand",
        meta: log.severity ?? log.source ?? "",
        at,
      });
    });

    return Object.entries(grouped)
      .map(([day, events]) => ({
        day,
        events: events.sort((a, b) => b.at.getTime() - a.at.getTime()),
      }))
      .sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());
  }, [activityQuery.data]);

  if (!hasPermission("brand:read")) return <div>Access denied.</div>;

  if (brandQuery.isLoading || !brandQuery.data)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Loading brand...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Brand workspace</p>
          <h1 className="text-2xl font-semibold text-slate-900">{brandQuery.data.name}</h1>
          <p className="text-sm text-muted-foreground">Edit the brand profile, identity, rules, and AI guidance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{brandQuery.data.slug}</Badge>
          <Button variant="outline" onClick={() => router.push("/dashboard/brands")}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Brand basics</CardTitle>
            <p className="text-sm text-muted-foreground">Name, slug, geography, and financial defaults.</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit((values) => updateBrandMutation.mutate(values))}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input {...form.register("slug")} />
                  <p className="text-xs text-muted-foreground">Lowercase, hyphenated identifier.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea {...form.register("description")} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input {...form.register("countryOfOrigin")} />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input placeholder="USD" {...form.register("defaultCurrency")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Settings JSON</Label>
                <Textarea
                  className="min-h-[140px]"
                  placeholder='{ "metadata": {}, "preferences": {} }'
                  {...form.register("settings")}
                />
                {form.formState.errors.settings && (
                  <p className="text-xs text-destructive">{form.formState.errors.settings.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Metadata, preferences, linkedUserIds, and module flags.</p>
              </div>
              {hasPermission("brand:update") && (
                <Button type="submit" disabled={updateBrandMutation.isPending}>
                  {updateBrandMutation.isPending ? "Saving..." : "Save basics"}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Identity</CardTitle>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Vision, mission, tone, story, and social handles.</p>
              {hasPermission("brand:update") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshIdentity.mutate({ brandId: id, forceRegenerate: true })}
                  disabled={refreshIdentity.isPending}
                >
                  {refreshIdentity.isPending ? "Refreshing..." : "Refresh with AI"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {identityQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading identity...
              </div>
            ) : (
              <form className="space-y-4" onSubmit={identityForm.handleSubmit(onSubmitIdentity)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Vision</Label>
                    <Textarea {...identityForm.register("vision")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mission</Label>
                    <Textarea {...identityForm.register("mission")} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Values</Label>
                    <Textarea {...identityForm.register("values")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tone of voice</Label>
                    <Input {...identityForm.register("toneOfVoice")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Persona</Label>
                    <Input {...identityForm.register("persona")} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Brand story</Label>
                    <Textarea {...identityForm.register("brandStory")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Keywords</Label>
                    <Input placeholder="sustainable, modern, playful" {...identityForm.register("keywords")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Color palette</Label>
                    <Input placeholder="#0F172A, #38BDF8" {...identityForm.register("colorPalette")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Packaging style</Label>
                    <Input {...identityForm.register("packagingStyle")} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Social profiles (JSON)</Label>
                    <Textarea
                      placeholder='{"twitter": "@brand", "linkedin": "brand-page"}'
                      className="min-h-[120px]"
                      {...identityForm.register("socialProfiles")}
                    />
                    {identityForm.formState.errors.socialProfiles && (
                      <p className="text-xs text-destructive">
                        {identityForm.formState.errors.socialProfiles.message}
                      </p>
                    )}
                  </div>
                </div>
                {hasPermission("brand:update") && (
                  <Button type="submit" disabled={saveIdentity.isPending}>
                    {saveIdentity.isPending ? "Saving..." : "Save identity"}
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Rules & guardrails</CardTitle>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Naming, marketing, discount, and AI restrictions.</p>
              {hasPermission("brand:update") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    refreshRules.mutate(
                      { brandId: id, forceRegenerate: true },
                      {
                        onSuccess: () => toast.success("Rules checked with AI"),
                        onError: (err) => toast.error(apiErrorMessage(err)),
                      },
                    )
                  }
                  disabled={refreshRules.isPending}
                >
                  {refreshRules.isPending ? "Checking..." : "AI consistency check"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {rulesQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading rules...
              </div>
            ) : (
              <form className="space-y-3" onSubmit={rulesForm.handleSubmit(onSubmitRules)}>
                <div className="space-y-2">
                  <Label>Naming rules</Label>
                  <Textarea placeholder="Use short, pronounceable names." {...rulesForm.register("namingRules")} />
                </div>
                <div className="space-y-2">
                  <Label>Description rules</Label>
                  <Textarea {...rulesForm.register("descriptionRules")} />
                </div>
                <div className="space-y-2">
                  <Label>Marketing rules</Label>
                  <Textarea {...rulesForm.register("marketingRules")} />
                </div>
                <div className="space-y-2">
                  <Label>Discount rules</Label>
                  <Textarea {...rulesForm.register("discountRules")} />
                </div>
                <div className="space-y-2">
                  <Label>Pricing constraints</Label>
                  <Textarea {...rulesForm.register("pricingConstraints")} />
                </div>
                <div className="space-y-2">
                  <Label>Restricted words</Label>
                  <Textarea {...rulesForm.register("restrictedWords")} />
                </div>
                <div className="space-y-2">
                  <Label>Allowed words</Label>
                  <Textarea {...rulesForm.register("allowedWords")} />
                </div>
                <div className="space-y-2">
                  <Label>AI restrictions</Label>
                  <Textarea {...rulesForm.register("aiRestrictions")} />
                </div>
                {hasPermission("brand:update") && (
                  <Button type="submit" disabled={saveRules.isPending}>
                    {saveRules.isPending ? "Saving..." : "Save rules"}
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>AI config</CardTitle>
            <p className="text-sm text-muted-foreground">Tone, style, allowed actions, and blocked topics.</p>
          </CardHeader>
          <CardContent>
            {aiConfigQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading AI config...
              </div>
            ) : (
              <form className="space-y-3" onSubmit={aiConfigForm.handleSubmit(onSubmitAiConfig)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>AI personality</Label>
                    <Input {...aiConfigForm.register("aiPersonality")} />
                  </div>
                  <div className="space-y-2">
                    <Label>AI tone</Label>
                    <Input {...aiConfigForm.register("aiTone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Content style</Label>
                    <Input {...aiConfigForm.register("aiContentStyle")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pricing style</Label>
                    <Input {...aiConfigForm.register("aiPricingStyle")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Enabled actions (comma separated)</Label>
                  <Input placeholder="generate-copy, summarize" {...aiConfigForm.register("aiEnabledActions")} />
                </div>
                <div className="space-y-2">
                  <Label>Blocked topics (comma separated)</Label>
                  <Input placeholder="politics, health claims" {...aiConfigForm.register("aiBlockedTopics")} />
                </div>
                <div className="space-y-2">
                  <Label>Model version</Label>
                  <Input placeholder="gpt-4o" {...aiConfigForm.register("aiModelVersion")} />
                </div>
                {hasPermission("brand:update") && (
                  <Button type="submit" disabled={saveAiConfig.isPending}>
                    {saveAiConfig.isPending ? "Saving..." : "Save AI config"}
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Recent activity</CardTitle>
            <p className="text-sm text-muted-foreground">Audit events for this brand.</p>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading activity...
              </div>
            ) : !activityTimeline.length ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No activity yet for this brand.
              </div>
            ) : (
              <ActivityTimeline items={activityTimeline} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>AI insights</CardTitle>
            <p className="text-sm text-muted-foreground">Latest AI-generated guidance scoped to this brand.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {insightsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading insights...
              </div>
            ) : insightsQuery.isError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                Failed to load insights: {apiErrorMessage(insightsQuery.error as unknown)}
              </div>
            ) : Array.isArray(insightsQuery.data) && insightsQuery.data.length > 0 ? (
              insightsQuery.data.map((item: any) => (
                <div key={item.id} className="rounded-md border border-border/70 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{item.summary ?? "Insight"}</div>
                    <span className="text-xs text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.scope || item.os || "brand"}
                  </p>
                  <p className="mt-1 text-muted-foreground line-clamp-3">
                    {typeof item.details === "string" ? item.details : JSON.stringify(item.details)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No AI insights yet for this brand.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
