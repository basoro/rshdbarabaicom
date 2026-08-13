import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { useSiteStore } from '@/store/siteStore';

export default function PublicLayout() {
  const { bootstrap, error, loading, loadBootstrap } = useSiteStore();

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  if (loading && !bootstrap) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="rounded-3xl border border-emerald-100 bg-white px-8 py-6 text-center shadow-lg shadow-slate-200/60">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">Memuat Situs</p>
          <h1 className="mt-4 font-display text-4xl text-slate-900">RSHD Barabai</h1>
        </div>
      </div>
    );
  }

  if (error || !bootstrap) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <div className="max-w-xl rounded-[2rem] border border-rose-100 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
          <p className="text-sm uppercase tracking-[0.35em] text-rose-600">Gagal Memuat</p>
          <h1 className="mt-4 font-display text-4xl text-slate-900">Data situs belum tersedia</h1>
          <p className="mt-4 text-slate-600">{error || 'Terjadi kendala saat mengambil data dari SQLite.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader
        menu={bootstrap.menu}
        siteName={bootstrap.settings.nama_instansi || 'RSUD H. Damanhuri'}
      />
      <main>
        <Outlet />
      </main>
      <SiteFooter bootstrap={bootstrap} />
    </div>
  );
}
