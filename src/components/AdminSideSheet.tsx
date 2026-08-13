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
    <div className="fixed inset-0 z-50 flex bg-slate-950/65 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Tutup panel"
        onClick={onClose}
        className="hidden flex-1 cursor-default lg:block"
      />
      <div className="ml-auto flex h-full w-full max-w-none flex-col border-l border-white/10 bg-slate-950 shadow-2xl shadow-black/30 lg:w-[75vw]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Editor</p>
            <h2 className="mt-2 font-display text-4xl text-white">{title}</h2>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
