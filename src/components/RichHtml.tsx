import { useMemo } from 'react';
import DOMPurify from 'dompurify';

type RichHtmlProps = {
  html: string;
  className?: string;
};

export default function RichHtml({ html, className = '' }: RichHtmlProps) {
  const sanitizedHtml = useMemo(() => {
    const normalized = html
      .replace(
        /https:\/\/www\.rshdbarabai\.com\/(uploads\/[^"' )]+)/g,
        (_match, path) => `/api/public/media/legacy?path=${encodeURIComponent(path)}`,
      )
      .replace(
        /(["'(])\/(uploads\/[^"' )]+)/g,
        (_match, prefix, path) =>
          `${prefix}/api/public/media/legacy?path=${encodeURIComponent(path)}`,
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
