import { useEffect, useMemo, useState } from 'react';
import { adminDashboard } from '@/lib/api';
import type { DashboardMonthPostStat } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import DashboardBarChart from '@/components/DashboardBarChart';
import DashboardLineChart from '@/components/DashboardLineChart';

export default function AdminDashboardPage() {
  const token = useAdminStore((state) => state.token);
  const [cards, setCards] = useState<Array<{ label: string; value: number }>>([]);
  const [newsByUser, setNewsByUser] = useState<Array<{ label: string; total: number; user_id: number }>>([]);
  const [newsByMonth, setNewsByMonth] = useState<DashboardMonthPostStat[]>([]);
  const [visitsByMonth, setVisitsByMonth] = useState<DashboardMonthPostStat[]>([]);

  useEffect(() => {
    if (!token) return;
    adminDashboard(token).then((response) => {
      setCards(response.cards ?? []);
      setNewsByUser(response.newsByUser ?? []);
      setNewsByMonth(response.newsByMonth ?? []);
      setVisitsByMonth(response.visitsByMonth ?? []);
    });
  }, [token]);

  const barItems = useMemo(
    () => newsByUser.map((item) => ({ label: item.label, value: item.total })),
    [newsByUser],
  );

  const newsLinePoints = useMemo(
    () => newsByMonth.map((item) => ({ label: item.label, value: item.total })),
    [newsByMonth],
  );

  const visitsLinePoints = useMemo(
    () => visitsByMonth.map((item) => ({ label: item.label, value: item.total })),
    [visitsByMonth],
  );

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Ringkasan</p>
        <h1 className="mt-3 font-display text-5xl text-white">Dashboard CMS</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Panel administrasi ini langsung terhubung ke `database.sdb` yang sama dengan frontend publik.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">{card.label}</p>
            <p className="mt-4 font-display text-5xl text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardBarChart
          title="Postingan per Pengguna"
          items={barItems}
          emptyText="Belum ada postingan berita untuk ditampilkan pada grafik ini."
          valueSuffix=" berita"
        />
        <DashboardLineChart
          title="Tren Postingan Bulanan"
          subtitle={`Tahun ${currentYear}: total berita yang dipublikasikan per bulan`}
          points={newsLinePoints}
          emptyText="Belum ada data postingan pada tahun ini."
          valueSuffix=" berita"
          variant="emerald"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardLineChart
          eyebrow="Analitik"
          title="Tren Kunjungan Website"
          subtitle={`Tahun ${currentYear}: total pageview yang tercatat per bulan`}
          points={visitsLinePoints}
          emptyText="Belum ada data kunjungan. Data otomatis terkumpul saat pengunjung membuka halaman publik."
          valueSuffix=" kunjungan"
          variant="cyan"
        />
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Ringkasan</p>
            <h2 className="mt-2 font-display text-3xl text-white">Kinerja Website</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Total Kunjungan</p>
              <p className="mt-3 font-display text-4xl text-white">
                {visitsByMonth.reduce((acc, row) => acc + row.total, 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Bulan Terbaik</p>
              <p className="mt-3 font-display text-4xl text-white">
                {visitsByMonth
                  .slice()
                  .sort((a, b) => b.total - a.total)[0]?.label || '-'}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {visitsByMonth.slice().sort((a, b) => b.total - a.total)[0]?.total ?? 0} kunjungan
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Rata-rata / Bulan</p>
              <p className="mt-3 font-display text-4xl text-white">
                {Math.round(
                  visitsByMonth.reduce((acc, row) => acc + row.total, 0) /
                    Math.max(visitsByMonth.filter((row) => row.total > 0).length, 1) || 0,
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Aktif Tracker</p>
              <p className="mt-3 font-display text-4xl text-white">Aktif</p>
              <p className="mt-1 text-sm text-slate-400">Auto-record di semua halaman publik</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
