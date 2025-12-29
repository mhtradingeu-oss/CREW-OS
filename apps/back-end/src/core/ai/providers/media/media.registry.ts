import { badRequest } from "../../../http/errors.js";
import {
  type ImageMediaProvider,
  type MediaEngineId,
  type MediaProviderKind,
  type ResolvedMediaProvider,
  type VideoMediaProvider,
} from "./media.types.js";
import { getImageProviderDefinitions } from "./image.providers.js";
import { getVideoProviderDefinitions } from "./video.providers.js";

function computeAvailability<T extends ImageMediaProvider | VideoMediaProvider>(
  provider: T,
): ResolvedMediaProvider<T> {
  const missingKeys = (provider.envVarKeys ?? []).filter((key) => !process.env[key]?.trim());
  const available = provider.requiresApiKey ? missingKeys.length === 0 : missingKeys.length === 0;
  return { ...provider, available, missingKeys };
}

export function getImageProviderCatalog(): ResolvedMediaProvider<ImageMediaProvider>[] {
  return getImageProviderDefinitions().map(computeAvailability);
}

export function getVideoProviderCatalog(): ResolvedMediaProvider<VideoMediaProvider>[] {
  return getVideoProviderDefinitions().map(computeAvailability);
}

export function getAvailableImageProviders(): ImageMediaProvider[] {
  return getImageProviderCatalog()
    .filter((provider) => provider.available)
    .map((provider) => provider as ImageMediaProvider);
}

export function getAvailableVideoProviders(): VideoMediaProvider[] {
  return getVideoProviderCatalog()
    .filter((provider) => provider.available)
    .map((provider) => provider as VideoMediaProvider);
}

export function resolveMediaProvider(
  kind: MediaProviderKind,
  engineId?: MediaEngineId,
): ImageMediaProvider | VideoMediaProvider {
  const catalog = kind === "image" ? getImageProviderCatalog() : getVideoProviderCatalog();
  const available = catalog.filter((provider) => provider.available);

  if (engineId) {
    const explicit = catalog.find((provider) => provider.id === engineId);
    if (explicit && explicit.available) {
      return explicit;
    }
    if (explicit && !explicit.available) {
      throw badRequest(
        `Media provider ${engineId} is disabled. Missing keys: ${explicit.missingKeys.join(", ") || "unknown"}`,
      );
    }
    throw badRequest("Requested media provider is not available. Configure the required API keys or endpoints.");
  }

  if (available.length) {
    return available[0] as ImageMediaProvider | VideoMediaProvider;
  }

  throw badRequest("No media providers are available. Configure at least one provider endpoint or API key.");
}
