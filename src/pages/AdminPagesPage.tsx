import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Search, Trash2 } from 'lucide-react';
import AdminPagination from '@/components/AdminPagination';
import AdminRichTextEditor from '@/components/AdminRichTextEditor';
import AdminUploadField from '@/components/AdminUploadField';
import { adminDeletePage, adminListPages, adminSavePage } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import type { PageItem } from '@/types';

const emptyPage: PageItem = {
  id: 0,
  title: '',
  slug: '',
  desc: '',
  template: 'page.html',
  date: new Date().toISOString().slice(0, 10),
  content: '',
  markdown: 0,
};

export default function AdminPagesPage() {
  const token = useAdminStore((state) => state.token);
  const [items, setItems] = useState<PageItem[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [form, setForm] = useState<PageItem>(emptyPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  async function loadPages(nextSelectedId?: number) {
    if (!token) return;
    const response = await adminListPages(token);
    setItems(response);

    const targetSelectedId = nextSelectedId ?? selectedId;
    if (!targetSelectedId && response.length) {
      setSelectedId(response[0].id);
      return;
    }

    if (targetSelectedId && response.some((item) => item.id === targetSelectedId)) {
      setSelectedId(targetSelectedId);
      return;
    }

    setSelectedId(0);
  }

  useEffect(() => {
    loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const filteredItems = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const haystack = `${item.title} ${item.slug}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * pageSize, page * pageSize),
    [filteredItems, page],
  );

  useEffect(() => {
    setForm(selectedItem ?? emptyPage);
  }, [selectedItem]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function handleCreate() {
    setSelectedId(0);
    setForm(emptyPage);
  }

  function handleSelect(itemId: number) {
    setSelectedId(itemId);
  }

  async function handleSave() {
    if (!token) return;
    try {
      const response = await adminSavePage(token, form);
      const nextSelectedId = form.id || response.id || 0;
      await loadPages(nextSelectedId);
      window.alert('Berhasil menyimpan halaman.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan halaman.');
    }
  }

  async function handleDelete() {
    if (!token || !form.id) return;
    const confirmed = window.confirm(`Hapus halaman "${form.title}"?`);
    if (!confirmed) return;

    try {
      await adminDeletePage(token, form.id);
      setSelectedId(0);
      setForm(emptyPage);
      await loadPages(0);
      window.alert('Halaman berhasil dihapus.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menghapus halaman.');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Halaman</p>
            <h1 className="mt-2 font-display text-4xl text-white">Konten statis</h1>
          </div>
          <button
            type="button"
            onClick={handleCreate}
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
            placeholder="Cari judul atau slug halaman"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>

        <div className="mt-6 space-y-3">
          {paginatedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                selectedId === item.id
                  ? 'border-emerald-400 bg-emerald-500/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm text-slate-400">/{item.slug}</p>
            </button>
          ))}
          {!paginatedItems.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
              {searchQuery ? 'Tidak ada halaman yang cocok dengan pencarian.' : 'Belum ada halaman.'}
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
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Judul halaman"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            placeholder="Slug"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            value={form.desc || ''}
            onChange={(event) => setForm((current) => ({ ...current, desc: event.target.value }))}
            placeholder="Deskripsi singkat"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring md:col-span-2"
          />
          <input
            value={form.template}
            onChange={(event) => setForm((current) => ({ ...current, template: event.target.value }))}
            placeholder="Template"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            value={form.date}
            onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
            placeholder="Tanggal"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
        </div>

        <div className="mt-4">
          <AdminRichTextEditor
            label="Konten halaman"
            value={form.content}
            onChange={(content) => setForm((current) => ({ ...current, content }))}
            placeholder="Tulis konten halaman"
            minHeightClassName="min-h-[28rem]"
          />
        </div>

        <div className="mt-4">
          <AdminUploadField
            label="Upload gambar untuk halaman"
            target="pages"
            accept="image/*"
            helpText="File akan disimpan ke folder uploads/pages. URL hasil upload otomatis disisipkan ke konten HTML."
            onUploaded={(result) =>
              setForm((current) => ({
                ...current,
                content: `${current.content}\n<img src="${result.fileUrl}" alt="${result.originalName}" />\n`,
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
            Simpan Halaman
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
