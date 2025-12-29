import { logger } from "../../../logger.js";
import { VoiceProviderId, type STTProvider, type TTSProvider, type VoiceProviderConfig } from "./types.js";

const sttProviders = new Map<VoiceProviderId, STTProvider>();
const ttsProviders = new Map<VoiceProviderId, TTSProvider>();

function buildLocalSTT(): STTProvider {
  return {
    id: VoiceProviderId.Local,
    async transcribe(input) {
      // Placeholder STT: simply acknowledges audio reception
      const text = input.audioBase64 ? "[audio-base64-received]" : input.audioUrl ? `Audio at ${input.audioUrl}` : "";
      return { text };
    },
  };
}

function buildLocalTTS(): TTSProvider {
  return {
    id: VoiceProviderId.Local,
    async synthesize(input) {
      // Placeholder TTS: return text as data URL for now
      const payload = Buffer.from(`VOICE:${input.text}`).toString("base64");
      return { audioBase64: payload };
    },
  };
}

export function registerVoiceProviders() {
  if (!sttProviders.size) {
    sttProviders.set(VoiceProviderId.Local, buildLocalSTT());
  }
  if (!ttsProviders.size) {
    ttsProviders.set(VoiceProviderId.Local, buildLocalTTS());
  }
}

export function getSTTProviderForAgent(_agentId: string, config?: VoiceProviderConfig): STTProvider {
  if (config?.sttProviderId && sttProviders.has(config.sttProviderId)) {
    return sttProviders.get(config.sttProviderId)!;
  }
  const fallback = sttProviders.get(VoiceProviderId.Local);
  if (!fallback) {
    registerVoiceProviders();
    return sttProviders.get(VoiceProviderId.Local)!;
  }
  return fallback;
}

export function getTTSProviderForAgent(_agentId: string, config?: VoiceProviderConfig): TTSProvider {
  if (config?.ttsProviderId && ttsProviders.has(config.ttsProviderId)) {
    return ttsProviders.get(config.ttsProviderId)!;
  }
  const fallback = ttsProviders.get(VoiceProviderId.Local);
  if (!fallback) {
    registerVoiceProviders();
    return ttsProviders.get(VoiceProviderId.Local)!;
  }
  return fallback;
}

export function registerCustomSTT(provider: STTProvider) {
  logger.info(`[voice] registering STT provider ${provider.id}`);
  sttProviders.set(provider.id, provider);
}

export function registerCustomTTS(provider: TTSProvider) {
  logger.info(`[voice] registering TTS provider ${provider.id}`);
  ttsProviders.set(provider.id, provider);
}
