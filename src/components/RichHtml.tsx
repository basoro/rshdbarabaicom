import { useMemo } from 'react';
import DOMPurify from 'dompurify';

type RichHtmlProps = {
  html: string;
  className?: string;
};

export default function RichHtml({ html, className = '' }: RichHtmlProps) {
  const sanitizedHtml = useMemo(() => {
    const pegawaiToProxy = (path: string) =>
      `/api/public/media/pegawai?path=${encodeURIComponent(path.replace(/^\/+/, ''))}`;

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

    return DOMPurify.sanitize(normalized);
  }, [html]);

  return (
    <div
      className={`rich-html max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
