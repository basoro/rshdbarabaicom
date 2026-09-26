import { useMemo } from 'react';
import DOMPurify from 'dompurify';

type RichHtmlProps = {
  html: string;
  className?: string;
};

const IFRAME_TRUSTED_ORIGINS = [
  'docs.google.com',
  'forms.gle',
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'www.google.com',
  'google.com',
  'maps.google.com',
  'www.google.co.id',
  'calendar.google.com',
];

const IFRAME_REQUIRED_ATTRS = ['src', 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'title', 'width', 'height', 'loading', 'referrerpolicy', 'sandbox', 'class', 'id', 'style', 'seamless'];

function isTrustedIframeSrc(rawSrc: string | null | undefined): boolean {
  if (!rawSrc) return false;
  const trimmed = rawSrc.trim();
  if (trimmed.startsWith('about:blank') || trimmed.startsWith('data:') || trimmed.startsWith('javascript:')) {
    return false;
  }
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('#')) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'https://www.rshdbarabai.com');
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return IFRAME_TRUSTED_ORIGINS.some((origin) => host === origin || host.endsWith(`.${origin}`));
}

export default function RichHtml({ html, className = '' }: RichHtmlProps) {
  const sanitizedHtml = useMemo(() => {
    const pegawaiToProxy = (path: string) =>
      `/api/public/media/pegawai?path=${encodeURIComponent(path.replace(/^\/+/, ''))}`;

    const arsipFilenameFromPath = (fullPath: string) => {
      const withoutPrefix = fullPath.replace(/^\/?(?:uploads\/)?arsip\//, '');
      const clean = withoutPrefix.split('/').pop() || withoutPrefix;
      return `/api/public/media/local/arsip/${encodeURIComponent(clean)}`;
    };

    const normalized = html
      .replace(
        /https:\/\/(?:www\.)?rshdbarabai\.(?:com|net)\/(pages\/pegawai\/photo\/[^"' )]+)/gi,
        (_match, p) => pegawaiToProxy(p),
      )
      .replace(
        /(["'(])\/?(pages\/pegawai\/photo\/[^"' )]+)/g,
        (_match, prefix, p) => `${prefix}${pegawaiToProxy(p)}`,
      )
      .replace(
        /https:\/\/(?:www\.)?rshdbarabai\.(?:com|net)\/((?:uploads\/)?arsip\/[^"' )]+)/gi,
        (_match, p) => arsipFilenameFromPath(p),
      )
      .replace(
        /(["'(])\/?((?:uploads\/)?arsip\/[^"' )]+)/g,
        (_match, prefix, p) => `${prefix}${arsipFilenameFromPath(p)}`,
      )
      .replace(
        /https:\/\/www\.rshdbarabai\.com\/(uploads\/[^"' )]+)/g,
        (_match, p) => `/api/public/media/legacy?path=${encodeURIComponent(p)}`,
      )
      .replace(
        /(["'(])\/(uploads\/news\/[^"' )]+)/g,
        (_match, prefix, p) =>
          `${prefix}/api/public/media/local/news/${encodeURIComponent(p.replace(/^uploads\/news\//, ''))}`,
      )
      .replace(
        /(["'(])\/(uploads\/[^"' )]+)/g,
        (_match, prefix, p) => `${prefix}/api/public/media/legacy?path=${encodeURIComponent(p)}`,
      );

    try {
      if (typeof DOMPurify.addHook === 'function' && DOMPurify.isSupported) {
        DOMPurify.addHook('uponSanitizeElement', (node: any, data: any) => {
          if (data.tagName === 'iframe' && node && node.nodeType === 1) {
            const src = node.getAttribute && node.getAttribute('src');
            if (!isTrustedIframeSrc(src)) {
              if (node.parentNode) {
                node.parentNode.removeChild(node);
              } else if (node.remove) {
                node.remove();
              }
            }
          }
        });
      }
    } catch {
      // ignore hook registration failures
    }

    let result: string = normalized;
    try {
      if (DOMPurify.isSupported && typeof DOMPurify.sanitize === 'function') {
        result = DOMPurify.sanitize(normalized, {
          ADD_TAGS: ['iframe'],
          ADD_ATTR: IFRAME_REQUIRED_ATTRS,
          ADD_URI_SAFE_ATTR: ['src'],
          WHOLE_DOCUMENT: false,
        });
      }
    } catch {
      result = normalized;
    }

    return result;
  }, [html]);

  return (
    <div
      className={`rich-html max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
