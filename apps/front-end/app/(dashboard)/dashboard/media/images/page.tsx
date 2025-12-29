"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { listImageEngines, generateImage, type MediaEngine } from "@/lib/api/media";
import { apiErrorMessage } from "@/lib/api/client";
import { PermissionGuard } from "@/components/layout/permission-guard";

const STYLE_PRESETS = [
  "barbershop",
  "salon",
  "ecommerce",
  "packshot",
  "lifestyle",
  "social square",
  "story vertical",
];

export default function MediaImagesPage() {
  const [engines, setEngines] = useState<MediaEngine[]>([]);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState("packshot");
  const [size, setSize] = useState("1024x1024");
  const [engineId, setEngineId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState<Array<{ url: string; provider: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listImageEngines();
        setEngines(data ?? []);
        const first = data?.find((e) => e.available !== false);
        setEngineId(first?.id);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      }
    };
    void load();
  }, []);

  const sizeParts = useMemo(() => size.split("x").map((v) => Number(v)), [size]);

  const onGenerate = async () => {
    try {
      setLoading(true);
      const [width, height] = sizeParts;
      const result = await generateImage({
        prompt,
        negativePrompt: negativePrompt || undefined,
        engineId: engineId || undefined,
        width: Number.isFinite(width) ? width : undefined,
        height: Number.isFinite(height) ? height : undefined,
        stylePreset: style,
      });
      setGallery((prev) => [{ url: result.url, provider: result.provider }, ...prev].slice(0, 12));
      toast.success(`Generated with ${result.provider}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard required={"ai:media:run"}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Image Studio</h1>
            <p className="text-sm text-muted-foreground">Generate on-brand images with safe engine fallbacks.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {engines.map((e) => (
              <Badge key={e.id} variant={e.isFree ? "secondary" : "default"}>
                {e.label}
              </Badge>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="text-sm font-medium">Engine</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={engineId ?? ""}
              onChange={(e) => setEngineId(e.target.value || undefined)}
            >
              {engines.map((e) => (
                <option key={e.id} value={e.id} disabled={e.available === false}>
                  {e.label} {e.isFree ? "(free)" : "(paid)"} {e.available === false ? "- configure key" : ""}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium">Prompt</label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the image" />

            <label className="text-sm font-medium">Negative prompt</label>
            <Input value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Unwanted details" />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Size</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                >
                  {[
                    "1024x1024",
                    "1024x1536",
                    "1536x1024",
                    "768x1024",
                    "1024x768",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Style preset</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  {STYLE_PRESETS.map((preset) => (
                    <option key={preset}>{preset}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={onGenerate} disabled={loading || !prompt.trim()} className="w-full">
                  {loading ? <Spinner className="h-4 w-4" /> : "Generate"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {gallery.length === 0 ? <p className="text-sm text-muted-foreground">No assets yet.</p> : null}
            {gallery.map((item, idx) => (
              <div key={`${item.url}-${idx}`} className="space-y-2 rounded-md border p-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.provider}</span>
                  <Badge variant="outline">#{idx + 1}</Badge>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="Generated" className="h-48 w-full rounded-md object-cover" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(item.url).then(() => toast.success("URL copied"))}
                >
                  Copy URL
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
