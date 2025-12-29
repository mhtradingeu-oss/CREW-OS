"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  generateMedia,
  listImageEngines,
  listVideoEngines,
  type MediaAsset,
  type MediaEngine,
} from "@/lib/api/media";
import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/layout/permission-guard";

const IMAGE_STYLE_PRESETS = ["product shot", "packshot", "lifestyle", "social post", "ad creative", "story" ];
const VIDEO_STYLE_PRESETS = ["cinematic", "product", "lifestyle", "social", "teaser", "loop"];
const IMAGE_RESOLUTIONS = ["1024x1024", "1024x1536", "1536x1024", "768x1024", "1024x768"];
const VIDEO_RATIOS = ["9:16", "1:1", "16:9"];

export default function MediaStudioPage() {
  const [mode, setMode] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState("product shot");
  const [resolution, setResolution] = useState("1024x1024");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MediaAsset[]>([]);
  const [imageEngines, setImageEngines] = useState<MediaEngine[]>([]);
  const [videoEngines, setVideoEngines] = useState<MediaEngine[]>([]);
  const [imageEngineId, setImageEngineId] = useState<string | undefined>();
  const [videoEngineId, setVideoEngineId] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        const [images, videos] = await Promise.all([listImageEngines(), listVideoEngines()]);
        setImageEngines(images ?? []);
        setVideoEngines(videos ?? []);
        const firstImage = images?.find((engine) => engine.available !== false);
        const firstVideo = videos?.find((engine) => engine.available !== false);
        setImageEngineId(firstImage?.id);
        setVideoEngineId(firstVideo?.id);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      }
    };
    void load();
  }, []);

  const onGenerate = async () => {
    try {
      setLoading(true);
      const payload =
        mode === "video"
          ? {
              type: "video" as const,
              prompt,
              engineId: videoEngineId ?? undefined,
              stylePreset: style,
              aspectRatio,
              durationSeconds: duration,
            }
          : {
              type: "image" as const,
              prompt,
              negativePrompt: negativePrompt || undefined,
              engineId: imageEngineId ?? undefined,
              stylePreset: style,
              resolution,
            };

      const asset = await generateMedia(payload);
      setHistory((prev) => [{ ...asset }, ...prev].slice(0, 12));
      toast.success(`Generated with ${asset.provider}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const engines = mode === "image" ? imageEngines : videoEngines;
  const activeEngineId = mode === "image" ? imageEngineId : videoEngineId;

  return (
    <PermissionGuard required={"ai:media:run"}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Media Studio</h1>
            <p className="text-sm text-muted-foreground">
              Safe image and video generation with provider fallbacks and audit logs.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant={mode === "image" ? "default" : "outline"} onClick={() => setMode("image")}>
              Images
            </Button>
            <Button variant={mode === "video" ? "default" : "outline"} onClick={() => setMode("video")}>
              Videos
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "image" ? "Image generation" : "Video generation"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Engine</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={activeEngineId ?? ""}
                  onChange={(e) =>
                    mode === "image" ? setImageEngineId(e.target.value) : setVideoEngineId(e.target.value)
                  }
                >
                  {engines.map((engine) => (
                    <option key={engine.id} value={engine.id} disabled={engine.available === false}>
                      {engine.label} {engine.isFree ? "(free)" : "(paid)"} {engine.available === false ? "- configure key" : ""}
                    </option>
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
                  {(mode === "image" ? IMAGE_STYLE_PRESETS : VIDEO_STYLE_PRESETS).map((preset) => (
                    <option key={preset}>{preset}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{mode === "image" ? "Resolution" : "Aspect ratio"}</label>
                {mode === "image" ? (
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  >
                    {IMAGE_RESOLUTIONS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                  >
                    {VIDEO_RATIOS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {mode === "video" ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Duration (seconds)</label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {[5, 10, 15, 20].map((value) => (
                      <option key={value} value={value}>
                        {value}s
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === "image" ? "Describe the image" : "Describe the motion"}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Negative prompt (optional)</label>
              <Input
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to avoid"
              />
            </div>

            <Button disabled={loading || !prompt.trim()} onClick={onGenerate}>
              {loading ? <Spinner className="h-4 w-4" /> : "Generate"}
            </Button>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {engines.map((engine) => (
                <Badge key={engine.id} variant={engine.isFree ? "secondary" : "outline"}>
                  {engine.label} {engine.available === false ? "(configure key)" : ""}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {history.length === 0 ? <p className="text-sm text-muted-foreground">No assets yet.</p> : null}
            {history.map((asset, idx) => (
              <div key={`${asset.url}-${idx}`} className="space-y-2 rounded-md border p-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="outline">{asset.kind}</Badge>
                  <span>{asset.provider}</span>
                </div>
                {asset.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt="Generated asset" className="h-48 w-full rounded-md object-cover" />
                ) : (
                  <div className="space-y-2">
                    {asset.previewImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.previewImageUrl} alt="Preview" className="h-40 w-full rounded-md object-cover" />
                    ) : null}
                    <video controls className="w-full rounded-md" src={asset.url} />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(asset.url).then(() => toast.success("URL copied"))}
                  >
                    Copy URL
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => window.open(asset.url, "_blank")?.focus()}>
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
