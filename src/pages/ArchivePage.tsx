import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Search } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { getArchives } from '@/lib/api';
import type { ArchiveItem } from '@/types';

const LENGTH_MENU_OPTIONS = [10, 25, 50, 100];

export default function ArchivePage() {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({ q: '', tahun: '', kategori: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  function loadData(nextFilters = filters, nextPage = page, nextPageSize = pageSize) {
    setLoading(true);
    getArchives({ ...nextFilters, page: nextPage, pageSize: nextPageSize })
      .then((response) => {
        setItems(response.items);
        setYears(response.filters.years);
        setCategories(response.filters.categories);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(filters, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  function handleApply() {
    setPage(1);
    loadData(filters, 1, pageSize);
  }

  function handlePageSizeChange(next: number) {
    setPage(1);
    setPageSize(next);
  }

  const startEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, total);

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Arsip Dokumen"
        title="Dokumen publik rumah sakit"
      />

      <div className="mt-10 grid gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/50 md:grid-cols-[1.2fr_0.7fr_0.8fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Cari nama dokumen..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-4 text-sm outline-none ring-emerald-500 transition focus:ring"
          />
        </label>
        <select
          value={filters.tahun}
          onChange={(event) => setFilters((current) => ({ ...current, tahun: event.target.value }))}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none ring-emerald-500 transition focus:ring"
        >
          <option value="">Semua tahun</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={filters.kategori}
          onChange={(event) => setFilters((current) => ({ ...current, kategori: event.target.value }))}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none ring-emerald-500 transition focus:ring"
        >
          <option value="">Semua kategori</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleApply}
          className="rounded-2xl bg-emerald-700 px-6 py-4 text-sm font-semibold text-white"
        >
          Terapkan
        </button>
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 transition focus:ring"
          >
            {LENGTH_MENU_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>entri per halaman</span>
        </div>
        {!loading && total > 0 ? (
          <div className="text-sm text-slate-600">
            Menampilkan <span className="font-semibold text-slate-800">{startEntry}</span> sampai{' '}
            <span className="font-semibold text-slate-800">{endEntry}</span> dari{' '}
            <span className="font-semibold text-slate-800">{total}</span> entri
          </div>
        ) : (
          !loading && (
            <div className="text-sm text-slate-500">Tidak ada entri yang ditemukan.</div>
          )
        )}
      </div>

      {loading ? (
        <div className="mt-10 text-slate-600">Memuat arsip dokumen...</div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[2rem] bg-white shadow-lg shadow-slate-200/50">
          <div className="hidden grid-cols-[1.5fr_1fr_120px_260px] gap-4 border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-500 md:grid">
            <div>Nama Dokumen</div>
            <div>Kategori</div>
            <div>Tahun</div>
            <div className="text-center">Aksi</div>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1.5fr_1fr_120px_260px] md:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.nama_dokumen}</h3>
                  <p className="mt-2 text-sm text-slate-500">{item.jenis} • .{item.ekstensi}</p>
                </div>
                <div className="text-sm text-slate-600">{item.kategori}</div>
                <div className="text-sm text-slate-600">{item.tahun}</div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={`/api/public/arsip/${item.id}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                  >
                    <Eye className="h-4 w-4" />
                    Lihat
                  </a>
                  <a
                    href={`/api/public/arsip/${item.id}/download`}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Download className="h-4 w-4" />
                    Unduh
                  </a>
                </div>
              </div>
            ))}
            {!items.length ? (
              <div className="px-6 py-12 text-center text-slate-500">Tidak ada arsip yang sesuai dengan filter.</div>
            ) : null}
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 py-5 md:flex-row">
              <div className="text-sm text-slate-500">
                Halaman <span className="font-semibold text-slate-800">{page}</span> dari{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page <= 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((num) => {
                    if (totalPages <= 7) return true;
                    if (num === 1 || num === totalPages) return true;
                    if (num >= page - 1 && num <= page + 1) return true;
                    return false;
                  })
                  .map((num, index, arr) => {
                    const withSeparatorBefore = index > 0 && arr[index - 1] !== num - 1;
                    return (
                      <div key={num} className="flex items-center">
                        {withSeparatorBefore ? <span className="px-1 text-sm text-slate-400">...</span> : null}
                        <button
                          type="button"
                          onClick={() => setPage(num)}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                            num === page
                              ? 'bg-emerald-700 text-white'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {num}
                        </button>
                      </div>
                    );
                  })}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Halaman selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
