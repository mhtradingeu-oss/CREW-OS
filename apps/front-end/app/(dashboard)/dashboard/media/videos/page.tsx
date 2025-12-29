"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { listVideoEngines, generateVideo, type MediaEngine } from "@/lib/api/media";
import { apiErrorMessage } from "@/lib/api/client";
import { PermissionGuard } from "@/components/layout/permission-guard";

const STYLE_PRESETS = ["cinematic", "product", "lifestyle", "studio", "social", "teaser"];
const DURATIONS = [5, 10, 15];
const RATIOS = ["9:16", "1:1", "16:9"];

export default function MediaVideosPage() {
  const [engines, setEngines] = useState<MediaEngine[]>([]);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("product");
  const [duration, setDuration] = useState(5);
  const [ratio, setRatio] = useState("9:16");
  const [engineId, setEngineId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Array<{ url: string; provider: string; preview?: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listVideoEngines();
        setEngines(data ?? []);
        const first = data?.find((e) => e.available !== false);
        setEngineId(first?.id);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      }
    };
    void load();
  }, []);

  const onGenerate = async () => {
    try {
      setLoading(true);
      const result = await generateVideo({
        prompt,
        engineId: engineId || undefined,
        durationSeconds: duration,
        aspectRatio: ratio,
        stylePreset: style,
      });
      setVideos((prev) => [{ url: result.url, provider: result.provider, preview: result.previewImageUrl }, ...prev].slice(0, 12));
      toast.success(`Video generated with ${result.provider}`);
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
            <h1 className="text-xl font-semibold">Video Studio</h1>
            <p className="text-sm text-muted-foreground">Short-form product teasers with safe fallbacks.</p>
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
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the motion" />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Duration</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}s
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Aspect ratio</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                >
                  {RATIOS.map((r) => (
                    <option key={r}>{r}</option>
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
            </div>

            <Button onClick={onGenerate} disabled={loading || !prompt.trim()}>
              {loading ? <Spinner className="h-4 w-4" /> : "Generate"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {videos.length === 0 ? <p className="text-sm text-muted-foreground">No videos yet.</p> : null}
            {videos.map((item, idx) => (
              <div key={`${item.url}-${idx}`} className="space-y-2 rounded-md border p-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.provider}</span>
                  <Badge variant="outline">#{idx + 1}</Badge>
                </div>
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="Preview" className="h-48 w-full rounded-md object-cover" />
                ) : null}
                <video controls className="w-full rounded-md" src={item.url} />
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
