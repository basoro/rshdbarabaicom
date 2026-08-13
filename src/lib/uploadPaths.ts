const DEFAULT_IMAGE_URL =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20hospital%20corridor%20with%20green%20accents%2C%20clean%20healthcare%20interior%2C%20soft%20daylight%2C%20realistic%20editorial%20photography&image_size=landscape_16_9';

export function getNewsImageBase(): { imageUrl: string; imagePath: string } {
  return {
    imageUrl: '',
    imagePath: 'uploads/website/news',
  };
}

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

  const { imagePath } = getNewsImageBase();
  const normalized = trimmed.replace(/^\/+/, '');
  const base = imagePath ? `${imagePath.replace(/\/+$/, '')}/` : '';
  return `/${base}${encodeURI(normalized)}`;
}

export const NEWS_COVER_FALLBACK = DEFAULT_IMAGE_URL;
