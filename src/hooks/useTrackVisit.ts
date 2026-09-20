import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { trackVisit } from '@/lib/api';

function useVisitorId(): string {
  const [visitorId] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const existing = window.localStorage.getItem('rshd_visitor_id');
      if (existing && /^[a-z0-9_-]+$/i.test(existing)) return existing;
    } catch {
      // ignore
    }
    const random = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      window.localStorage.setItem('rshd_visitor_id', random);
    } catch {
      // ignore
    }
    return random;
  });
  return visitorId;
}

export default function useTrackVisit() {
  const location = useLocation();
  const visitorId = useVisitorId();

  useEffect(() => {
    const controller = typeof window !== 'undefined' ? new AbortController() : null;
    const path = `${location.pathname}${location.search || ''}`;
    const title = typeof document !== 'undefined' ? document.title : '';
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const signal = controller?.signal;

    const fire = () => {
      try {
        trackVisit(
          { path, title, referrer, visitorId },
          signal,
        ).catch(() => {
          // Silently ignore: analytics must never break the page.
        });
      } catch {
        // ignore
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in (window as unknown as Record<string, unknown>)) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(fire);
    } else {
      setTimeout(fire, 400);
    }

    return () => {
      controller?.abort();
    };
  }, [location.pathname, location.search, visitorId]);
}
