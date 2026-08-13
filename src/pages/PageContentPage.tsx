import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RichHtml from '@/components/RichHtml';
import { getPage } from '@/lib/api';
import type { PageItem } from '@/types';

export default function PageContentPage() {
  const { slug = '' } = useParams();
  const [page, setPage] = useState<PageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPage(slug)
      .then(setPage)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="container py-24 text-lg text-slate-600">Memuat halaman...</div>;
  }

  if (error || !page) {
    return (
      <div className="container py-24">
        <div className="rounded-[2.5rem] bg-white p-10 shadow-lg shadow-slate-200/50">
          <p className="text-sm uppercase tracking-[0.35em] text-rose-600">Halaman Tidak Ditemukan</p>
          <h1 className="mt-4 font-display text-5xl text-slate-900">
            Konten untuk slug `{slug}` belum tersedia.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">{error}</p>
          <Link to="/" className="mt-8 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <section className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/50 md:p-12">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">Halaman</p>
        <h1 className="mt-4 font-display text-5xl text-slate-900">{page.title}</h1>
        {page.desc ? <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{page.desc}</p> : null}
        <RichHtml html={page.content} className="mt-10" />
      </section>
    </div>
  );
}
