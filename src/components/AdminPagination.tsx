import { ChevronLeft, ChevronRight } from 'lucide-react';

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="border-t border-white/10 px-5 py-4">
      <p className="text-sm text-slate-400">
        {start}-{end} dari {totalItems} data
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          aria-label="Halaman sebelumnya"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-slate-300">
          Halaman {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          aria-label="Halaman berikutnya"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
