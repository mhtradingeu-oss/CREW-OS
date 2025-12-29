import {
  createVoiceSession,
  createVoiceTranscript,
  findVoiceSessionWithDetails,
  findVoiceSessionWithTranscripts,
  updateVoiceSession,
} from "../../db/repositories/voice.repository.js";
import { runAIRequest, type AIMessage } from "../../ai-service/ai-client.js";
import { createRunId, recordMonitoringEvent } from "../ai-monitoring.js";
import { applySafetyLayers } from "../ai-safety.js";
import { detectLanguage } from "../ai-utils.js";
import { getSTTProviderForAgent, getTTSProviderForAgent, registerVoiceProviders } from "../providers/voice/registry.js";
import type { VoiceProviderConfig } from "../providers/voice/types.js";

export type StartVoiceSessionParams = {
  brandId?: string;
  tenantId?: string;
  ticketId?: string;
  channel?: string;
  locale?: string;
};

export type ProcessVoiceInputParams = {
  sessionId: string;
  audioUrl?: string;
  audioBase64?: string;
  locale?: string;
};

export type VoiceTurnResult = {
  replyText: string;
  replyAudioUrl?: string;
  sessionState: "ongoing" | "ended" | "handoff";
  language: string;
};

export type EndVoiceSessionParams = {
  sessionId: string;
  locale?: string;
};

export async function startVoiceSession(params: StartVoiceSessionParams) {
  registerVoiceProviders();
  const session = await createVoiceSession({
    brandId: params.brandId ?? null,
    tenantId: params.tenantId ?? null,
    ticketId: params.ticketId ?? null,
    channel: params.channel ?? "voice",
    locale: params.locale ?? "en",
    status: "ONGOING",
  });
  await recordMonitoringEvent({
    category: "AGENT_ACTIVITY",
    status: "SESSION_STARTED",
    engine: "voice-engine",
    namespace: "voice-ivr",
    brandId: params.brandId ?? null,
    tenantId: params.tenantId ?? null,
  });
  return session;
}

async function persistTranscript(params: {
  sessionId: string;
  role: string;
  text: string;
  locale?: string;
  actionJson?: Record<string, unknown> | null;
  audioUrl?: string;
}) {
  await createVoiceTranscript({
    sessionId: params.sessionId,
    role: params.role,
    text: params.text,
    locale: params.locale ?? null,
    actionJson: params.actionJson ? JSON.stringify(params.actionJson) : null,
    audioUrl: params.audioUrl ?? null,
  });
}

async function loadSession(sessionId: string) {
  return findVoiceSessionWithTranscripts(sessionId);
}

