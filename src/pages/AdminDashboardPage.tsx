import { useEffect, useMemo, useState } from 'react';
import { adminDashboard } from '@/lib/api';
import type { DashboardMonthPostStat, DashboardUserPostStat } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import DashboardBarChart from '@/components/DashboardBarChart';
import DashboardLineChart from '@/components/DashboardLineChart';

export default function AdminDashboardPage() {
  const token = useAdminStore((state) => state.token);
  const [cards, setCards] = useState<Array<{ label: string; value: number }>>([]);
  const [newsByUser, setNewsByUser] = useState<DashboardUserPostStat[]>([]);
  const [newsByMonth, setNewsByMonth] = useState<DashboardMonthPostStat[]>([]);

  useEffect(() => {
    if (!token) return;
    adminDashboard(token).then((response) => {
      setCards(response.cards ?? []);
      setNewsByUser(response.newsByUser ?? []);
      setNewsByMonth(response.newsByMonth ?? []);
    });
  }, [token]);

  const barItems = useMemo(
    () => newsByUser.map((item) => ({ label: item.label, value: item.total })),
    [newsByUser],
  );

  const linePoints = useMemo(
    () => newsByMonth.map((item) => ({ label: item.label, value: item.total })),
    [newsByMonth],
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
          points={linePoints}
          emptyText="Belum ada data postingan pada tahun ini."
          valueSuffix=" berita"
        />
      </div>
    </div>
  );
}
