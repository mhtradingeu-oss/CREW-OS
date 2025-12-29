"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { previewWhiteLabel } from "@/lib/api/white-label";
import { apiErrorMessage } from "@/lib/api/client";
import { PermissionGuard } from "@/components/layout/permission-guard";

const SURFACES = ["front", "back", "side", "top", "lid"];
const SCENES = ["studio", "hero", "lifestyle", "shelf", "social"];

export default function WhiteLabelPage() {
  const [productName, setProductName] = useState("");
  const [style, setStyle] = useState("modern");
  const [scene, setScene] = useState("studio");
  const [prompt, setPrompt] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [colors, setColors] = useState({ primary: "", secondary: "", accent: "" });
  const [surfaces, setSurfaces] = useState<string[]>(["front", "back", "side"]);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<Array<{ url: string; surface?: string }>>([]);

  const toggleSurface = (surface: string) => {
    setSurfaces((prev) =>
      prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface],
    );
  };

  const generate = async () => {
    try {
      setLoading(true);
      const result = await previewWhiteLabel({
        productName,
        style,
        scene,
        prompt: prompt || undefined,
        logoUrl: logoUrl || undefined,
        brandColors: colors,
        surfaces,
      });
      const outputs = result?.outputs ?? result?.previews ?? [];
      setPreviews(outputs.map((o: any) => ({ url: o.url ?? o, surface: o.surface })));
      toast.success("Preview ready");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard required={"ai:white-label:run"}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">White Label Configurator</h1>
            <p className="text-sm text-muted-foreground">
              Create Canva-like packaging previews with safe engines and reusable recipes.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Product name</label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Hair Clay" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Logo URL</label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Style</label>
                <Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="minimal, bold, premium" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Scene</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={scene}
                  onChange={(e) => setScene(e.target.value)}
                >
                  {SCENES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Custom prompt (optional)</label>
                <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Add creative direction" />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {(["primary", "secondary", "accent"] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium">{key} color</label>
                  <Input
                    value={(colors as any)[key] ?? ""}
                    onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Surfaces</div>
              <div className="flex flex-wrap gap-2">
                {SURFACES.map((surface) => (
                  <Button
                    key={surface}
                    type="button"
                    size="sm"
                    variant={surfaces.includes(surface) ? "default" : "outline"}
                    onClick={() => toggleSurface(surface)}
                  >
                    {surface}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={generate} disabled={loading}>
              {loading ? <Spinner className="h-4 w-4" /> : "Generate Previews"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previews</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {previews.length === 0 ? <p className="text-sm text-muted-foreground">No previews yet.</p> : null}
            {previews.map((item, idx) => (
              <div key={`${item.url}-${idx}`} className="space-y-2 rounded-md border p-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.surface ?? "multi-angle"}</span>
                  <Badge variant="outline">#{idx + 1}</Badge>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="Preview" className="h-48 w-full rounded-md object-cover" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(item.url).then(() => toast.success("URL copied"))}
                  >
                    Copy URL
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => window.open(item.url, "_blank")?.focus()}>
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
