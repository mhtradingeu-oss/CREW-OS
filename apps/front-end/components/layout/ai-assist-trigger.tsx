"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AIRecommendationPanel } from "@/components/shell/ai-recommendation-panel";

export function AiAssistTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        AI Assist
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="AI Assist">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="text-foreground">Contextual AI recommendations</p>
          <AIRecommendationPanel
            className="border border-border"
            description="AI outputs stay read-only until confirmed. Connects to the orchestrator endpoints with plan + permission gating."
            items={[]}
          />
          <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs">
            <Bot className="h-4 w-4 text-primary" />
            Future: Surface orchestrated responses per page context and allow safe actions with explicit confirmation.
          </div>
        </div>
      </Modal>
    </>
  );
}
