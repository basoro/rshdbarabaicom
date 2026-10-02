import { useEffect, useState } from 'react';
import { ArrowRight, Search, Stethoscope } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import DoctorAvatar from '@/components/DoctorAvatar';
import { getDoctors } from '@/lib/api';
import type { DoctorItem } from '@/types';

export default function DoctorPage() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDoctors()
      .then((response) => setDoctors(response.items))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredDoctors = doctors.filter((doctor) => {
    if (!normalizedQuery) return true;
    return `${doctor.name} ${doctor.specialty}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden bg-[#0f5f4f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.16),transparent_30%),linear-gradient(120deg,#0f5f4f,#0b3f39)]" />
        <div className="container relative py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-emerald-100">
              <Stethoscope className="h-4 w-4" />
              Tim Medis RSHD
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-tight md:text-5xl">
              Temukan dokter yang tepat untuk kebutuhan kesehatan Anda.
            </h1>
          </div>
        </div>
      </section>

      <section className="container relative z-10 -mt-7">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Profil Dokter</p>
            <p className="mt-2 text-sm text-slate-500">
              {loading ? 'Memuat data dokter...' : `${doctors.length} dokter aktif tersedia`}
            </p>
          </div>
          <label className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:max-w-sm">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau spesialisasi"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>
      </section>

      <section className="container mt-14">
        <SectionHeading
          eyebrow="Tenaga Medis Profesional"
          title="Dokter RSHD Barabai"
          description="Kenali dokter dan spesialisasi yang tersedia untuk mendukung pelayanan kesehatan Anda."
          centered
        />

        {loading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-[430px] animate-pulse rounded-[1.8rem] bg-slate-200" />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto mt-10 max-w-2xl rounded-[1.8rem] border border-amber-200 bg-amber-50 p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">Data belum tersedia</p>
            <p className="mt-3 text-sm leading-7 text-amber-900">
              Data dokter belum dapat dimuat dari server MySQL. Pastikan MYSQL_HOST, MYSQL_USER,
              MYSQL_PASSWORD, dan MYSQL_DATABASE sudah diisi di file .env.
            </p>
          </div>
        ) : !filteredDoctors.length ? (
          <div className="mx-auto mt-10 max-w-2xl rounded-[1.8rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Dokter tidak ditemukan</p>
            <p className="mt-2 text-sm text-slate-500">Coba gunakan kata kunci nama atau spesialisasi lain.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDoctors.map((doctor) => (
              <article
                key={doctor.code}
                className="group overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white shadow-sm shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/4.6] overflow-hidden bg-emerald-50">
                  <DoctorAvatar
                    name={doctor.name}
                    src={doctor.photo_url}
                    alt={`Foto ${doctor.name}`}
                    className="h-full w-full"
                    imageClassName="object-[center_15%] transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-5 pb-5 pt-12">
                    <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                      Dokter RSHD
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-700">
                    {doctor.specialty}
                  </p>
                  <h2 className="mt-3 min-h-[3.5rem] font-display text-2xl font-semibold leading-tight text-slate-900">
                    {doctor.name}
                  </h2>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>{doctor.gender === 'P' ? 'Perempuan' : doctor.gender === 'L' ? 'Laki-laki' : 'Tenaga medis'}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#b73567]">
                      Profil dokter
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
