import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Eye, User } from 'lucide-react';
import RichHtml from '@/components/RichHtml';
import SectionHeading from '@/components/SectionHeading';
import { getNewsDetail, incrementNewsViews } from '@/lib/api';
import { formatDate, truncateHtml } from '@/lib/format';
import type { NewsItem } from '@/types';

export default function NewsDetailPage() {
  const { slug = '' } = useParams();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [related, setRelated] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getNewsDetail(slug)
      .then((response) => {
        setItem(response.item);
        setRelated(response.related);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    incrementNewsViews(slug).then((response) => {
      setItem((current) => (current ? { ...current, views: response.views } : current));
    }).catch(() => {});
  }, [slug]);

  if (loading) {
    return <div className="container py-24 text-lg text-slate-600">Memuat detail berita...</div>;
  }

  if (error || !item) {
    return (
      <div className="container py-24">
        <div className="rounded-[2.5rem] bg-white p-10 shadow-lg shadow-slate-200/50">
          <p className="text-sm uppercase tracking-[0.35em] text-rose-600">Berita Tidak Ditemukan</p>
          <h1 className="mt-4 font-display text-5xl text-slate-900">Artikel belum tersedia.</h1>
          <p className="mt-4 max-w-2xl text-slate-600">{error}</p>
          <Link to="/news" className="mt-8 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">
            Kembali ke daftar berita
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <article className="overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50">
        <img src={item.cover_url} alt={item.title} className="h-[24rem] w-full object-cover md:h-[32rem]" />
        <div className="p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-700" />
              {formatDate(item.published_at)}
            </span>
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-700" />
              {item.author.name}
            </span>
            <span className="inline-flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-700" />
              {(item.views ?? 0).toLocaleString('id-ID')} dibaca
            </span>
          </div>
          <h1 className="mt-6 font-display text-5xl leading-tight text-slate-900">{item.title}</h1>
          {item.intro ? (
            <div className="mt-8 rounded-[2rem] bg-emerald-50 p-6 text-lg leading-8 text-emerald-950">
              {truncateHtml(item.intro, 280)}
            </div>
          ) : null}
          <RichHtml html={item.content} className="mt-10" />
        </div>
      </article>

      {related.length ? (
        <section className="mt-16">
          <SectionHeading eyebrow="Artikel Terkait" title="Baca juga berita lainnya" />
          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            {related.map((article) => (
              <article key={article.id} className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/50">
                <img src={article.cover_url} alt={article.title} className="h-56 w-full rounded-[1.5rem] object-cover" />
                <h3 className="mt-5 font-display text-3xl text-slate-900">{article.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{truncateHtml(article.intro || article.content, 140)}</p>
                <Link to={`/news/${article.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  Baca Detail
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
