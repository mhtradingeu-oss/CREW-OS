"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useMarketingPlan, useAICaptions, useSEOGenerator } from "@/lib/hooks/use-marketing-ai";

export default function MarketingAiPage() {
  const [planForm, setPlanForm] = useState({ goal: "", tone: "", audience: "" });
  const [seoForm, setSeoForm] = useState({ topic: "", locale: "" });
  const [captionForm, setCaptionForm] = useState({ topic: "", platform: "", tone: "" });
  const [planParams, setPlanParams] = useState<{ goal: string; tone?: string; audience?: string } | null>(
    null,
  );
  const [seoParams, setSeoParams] = useState<{ topic: string; locale?: string } | null>(null);
  const [captionParams, setCaptionParams] = useState<
    { topic: string; platform?: string; tone?: string } | null
  >(null);

  const planQuery = useMarketingPlan(planParams ?? undefined);
  const seoQuery = useSEOGenerator(seoParams ?? undefined);
  const captionsQuery = useAICaptions(captionParams ?? undefined);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Marketing AI</p>
        <h1 className="text-3xl font-semibold">Composer</h1>
        <p className="text-sm text-muted-foreground">
          Generate a full campaign narrative, SEO-ready titles, or social captions with one tap.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Marketing plan</CardTitle>
            <Button
              variant="outline"
              onClick={() => {
                if (!planForm.goal.trim()) return;
                setPlanParams({
                  goal: planForm.goal.trim(),
                  tone: planForm.tone.trim() || undefined,
                  audience: planForm.audience.trim() || undefined,
                });
              }}
              disabled={planQuery.isLoading}
            >
              {planQuery.isLoading ? "Generating..." : "Generate plan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Goal</Label>
              <Input
                value={planForm.goal}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, goal: e.target.value }))}
                placeholder="Launch AI-first skincare line"
              />
            </div>
            <div>
              <Label>Tone</Label>
              <Input
                value={planForm.tone}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, tone: e.target.value }))}
                placeholder="Confident & helpful"
              />
            </div>
            <div>
              <Label>Audience</Label>
              <Input
                value={planForm.audience}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, audience: e.target.value }))}
                placeholder="Gen Z skincare enthusiasts"
              />
            </div>
          </div>
          {planQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Generating marketing plan...
            </div>
          ) : planQuery.data ? (
            <div className="space-y-2 rounded-md border border-border p-4">
              <div className="text-lg font-semibold text-slate-900">{planQuery.data.headline}</div>
              <p className="text-sm text-slate-700">{planQuery.data.body}</p>
              {planQuery.data.cta && (
                <Badge variant="outline">{planQuery.data.cta}</Badge>
              )}
              {planQuery.data.keywords?.length ? (
                <div className="text-xs text-muted-foreground">
                  Keywords: {planQuery.data.keywords.join(", ")}
                </div>
              ) : null}
              {planQuery.data.tone && (
                <p className="text-xs text-muted-foreground">Tone: {planQuery.data.tone}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Provide a goal to create a marketing narrative with AI.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="space-y-2">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>SEO description</CardTitle>
            <Button
              variant="outline"
              onClick={() => {
                if (!seoForm.topic.trim()) return;
                setSeoParams({
                  topic: seoForm.topic.trim(),
                  locale: seoForm.locale.trim() || undefined,
                });
              }}
              disabled={seoQuery.isLoading}
            >
              {seoQuery.isLoading ? "Generating..." : "Generate SEO"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Topic</Label>
              <Input
                value={seoForm.topic}
                onChange={(e) => setSeoForm((prev) => ({ ...prev, topic: e.target.value }))}
                placeholder="AI-powered beauty"
              />
            </div>
            <div>
              <Label>Locale</Label>
              <Input
                value={seoForm.locale}
                onChange={(e) => setSeoForm((prev) => ({ ...prev, locale: e.target.value }))}
                placeholder="en"
              />
            </div>
          </div>
          {seoQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Crafting SEO ideas...
            </div>
          ) : seoQuery.data ? (
            <div className="space-y-2 rounded-md border border-border p-4 text-sm text-muted-foreground">
              <div className="text-base font-semibold text-slate-900">{seoQuery.data.title}</div>
              <p className="text-slate-700">{seoQuery.data.description}</p>
              <div>Keywords: {seoQuery.data.keywords.join(", ")}</div>
            </div>
          ) : (
            <p className="text-muted-foreground">Enter a topic to generate SEO copy.</p>
          )}
        </CardContent>
      </Card>

      <Card className="space-y-2">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Social captions</CardTitle>
            <Button
              variant="outline"
              onClick={() => {
                if (!captionForm.topic.trim()) return;
                setCaptionParams({
                  topic: captionForm.topic.trim(),
                  platform: captionForm.platform.trim() || undefined,
                  tone: captionForm.tone.trim() || undefined,
                });
              }}
              disabled={captionsQuery.isLoading}
            >
              {captionsQuery.isLoading ? "Generating..." : "Generate captions"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Topic</Label>
              <Input
                value={captionForm.topic}
                onChange={(e) => setCaptionForm((prev) => ({ ...prev, topic: e.target.value }))}
                placeholder="New launch teaser"
              />
            </div>
            <div>
              <Label>Platform</Label>
              <Input
                value={captionForm.platform}
                onChange={(e) => setCaptionForm((prev) => ({ ...prev, platform: e.target.value }))}
                placeholder="Instagram"
              />
            </div>
            <div>
              <Label>Tone</Label>
              <Input
                value={captionForm.tone}
                onChange={(e) => setCaptionForm((prev) => ({ ...prev, tone: e.target.value }))}
                placeholder="Playful"
              />
            </div>
          </div>
          {captionsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Generating captions...
            </div>
          ) : captionsQuery.data ? (
            <div className="space-y-2 rounded-md border border-border p-4">
              {captionsQuery.data.captions.map((caption) => (
                <p key={caption} className="text-sm text-slate-700">
                  {caption}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Describe a topic for quick social captions.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