export async function processVoiceInput(
  params: ProcessVoiceInputParams,
  providerConfig?: VoiceProviderConfig,
): Promise<VoiceTurnResult> {
  registerVoiceProviders();
  const session = await loadSession(params.sessionId);
  if (!session) {
    throw new Error("Voice session not found");
  }

  const locale = params.locale ?? session.locale ?? "en";
  const stt = getSTTProviderForAgent("AI_VOICE_IVR", providerConfig);
  const sttResult = await stt.transcribe({ audioUrl: params.audioUrl, audioBase64: params.audioBase64, locale });
  const text = sttResult.text ?? "";

  const runId = createRunId();
  const { messages: safeMessages } = await applySafetyLayers({
    messages: [{ role: "user", content: text } as AIMessage],
    context: { namespace: "voice-ivr", agentName: "AI_VOICE_IVR", runId, brandId: session.brandId, tenantId: session.tenantId },
  });

  const detectedLocale = detectLanguage(text) || locale;

  const aiMessages: AIMessage[] = [
    {
      role: "system",
      content:
        "You are AI_VOICE_IVR. Keep replies short and courteous. Return JSON with replyText, actions (array), language.",
    },
    {
      role: "user",
      content: JSON.stringify({
        transcript: safeMessages.map((m) => m.content).join(" "),
        locale: detectedLocale,
        session: {
          id: session.id,
          channel: session.channel,
          brandId: session.brandId,
          tenantId: session.tenantId,
          ticketId: session.ticketId,
        },
      }),
    },
  ];

  const response = await runAIRequest({
    messages: aiMessages,
    namespace: "voice-ivr",
    agentName: "AI_VOICE_IVR",
    brandId: session.brandId ?? undefined,
    tenantId: session.tenantId ?? undefined,
    runId,
    requestedActions: ["voice_turn"],
  });

  let replyText = text ? `Acknowledged: ${text}` : "How can I help you today?";
  let actions: string[] = [];
  let language = detectedLocale;

  if (response.success && response.content) {
    try {
      const parsed = JSON.parse(response.content) as { replyText?: string; actions?: unknown; language?: string };
      replyText = typeof parsed.replyText === "string" ? parsed.replyText : replyText;
      actions = Array.isArray(parsed.actions)
        ? parsed.actions.filter((a): a is string => typeof a === "string")
        : [];
      language = parsed.language ?? detectedLocale;
    } catch {
      // ignore parse errors
    }
  }

  await persistTranscript({ sessionId: session.id, role: "user", text, locale: detectedLocale });

  const tts = getTTSProviderForAgent("AI_VOICE_IVR", providerConfig);
  const ttsResult = await tts.synthesize({ text: replyText, locale: language });
  const audioUrl = ttsResult.audioUrl ?? (ttsResult.audioBase64 ? `data:audio/wav;base64,${ttsResult.audioBase64}` : undefined);

  await persistTranscript({
    sessionId: session.id,
    role: "assistant",
    text: replyText,
    locale: language,
    actionJson: { actions },
    audioUrl,
  });

  const sessionState: VoiceTurnResult["sessionState"] = actions.some((a) => a.includes("handoff"))
    ? "handoff"
    : actions.some((a) => a.includes("end"))
      ? "ended"
      : "ongoing";

  await recordMonitoringEvent({
    category: "AGENT_ACTIVITY",
    status: response.success ? "SUCCESS" : "FALLBACK",
    engine: "voice-engine",
    namespace: "voice-ivr",
    agentName: "AI_VOICE_IVR",
    brandId: session.brandId ?? null,
    tenantId: session.tenantId ?? null,
  });

  return { replyText, replyAudioUrl: audioUrl, sessionState, language };
}

export async function endVoiceSession(params: EndVoiceSessionParams) {
  const session = await loadSession(params.sessionId);
  if (!session) throw new Error("Voice session not found");
  const locale = params.locale ?? session.locale ?? "en";

  const messages: AIMessage[] = [
    {
      role: "system",
      content: "You are AI_VOICE_SUMMARIZER. Summarize the call. Return JSON with summary, tags (array), sentiment.",
    },
    {
      role: "user",
      content: JSON.stringify({
        transcripts:
          session.transcripts?.map((t) => ({
            role: t.role ?? "assistant",
            text: t.text ?? "",
          })) ?? [],
        locale,
      }),
    },
  ];

  const response = await runAIRequest({
    messages,
    namespace: "voice-ivr",
    agentName: "AI_VOICE_SUMMARIZER",
    brandId: session.brandId ?? undefined,
    tenantId: session.tenantId ?? undefined,
    requestedActions: ["voice_summary"],
  });

  let summary = "Call ended.";
  let sentiment = "neutral";
  let tags: string[] = [];
  if (response.success && response.content) {
    try {
      const parsed = JSON.parse(response.content) as { summary?: string; tags?: unknown; sentiment?: string };
      summary = parsed.summary ?? summary;
      tags = Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === "string") : [];
      sentiment = parsed.sentiment ?? sentiment;
    } catch {
      // keep fallback
    }
  }

  await updateVoiceSession(session.id, {
    status: "ENDED",
    endedAt: new Date(),
    summary,
    sentiment,
    tagsJson: tags.length ? JSON.stringify(tags) : null,
  });

  await recordMonitoringEvent({
    category: "AGENT_ACTIVITY",
    status: "SESSION_ENDED",
    engine: "voice-engine",
    namespace: "voice-ivr",
    agentName: "AI_VOICE_SUMMARIZER",
    brandId: session.brandId ?? null,
    tenantId: session.tenantId ?? null,
  });

  return {
    summary,
    sentiment,
    tags,
    sessionId: session.id,
  };
}

export async function getVoiceSession(sessionId: string) {
  return findVoiceSessionWithDetails(sessionId);
}
