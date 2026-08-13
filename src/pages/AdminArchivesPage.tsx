import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Search, Trash2 } from 'lucide-react';
import AdminPagination from '@/components/AdminPagination';
import AdminUploadField from '@/components/AdminUploadField';
import { adminDeleteArchive, adminListArchives, adminSaveArchive } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import type { ArchiveItem } from '@/types';

const emptyArchive: ArchiveItem = {
  id: 0,
  kategori: '',
  jenis: 'Publik',
  nama_dokumen: '',
  tahun: new Date().getFullYear(),
  file_path: '',
  ekstensi: 'pdf',
  created_at: '',
};

export default function AdminArchivesPage() {
  const token = useAdminStore((state) => state.token);
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [form, setForm] = useState<ArchiveItem>(emptyArchive);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  async function loadData() {
    if (!token) return;
    const response = await adminListArchives(token);
    setItems(response);
    if (!selectedId && response.length) {
      setSelectedId(response[0].id);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? emptyArchive,
    [items, selectedId],
  );
  const filteredItems = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const haystack = `${item.nama_dokumen} ${item.kategori} ${item.jenis} ${item.tahun} ${item.ekstensi}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * pageSize, page * pageSize),
    [filteredItems, page],
  );

  useEffect(() => {
    setForm(selectedItem);
  }, [selectedItem]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  async function handleSave() {
    if (!token) return;
    try {
      await adminSaveArchive(token, form);
      await loadData();
      window.alert('Arsip berhasil disimpan.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan arsip.');
    }
  }

  async function handleDelete() {
    if (!token || !form.id) return;
    const confirmed = window.confirm(`Hapus arsip "${form.nama_dokumen}"?`);
    if (!confirmed) return;

    try {
      await adminDeleteArchive(token, form.id);
      setSelectedId(0);
      setForm(emptyArchive);
      await loadData();
      window.alert('Arsip berhasil dihapus.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menghapus arsip.');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Arsip</p>
            <h1 className="mt-2 font-display text-4xl text-white">Dokumen</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(0);
              setForm(emptyArchive);
            }}
            className="rounded-2xl bg-emerald-600 p-3 text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama, kategori, atau tahun arsip"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>

        <div className="mt-6 space-y-3">
          {paginatedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                selectedId === item.id
                  ? 'border-emerald-400 bg-emerald-500/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-semibold text-white">{item.nama_dokumen}</p>
              <p className="mt-1 text-sm text-slate-400">{item.kategori} • {item.tahun}</p>
            </button>
          ))}
          {!paginatedItems.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
              {searchQuery ? 'Tidak ada arsip yang cocok dengan pencarian.' : 'Belum ada arsip.'}
            </div>
          ) : null}
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.nama_dokumen}
            onChange={(event) => setForm((current) => ({ ...current, nama_dokumen: event.target.value }))}
            placeholder="Nama dokumen"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring md:col-span-2"
          />
          <input
            value={form.kategori}
            onChange={(event) => setForm((current) => ({ ...current, kategori: event.target.value }))}
            placeholder="Kategori"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <select
            value={form.jenis}
            onChange={(event) => setForm((current) => ({ ...current, jenis: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          >
            <option value="Publik">Publik</option>
            <option value="Private">Private</option>
          </select>
          <input
            type="number"
            value={form.tahun}
            onChange={(event) => setForm((current) => ({ ...current, tahun: Number(event.target.value) }))}
            placeholder="Tahun"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            value={form.ekstensi}
            onChange={(event) => setForm((current) => ({ ...current, ekstensi: event.target.value }))}
            placeholder="Ekstensi"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            value={form.file_path}
            onChange={(event) => setForm((current) => ({ ...current, file_path: event.target.value }))}
            placeholder="Path file atau URL"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring md:col-span-2"
          />
        </div>

        <div className="mt-4">
          <AdminUploadField
            label="Upload file arsip"
            target="arsip"
            helpText="Dokumen akan disimpan ke folder uploads/arsip. Path dan ekstensi akan terisi otomatis."
            onUploaded={(result) =>
              setForm((current) => ({
                ...current,
                file_path: result.filePath,
                ekstensi: result.originalName.split('.').pop()?.toLowerCase() || current.ekstensi,
              }))
            }
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
          >
            <Save className="h-4 w-4" />
            Simpan Arsip
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 px-5 py-3 text-sm font-semibold text-rose-200"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
