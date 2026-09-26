import { useCallback, useEffect, useRef, useState } from 'react';

const SURVEY_URL =
  'https://skm.go.id/share/instansi/912a8be1-ac1b-4092-92a2-6505c56c2bf9/2';
const POSTER_SRC = '/poster-skm.png';
const SESSION_FLAG = 'rshd_skm_popup_shown';
const FORCE_DEV_FLAG = 'DEV_FORCE_SKM';
const AUTO_CLOSE_SECONDS = 20;
const SHOW_DELAY_MS = 500;
const CLOSE_ANIM_MS = 280;

export default function SurveyPopup() {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [remaining, setRemaining] = useState<number>(AUTO_CLOSE_SECONDS);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const closeAnimTimerRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (closeAnimTimerRef.current != null) {
      window.clearTimeout(closeAnimTimerRef.current);
      closeAnimTimerRef.current = null;
    }
  }, []);

  const markSeen = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(SESSION_FLAG, '1');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const close = useCallback(
    (opts?: { saveSeen?: boolean }) => {
      const { saveSeen = true } = opts ?? {};
      if (isClosing) return;
      clearTimers();
      try {
        document.body.style.overflow = '';
      } catch {
        // ignore
      }
      setIsClosing(true);
      closeAnimTimerRef.current = window.setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
        if (saveSeen) markSeen();
      }, CLOSE_ANIM_MS);
    },
    [clearTimers, isClosing, markSeen],
  );

  const openSurvey = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>) => {
      event.preventDefault();
      userInteractedRef.current = true;
      try {
        if (typeof window !== 'undefined') {
          window.open(SURVEY_URL, '_blank', 'noopener,noreferrer');
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = SURVEY_URL;
        }
      }
      close({ saveSeen: true });
    },
    [close],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (dialogRef.current && event.target === event.currentTarget) {
        userInteractedRef.current = true;
        close({ saveSeen: true });
      }
    },
    [close],
  );

  const handleManualCloseClick = useCallback(() => {
    userInteractedRef.current = true;
    close({ saveSeen: true });
  }, [close]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const isOnAdmin =
        window.location.pathname.startsWith('/admin') ||
        window.location.pathname.startsWith('/cms');
      if (isOnAdmin) return;
    } catch {
      // continue
    }

    let forceShow = false;
    try {
      forceShow =
        typeof window !== 'undefined' &&
        !!window.localStorage &&
        window.localStorage.getItem(FORCE_DEV_FLAG) === '1';
    } catch {
      forceShow = false;
    }

    if (!forceShow) {
      try {
        const alreadyShown =
          window.sessionStorage &&
          window.sessionStorage.getItem(SESSION_FLAG) === '1';
        if (alreadyShown) return;
      } catch {
        // continue and show popup if storage is blocked
      }
    }

    const showDelay = window.setTimeout(() => {
      setRemaining(AUTO_CLOSE_SECONDS);
      setIsClosing(false);
      setMounted(true);
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(showDelay);
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!mounted || isClosing) return;

    userInteractedRef.current = false;
    setRemaining(AUTO_CLOSE_SECONDS);

    timerRef.current = window.setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    hideTimerRef.current = window.setTimeout(() => {
      close({ saveSeen: userInteractedRef.current });
    }, AUTO_CLOSE_SECONDS * 1000);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        userInteractedRef.current = true;
        close({ saveSeen: true });
      }
    };
    window.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimers();
    };
  }, [mounted, isClosing, close, clearTimers]);

  if (!mounted) return null;

  const progressWidth = `${Math.max(0, (remaining / AUTO_CLOSE_SECONDS) * 100)}%`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rshd-skm-title"
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 ${
        isClosing ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      <div
        aria-hidden="true"
        onClick={handleBackdropClick}
        className={`absolute inset-0 bg-slate-950/75 ${
          isClosing ? 'animate-backdrop-out pointer-events-none' : 'animate-backdrop-in pointer-events-auto'
        }`}
        style={{ backdropFilter: isClosing ? undefined : 'blur(4px)' }}
      />

      <div
        ref={dialogRef}
        className={`relative isolate flex w-full max-w-md max-h-[92dvh] flex-col overflow-y-auto overflow-x-hidden rounded-[1.75rem] sm:max-w-lg sm:rounded-[2rem] bg-white shadow-2xl shadow-slate-900/35 ring-1 ring-slate-900/5 ${
          isClosing
            ? 'animate-pop-out pointer-events-none'
            : 'animate-pop-in pointer-events-auto'
        }`}
        style={
          isClosing
            ? undefined
            : { animationDelay: '70ms', animationFillMode: 'backwards' }
        }
      >
        <div className="absolute inset-x-0 top-0 z-10 h-1 w-full overflow-hidden bg-slate-100">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-[width] duration-700 ease-out"
            style={{ width: progressWidth }}
          />
        </div>

        <div className="flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 pb-3 pt-4 sm:px-8 sm:pb-4 sm:pt-5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 ring-1 ring-white/60 sm:h-11 sm:w-11">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5"
                aria-hidden="true"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-700 sm:text-[11px] sm:tracking-[0.28em]">
                Survei Kepuasan
              </p>
              <h2
                id="rshd-skm-title"
                className="mt-0.5 truncate font-display text-base text-slate-900 sm:text-lg"
              >
                SKM Online RSUD H. Damanhuri
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualCloseClick}
            aria-label="Tutup popup survei"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:translate-y-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 bg-slate-50/70 px-3.5 py-4 sm:px-7 sm:py-6 sm:gap-4">
          <a
            href={SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={openSurvey}
            title="Klik untuk buka Survei Kepuasan di tab baru"
            className="group relative block w-full max-w-[320px] sm:max-w-sm overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] bg-white ring-1 ring-slate-200 shadow-[0_18px_45px_-20px_rgba(15,118,110,0.45)] sm:shadow-[0_20px_55px_-20px_rgba(15,118,110,0.45)] transition duration-300 ease-out hover:-translate-y-1 hover:sm:-translate-y-1.5 hover:ring-emerald-300 hover:shadow-[0_28px_60px_-20px_rgba(15,118,110,0.55)]"
          >
            <div className="relative w-full overflow-hidden">
              <img
                src={POSTER_SRC}
                alt="Poster Survei Kepuasan Masyarakat (SKM) Online RSUD H. Damanhuri Barabai — scan QR code untuk mengisi survei"
                className="block h-auto w-full select-none object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                draggable={false}
                onError={(event) => {
                  const target = event.currentTarget;
                  if (!target) return;
                  target.onerror = null;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  const fallback = parent?.querySelector<HTMLElement>('[data-skm-fallback]');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div
                data-skm-fallback
                style={{ display: 'none' }}
                className="flex aspect-[3/4] w-full flex-col items-center justify-between gap-3 sm:gap-4 bg-gradient-to-b from-sky-50 via-white to-emerald-50 p-4 sm:p-6 text-center ring-1 ring-slate-200"
              >
                <div className="flex w-full items-start justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] sm:text-xs font-bold text-white shadow-md shadow-emerald-500/20 ring-1 ring-white/70">
                      RS
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.22em] text-emerald-700">
                        RSUD H. Damanhuri
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 leading-tight">
                        Smart, Green and Friendly Hospital
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-slate-600 ring-1 ring-slate-200">
                    SKM Online
                  </div>
                </div>

                <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 sm:gap-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-sky-600/10 px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.28em] text-sky-700 ring-1 ring-sky-600/20">
                    Survei Kepuasan Masyarakat
                  </div>
                  <h3 className="max-w-sm font-display text-xl sm:text-2xl font-bold leading-tight text-slate-900 sm:sm:text-[28px]">
                    SURVEI KEPUASAN MASYARAKAT
                  </h3>
                  <p className="max-w-xs text-[12px] sm:text-[13px] leading-relaxed text-slate-600">
                    Yuk, bantu kami meningkatkan kualitas pelayanan dengan
                    mengisi Survei Kepuasan Masyarakat (SKM). Partisipasi anda
                    sangat berarti, terimakasih.
                  </p>

                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute -inset-x-6 sm:-inset-x-8 -top-6 sm:-top-8 h-[108%] w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)]">
                      <div className="absolute left-0 top-0 h-16 w-16 sm:h-20 sm:w-20 rounded-tl-[22px] sm:rounded-tl-[28px] border-l-[5px] sm:border-l-[6px] border-t-[5px] sm:border-t-[6px] border-sky-500" />
                      <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 rounded-tr-[22px] sm:rounded-tr-[28px] border-r-[5px] sm:border-r-[6px] border-t-[5px] sm:border-t-[6px] border-sky-500" />
                      <div className="absolute bottom-0 left-0 h-16 w-16 sm:h-20 sm:w-20 rounded-bl-[22px] sm:rounded-bl-[28px] border-b-[5px] sm:border-b-[6px] border-l-[5px] sm:border-l-[6px] border-sky-500" />
                      <div className="absolute bottom-0 right-0 h-16 w-16 sm:h-20 sm:w-20 rounded-br-[22px] sm:rounded-br-[28px] border-b-[5px] sm:border-b-[6px] border-r-[5px] sm:border-r-[6px] border-sky-500" />
                    </div>
                    <div className="relative grid aspect-square w-32 sm:w-40 md:w-48 place-items-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200">
                      <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-[3px] p-1">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <span
                            key={i}
                            className={`block rounded-[2px] ${
                              [0, 1, 2, 5, 6, 7, 10, 31, 34, 35, 29, 30, 25, 26].includes(i) ||
                              (i >= 12 && i <= 23 && i % 2 === 0)
                                ? 'bg-slate-900'
                                : (i * 7 + 11) % 3 === 0
                                  ? 'bg-slate-900'
                                  : 'bg-white'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="absolute left-3 sm:left-4 top-3 sm:top-4 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md border-4 border-slate-900 bg-white">
                        <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="absolute right-3 sm:right-4 top-3 sm:top-4 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md border-4 border-slate-900 bg-white">
                        <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md border-4 border-slate-900 bg-white">
                        <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <p className="mt-1 font-display text-base sm:text-lg font-semibold uppercase tracking-wide text-sky-700">
                    Scan SKM Online
                  </p>
                </div>

                <div className="flex w-full items-end justify-between gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-medium text-slate-500">
                  <span>@rshdbarabaiofficial</span>
                  <span>@rshdbarabai</span>
                  <span>www.rshdbarabai.com</span>
                </div>
              </div>
            </div>
          </a>

          <div className="flex w-full flex-col items-center gap-2.5 sm:gap-3">
            <a
              href={SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={openSurvey}
              className="group inline-flex w-full max-w-[320px] sm:max-w-sm items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-5 sm:px-6 py-3 sm:py-3.5 text-[13px] sm:text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 ring-1 ring-white/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-700/30 active:translate-y-0 sm:text-base"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
              Buka Link Survei Kepuasan
            </a>

            <div className="flex w-full max-w-[320px] sm:max-w-sm items-center justify-between rounded-2xl bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs ring-1 ring-slate-200">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 font-medium text-slate-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Menutup otomatis
              </span>
              <span
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-slate-100 px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-[11px] font-semibold tabular-nums text-slate-700 ring-1 ring-slate-200 transition-colors duration-500 ease-out"
                aria-live="polite"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ease-out ${
                    remaining > 5 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {remaining} detik
              </span>
            </div>

            <p className="w-full max-w-[320px] sm:max-w-sm text-center text-[10px] sm:text-[11px] leading-relaxed text-slate-500">
              Partisipasi anda sangat berarti, terimakasih. Popup hanya muncul
              sekali tiap sesi kunjungan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
