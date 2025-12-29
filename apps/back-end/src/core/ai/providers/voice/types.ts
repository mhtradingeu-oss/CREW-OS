export type STTProvider = {
  id: VoiceProviderId;
  transcribe: (input: { audioUrl?: string; audioBase64?: string; locale?: string }) => Promise<{ text: string }>;
};

export type TTSProvider = {
  id: VoiceProviderId;
  synthesize: (input: { text: string; locale?: string }) => Promise<{ audioUrl?: string; audioBase64?: string }>;
};

export type VoiceProviderConfig = {
  sttProviderId: VoiceProviderId;
  ttsProviderId: VoiceProviderId;
  config?: Record<string, unknown>;
};

export enum VoiceProviderId {
  OpenAI = "openai-voice",
  Local = "local-voice",
  ThirdParty = "third-party-http",
}
