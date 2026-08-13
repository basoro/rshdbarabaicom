export function formatDate(value?: number | string | null): string {
  if (!value) return '-';

  const date =
    typeof value === 'number'
      ? new Date(value * 1000)
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function truncateHtml(html: string | null | undefined, maxLength = 160): string {
  if (!html) return '';

  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

export function slugToPath(slug: string): string {
  return `/${slug.replace(/^\/+/, '')}`;
}
