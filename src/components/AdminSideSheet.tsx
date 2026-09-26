import { useEffect } from 'react';
import { X } from 'lucide-react';

type AdminSideSheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function AdminSideSheet({
  open,
  title,
  description,
  onClose,
  children,
}: AdminSideSheetProps) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/65">
      <button
        type="button"
        aria-label="Tutup panel"
        onClick={onClose}
        className="hidden flex-1 cursor-default lg:block"
      />
      <div className="ml-auto flex h-full w-full max-w-none flex-col border-l border-slate-200 bg-white shadow-2xl shadow-black/30 dark:border-white/10 dark:bg-slate-950 lg:w-[75vw]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-white/10">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-700 dark:text-emerald-300">Editor</p>
            <h2 className="mt-2 font-display text-4xl text-slate-900 dark:text-white">{title}</h2>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
