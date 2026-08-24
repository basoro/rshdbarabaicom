import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, ArrowRight, Eye } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { getNewsList } from '@/lib/api';
import { formatDate, truncateHtml } from '@/lib/format';
import type { NewsItem } from '@/types';

export default function NewsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page') || '1');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNewsList(currentPage)
      .then((response) => {
        setItems(response.items);
        setPagination(response.pagination);
      })
      .finally(() => setLoading(false));
  }, [currentPage]);

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Berita dan Informasi"
        title="Berita, informasi, dan artikel terkini"
        description="Semua artikel dibaca langsung dari SQLite sehingga publikasi yang dilakukan lewat CMS admin akan muncul di sini."
      />

      {loading ? (
        <div className="mt-10 text-slate-600">Memuat berita...</div>
      ) : (
        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {items.map((article) => (
            <article key={article.id} className="overflow-hidden rounded-[2rem] bg-white shadow-lg shadow-slate-200/50">
              <img src={article.cover_url} alt={article.title} className="h-64 w-full object-cover" />
              <div className="p-7">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-emerald-700" />
                    {formatDate(article.published_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-emerald-700" />
                    {(article.views ?? 0).toLocaleString('id-ID')} dibaca
                  </span>
                </div>
                <h3 className="mt-4 font-display text-3xl leading-tight text-slate-900">{article.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {truncateHtml(article.intro || article.content, 180)}
                </p>
                <Link to={`/news/${article.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  Baca Selengkapnya
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => setSearchParams({ page: String(Math.max(pagination.page - 1, 1)) })}
          className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <span className="text-sm text-slate-600">
          Halaman {pagination.page} dari {pagination.totalPages}
        </span>
        <button
          type="button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => setSearchParams({ page: String(Math.min(pagination.page + 1, pagination.totalPages)) })}
          className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
