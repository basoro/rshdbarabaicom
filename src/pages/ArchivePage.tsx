import { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { getArchives } from '@/lib/api';
import type { ArchiveItem } from '@/types';

export default function ArchivePage() {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({ q: '', tahun: '', kategori: '' });
  const [loading, setLoading] = useState(true);

  function loadData(nextFilters = filters) {
    setLoading(true);
    getArchives(nextFilters)
      .then((response) => {
        setItems(response.items);
        setYears(response.filters.years);
        setCategories(response.filters.categories);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Arsip Dokumen"
        title="Dokumen publik rumah sakit"
        description="Filter arsip berdasarkan tahun, kategori, dan kata kunci. Data bersumber langsung dari tabel `arsip_dokumen`."
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
          onClick={() => loadData()}
          className="rounded-2xl bg-emerald-700 px-6 py-4 text-sm font-semibold text-white"
        >
          Terapkan
        </button>
      </div>

      {loading ? (
        <div className="mt-10 text-slate-600">Memuat arsip dokumen...</div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-[2rem] bg-white shadow-lg shadow-slate-200/50">
          <div className="hidden grid-cols-[1.5fr_1fr_120px_140px] gap-4 border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-500 md:grid">
            <div>Nama Dokumen</div>
            <div>Kategori</div>
            <div>Tahun</div>
            <div>Aksi</div>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1.5fr_1fr_120px_140px] md:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.nama_dokumen}</h3>
                  <p className="mt-2 text-sm text-slate-500">{item.jenis} • .{item.ekstensi}</p>
                </div>
                <div className="text-sm text-slate-600">{item.kategori}</div>
                <div className="text-sm text-slate-600">{item.tahun}</div>
                <div>
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
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
        </div>
      )}
    </div>
  );
}
