const DEFAULT_IMAGE_URL =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20hospital%20corridor%20with%20green%20accents%2C%20clean%20healthcare%20interior%2C%20soft%20daylight%2C%20realistic%20editorial%20photography&image_size=landscape_16_9';

export function resolveNewsCoverUrl(
  coverPhoto: string | null | undefined,
  fallback = DEFAULT_IMAGE_URL,
): string {
  if (!coverPhoto) return fallback;
  const trimmed = coverPhoto.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;

  return `/api/public/media/local/news/${encodeURIComponent(trimmed)}`;
}

export const NEWS_COVER_FALLBACK = DEFAULT_IMAGE_URL;
