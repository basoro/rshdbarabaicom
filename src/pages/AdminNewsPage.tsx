import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Plus, Save, Search, Trash2 } from 'lucide-react';
import AdminPagination from '@/components/AdminPagination';
import AdminRichTextEditor from '@/components/AdminRichTextEditor';
import AdminUploadField from '@/components/AdminUploadField';
import {
  adminDeleteNews,
  adminListNews,
  adminSaveNews,
} from '@/lib/api';
import { NEWS_COVER_FALLBACK, resolveNewsCoverUrl } from '@/lib/uploadPaths';
import { formatDate } from '@/lib/format';
import { useAdminStore } from '@/store/adminStore';
import type { NewsItem } from '@/types';

type NewsForm = Partial<NewsItem>;

const emptyNews: NewsForm = {
  id: 0,
  title: '',
  slug: '',
  intro: '',
  content: '',
  cover_photo: '',
  status: 2,
  comments: 1,
  markdown: 0,
  published_at: Math.floor(Date.now() / 1000),
};

function padTwo(value: number) {
  return String(value).padStart(2, '0');
}

/** Konversi unix timestamp (detik) -> value input datetime-local (waktu lokal browser). */
function toDatetimeLocalValue(timestamp?: number | null) {
  const seconds = Number(timestamp || 0);
  const date = seconds > 0 ? new Date(seconds * 1000) : new Date();
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}T${padTwo(
    date.getHours(),
  )}:${padTwo(date.getMinutes())}`;
}

/** Konversi value input datetime-local (dianggap waktu lokal) -> unix timestamp (detik). */
function fromDatetimeLocalValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return Math.floor(Date.now() / 1000);

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0,
  );

  if (Number.isNaN(date.getTime())) return Math.floor(Date.now() / 1000);
  return Math.floor(date.getTime() / 1000);
}

function buildNewsPayload(form: NewsForm) {
  return {
    id: form.id,
    title: (form.title || '').trim(),
    slug: (form.slug || '').trim(),
    intro: form.intro || '',
    content: form.content || '',
    cover_photo: form.cover_photo || '',
    status: Number(form.status ?? 2),
    comments: Number(form.comments ?? 1),
    markdown: Number(form.markdown ?? 0),
    published_at: Number(form.published_at || Math.floor(Date.now() / 1000)),
  };
}

export default function AdminNewsPage() {
  const token = useAdminStore((state) => state.token);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [form, setForm] = useState<NewsForm>(emptyNews);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  async function loadData(nextSelectedId?: number) {
    if (!token) return;
    const newsResponse = await adminListNews(token);
    setItems(newsResponse);

    const targetSelectedId = nextSelectedId ?? selectedId;
    if (!targetSelectedId && newsResponse.length) {
      setSelectedId(newsResponse[0].id);
      return;
    }

    if (targetSelectedId && newsResponse.some((item) => item.id === targetSelectedId)) {
      setSelectedId(targetSelectedId);
      return;
    }

    setSelectedId(0);
  }

  useEffect(() => {
    loadData();
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
  const previewCoverUrl = useMemo(
    () => resolveNewsCoverUrl(form.cover_photo, NEWS_COVER_FALLBACK),
    [form.cover_photo],
  );

  useEffect(() => {
    if (!selectedItem) {
      setForm(emptyNews);
      return;
    }

    setForm({
      ...selectedItem,
    });
  }, [selectedItem]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function handleCreate() {
    setSelectedId(0);
    setForm(emptyNews);
    setSaveError(null);
  }

  function handleSelect(itemId: number) {
    setSelectedId(itemId);
    setSaveError(null);
  }

  async function saveNews() {
    if (!token) return;
    const payload = buildNewsPayload(form);

    if (!payload.title) {
      setSaveError('Judul berita wajib diisi.');
      return;
    }

    if (!payload.content.trim()) {
      setSaveError('Konten berita wajib diisi.');
      return;
    }

    try {
      setSaveError(null);
      const response = await adminSaveNews(token, payload);
      const nextSelectedId = payload.id || response.id || 0;
      await loadData(nextSelectedId);
      window.alert('Berita berhasil disimpan.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan berita.';
      setSaveError(message);
      window.alert(message);
    }
  }

  async function deleteNews() {
    if (!token || !form.id) return;
    const confirmed = window.confirm(`Hapus berita "${form.title || 'tanpa judul'}"?`);
    if (!confirmed) return;

    try {
      await adminDeleteNews(token, form.id);
      setSelectedId(0);
      setForm(emptyNews);
      setSaveError(null);
      await loadData(0);
      window.alert('Berita berhasil dihapus.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menghapus berita.');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-[0.35em] text-emerald-700 dark:text-emerald-300">
              Berita
            </p>
            <h1 className="mt-2 font-display text-3xl text-slate-900 dark:text-white">Artikel</h1>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-2xl bg-emerald-600 p-3 text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari judul atau slug berita"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
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
                  : 'border-slate-200 bg-white hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
              }`}
            >
              <p className="font-semibold text-[14px] text-slate-900 dark:text-white">{item.title}</p>
              <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{formatDate(item.published_at)}</p>
            </button>
          ))}
          {!paginatedItems.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {searchQuery ? 'Tidak ada berita yang cocok dengan pencarian.' : 'Belum ada berita.'}
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

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.title || ''}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Judul berita"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white ring-emerald-500 focus:ring md:col-span-2"
          />
          <input
            value={form.slug || ''}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            placeholder="Slug"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white ring-emerald-500 focus:ring"
          />
          <input
            value={form.cover_photo || ''}
            onChange={(event) => setForm((current) => ({ ...current, cover_photo: event.target.value }))}
            placeholder="Nama file cover atau URL"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white ring-emerald-500 focus:ring"
          />
          <div className="rounded-[2rem] border border-slate-200 bg-slate-100 px-5 py-5 dark:border-white/10 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
                Preview cover
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sumber: kolom <span className="font-semibold text-slate-700 dark:text-slate-200">cover_photo</span>
              </span>
            </div>
            <div className="mt-4 flex items-start gap-4">
              <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900">
                <img
                  src={previewCoverUrl}
                  alt={form.title || 'Cover berita'}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src = NEWS_COVER_FALLBACK;
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                <p>
                  <span className="inline-flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                    Path cover
                  </span>
                </p>
                <p className="break-all rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {form.cover_photo || <span className="text-slate-500">(belum diisi — pakai fallback)</span>}
                </p>
                <p className="text-xs leading-5">
                  Nilai di kolom <span className="font-semibold text-slate-700 dark:text-slate-200">cover_photo</span> akan digabung
                  dengan <span className="font-semibold text-slate-700 dark:text-slate-200">IMAGE_URL</span> dan{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">IMAGE_PATH</span> dari file{' '}
                  <span className="font-semibold text-emerald-700 dark:text-emerald-200">.env</span>.
                </p>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <AdminRichTextEditor
              label="Intro berita"
              value={form.intro || ''}
              onChange={(intro) => setForm((current) => ({ ...current, intro }))}
              placeholder="Tulis intro berita"
              minHeightClassName="min-h-36"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="news-status"
              className="block text-sm font-semibold text-slate-900 dark:text-white"
            >
              Status
            </label>
            <select
              id="news-status"
              value={form.status ?? 2}
              onChange={(event) => setForm((current) => ({ ...current, status: Number(event.target.value) }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white ring-emerald-500 focus:ring"
            >
              <option value={1}>Draft</option>
              <option value={2}>Publikasi</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="news-published-at"
              className="block text-sm font-semibold text-slate-900 dark:text-white"
            >
              Tanggal Rilis / Publikasi
            </label>
            <input
              id="news-published-at"
              type="datetime-local"
              value={toDatetimeLocalValue(form.published_at)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  published_at: fromDatetimeLocalValue(event.target.value),
                }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white ring-emerald-500 focus:ring"
            />
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Menentukan kapan berita mulai tayang di halaman publik — terpisah dari kapan data ini diinput.
              Tanggal mendatang akan tayang otomatis saat waktunya tiba.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <AdminRichTextEditor
            label="Konten berita"
            value={form.content || ''}
            onChange={(content) => setForm((current) => ({ ...current, content }))}
            placeholder="Tulis konten berita"
            minHeightClassName="min-h-[30rem]"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminUploadField
            label="Upload cover berita"
            target="news"
            accept="image/*"
            helpText="Gambar akan disimpan ke folder api/public/media/local/news dan path-nya otomatis diisi ke cover."
            onUploaded={(result) =>
              setForm((current) => ({
                ...current,
                cover_photo: result.filePath.split('/').pop() || result.filePath,
              }))
            }
          />
          <AdminUploadField
            label="Upload gambar isi berita"
            target="news"
            accept="image/*"
            helpText="Tag gambar akan otomatis disisipkan ke konten HTML berita."
            onUploaded={(result) =>
              setForm((current) => ({
                ...current,
                content: `${current.content || ''}\n<img src="${result.fileUrl}" alt="${result.originalName}" />\n`,
              }))
            }
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {saveError ? (
            <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100">
              {saveError}
            </div>
          ) : null}
          <button
            type="button"
            onClick={saveNews}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
          >
            <Save className="h-4 w-4" />
            Simpan Berita
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={deleteNews}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 px-5 py-3 text-sm font-semibold text-rose-600 dark:border-rose-400/30 dark:text-rose-200"
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
