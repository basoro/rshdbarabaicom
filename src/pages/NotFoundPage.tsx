import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container py-24">
      <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-lg shadow-slate-200/50">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">404</p>
        <h1 className="mt-4 font-display text-6xl text-slate-900">Halaman tidak ditemukan</h1>
        <p className="mt-4 text-slate-600">
          Rute yang Anda buka tidak tersedia pada hasil migrasi ini.
        </p>
        <Link to="/" className="mt-8 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
