const DEFAULT_IMAGE_URL =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20hospital%20corridor%20with%20green%20accents%2C%20clean%20healthcare%20interior%2C%20soft%20daylight%2C%20realistic%20editorial%20photography&image_size=landscape_16_9';
const DEFAULT_IMAGE_PATH = 'uploads/website/news';

function toHex(code: number): string {
  return `%${code.toString(16).toUpperCase().padStart(2, '0')}`;
}

function hexEscape(charCode: number): string {
  if (charCode < 128) {
    return toHex(charCode);
  }
  if (charCode < 2048) {
    return toHex(192 | (charCode >> 6)) + toHex(128 | (63 & charCode));
  }
  if (charCode < 0xd800 || charCode >= 0xe000) {
    return (
      toHex(224 | (charCode >> 12)) +
      toHex(128 | (63 & (charCode >> 6))) +
      toHex(128 | (63 & charCode))
    );
  }
  return '';
}

function percentEncode(value: string, keepReservedPathChar = false): string {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a) ||
      (code >= 0x30 && code <= 0x39) ||
      code === 0x2d ||
      code === 0x2e ||
      code === 0x5f ||
      code === 0x7e
    ) {
      result += value.charAt(index);
      continue;
    }
    if (
      keepReservedPathChar &&
      (code === 0x2f || code === 0x3a || code === 0x3f || code === 0x3d || code === 0x26)
    ) {
      result += value.charAt(index);
      continue;
    }
    result += hexEscape(code);
  }
  return result;
}

function getEnvImageUrl(): string {
  const value = process.env.IMAGE_URL?.trim();
  return value?.replace(/\/+$/, '') || '';
}

function getEnvImagePath(): string {
  const value = process.env.IMAGE_PATH?.trim() || DEFAULT_IMAGE_PATH;
  return value.replace(/^\/+|\/+$/g, '');
}

function joinUrlParts(parts: string[]): string {
  const tokens = parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter((part) => part.length > 0);
  return tokens.join('/');
}

export function resolveNewsCover(coverPhoto: string | null | undefined): string {
  if (!coverPhoto) {
    return DEFAULT_IMAGE_URL;
  }

  const trimmed = coverPhoto.trim();
  if (!trimmed) {
    return DEFAULT_IMAGE_URL;
  }

  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  const imageUrl = getEnvImageUrl();
  const suffix = trimmed.replace(/^\/+/, '');

  if (trimmed.startsWith('/')) {
    const encoded = percentEncode(suffix, true);
    return imageUrl ? `${imageUrl}/${encoded}` : trimmed;
  }

  // Bare filename → always route to local media server
  const proxySuffix = percentEncode(trimmed);
  return `/api/public/media/local/news/${proxySuffix}`;
}

export function resolvePreviewCoverFromEnv(): { imageUrl: string; imagePath: string; fallbackUrl: string } {
  return {
    imageUrl: getEnvImageUrl(),
    imagePath: getEnvImagePath(),
    fallbackUrl: DEFAULT_IMAGE_URL,
  };
}
