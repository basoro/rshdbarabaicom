import { useCallback, useState } from 'react';
import { useApamStore } from '@/store/apamStore';

/* ════════════════════════════════════════════════════════════════════ */
/*                         TYPES                                       */
/* ════════════════════════════════════════════════════════════════════ */

type ActionDef = {
  id: string;
  label: string;
  group: string;
  fields: Array<{ name: string; label: string; type?: string; required?: boolean; placeholder?: string }>;
};

/* ════════════════════════════════════════════════════════════════════ */
/*                      ACTION DEFINITIONS                             */
/* ════════════════════════════════════════════════════════════════════ */

const ACTIONS: ActionDef[] = [
  /* ─── Auth ─── */
  { id: 'signin', label: 'Sign In', group: 'Auth', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true, placeholder: '000001' },
    { name: 'no_ktp', label: 'No. KTP', required: true, placeholder: '6301010101010001' },
  ]},
  { id: 'register', label: 'Register', group: 'Auth', fields: [
    { name: 'nama_lengkap', label: 'Nama Lengkap', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'nomor_ktp', label: 'No. KTP', required: true },
    { name: 'nomor_telepon', label: 'No. Telepon', required: true },
  ]},
  { id: 'postregister', label: 'Post Register', group: 'Auth', fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
  ]},
  { id: 'saveregister', label: 'Save Register', group: 'Auth', fields: [
    { name: 'nm_pasien', label: 'Nama Pasien', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'no_ktp', label: 'No. KTP', required: true },
    { name: 'no_tlp', label: 'No. Telepon', required: true },
    { name: 'jk', label: 'JK (L/P)', required: true, placeholder: 'L atau P' },
    { name: 'tgl_lahir', label: 'Tgl Lahir', type: 'date', required: true },
    { name: 'alamat', label: 'Alamat', required: true },
  ]},
  { id: 'profil', label: 'Profil', group: 'Auth', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},

  /* ─── Notifikasi ─── */
  { id: 'notifikasi', label: 'Notifikasi', group: 'Notifikasi', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'notifikasilist', label: 'Daftar Notifikasi', group: 'Notifikasi', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'tandaisudahdibaca', label: 'Tandai Dibaca', group: 'Notifikasi', fields: [
    { name: 'id', label: 'ID Notifikasi', required: true },
  ]},
  { id: 'notifbooking', label: 'Notif Booking', group: 'Notifikasi', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},

  /* ─── Booking ─── */
  { id: 'booking', label: 'Daftar Booking', group: 'Booking', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'bookingdetail', label: 'Detail Booking', group: 'Booking', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
    { name: 'tanggal_periksa', label: 'Tgl Periksa', type: 'date', required: true },
    { name: 'no_reg', label: 'No. Reg', required: true, placeholder: '001' },
  ]},
  { id: 'daftar', label: 'Daftar Periksa', group: 'Booking', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
    { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
    { name: 'kd_poli', label: 'Kode Poli', required: true },
    { name: 'kd_dokter', label: 'Kode Dokter', required: true },
    { name: 'kd_pj', label: 'Kode PJ', required: true },
  ]},
  { id: 'sukses', label: 'Status Sukses', group: 'Booking', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'lastbooking', label: 'Last Booking', group: 'Booking', fields: [] },

  /* ─── Riwayat ─── */
  { id: 'riwayat', label: 'Riwayat Ralan', group: 'Riwayat', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'riwayatdetail', label: 'Detail Riwayat', group: 'Riwayat', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
    { name: 'tgl_registrasi', label: 'Tgl Registrasi', type: 'date', required: true },
    { name: 'no_reg', label: 'No. Reg', required: true },
  ]},
  { id: 'riwayatranap', label: 'Riwayat Ranap', group: 'Riwayat', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'riwayatranapdetail', label: 'Detail Riwayat Ranap', group: 'Riwayat', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
    { name: 'tgl_registrasi', label: 'Tgl Registrasi', type: 'date', required: true },
    { name: 'no_reg', label: 'No. Reg', required: true },
  ]},

  /* ─── Jadwal ─── */
  { id: 'dokter', label: 'Jadwal Dokter', group: 'Jadwal', fields: [
    { name: 'tanggal', label: 'Tanggal', type: 'date' },
  ]},
  { id: 'jadwalklinik', label: 'Jadwal Klinik', group: 'Jadwal', fields: [
    { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
  ]},
  { id: 'jadwaldokter', label: 'Jadwal Dokter per Poli', group: 'Jadwal', fields: [
    { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
    { name: 'kd_poli', label: 'Kode Poli', required: true },
  ]},

  /* ─── Layanan ─── */
  { id: 'kamar', label: 'Ketersediaan Kamar', group: 'Layanan', fields: [] },
  { id: 'rawatjalan', label: 'Rawat Jalan', group: 'Layanan', fields: [] },
  { id: 'rawatinap', label: 'Rawat Inap', group: 'Layanan', fields: [] },
  { id: 'laboratorium', label: 'Laboratorium', group: 'Layanan', fields: [] },
  { id: 'radiologi', label: 'Radiologi', group: 'Layanan', fields: [] },
  { id: 'carabayar', label: 'Cara Bayar', group: 'Layanan', fields: [] },

  /* ─── Billing ─── */
  { id: 'billing', label: 'Billing', group: 'Billing', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'hitungralan', label: 'Hitung Ralan', group: 'Billing', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'hitungranap', label: 'Hitung Ranap', group: 'Billing', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},

  /* ─── Pengaduan ─── */
  { id: 'pengaduan', label: 'Daftar Pengaduan', group: 'Pengaduan', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
  { id: 'pengaduandetail', label: 'Detail Pengaduan', group: 'Pengaduan', fields: [
    { name: 'pengaduan_id', label: 'ID Pengaduan', required: true },
  ]},
  { id: 'simpanpengaduan', label: 'Simpan Pengaduan', group: 'Pengaduan', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
    { name: 'message', label: 'Pesan', required: true },
  ]},
  { id: 'simpanpengaduandetail', label: 'Simpan Detail', group: 'Pengaduan', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
    { name: 'message', label: 'Pesan', required: true },
    { name: 'pengaduan_id', label: 'ID Pengaduan', required: true },
  ]},

  /* ─── Telemedicine ─── */
  { id: 'telemedicine', label: 'Jadwal Telemedicine', group: 'Telemedicine', fields: [
    { name: 'tanggal', label: 'Tanggal', type: 'date' },
  ]},
  { id: 'telemedicinedaftar', label: 'Daftar Telemedicine', group: 'Telemedicine', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
    { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
    { name: 'kd_poli', label: 'Kode Poli', required: true },
    { name: 'kd_dokter', label: 'Kode Dokter', required: true },
  ]},
  { id: 'telemedicinesukses', label: 'Status Telemedicine', group: 'Telemedicine', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},

  /* ─── News ─── */
  { id: 'lastnews', label: 'Berita Terbaru', group: 'Berita', fields: [] },
  { id: 'news', label: 'Semua Berita', group: 'Berita', fields: [] },
  { id: 'newsdetail', label: 'Detail Berita', group: 'Berita', fields: [
    { name: 'id', label: 'ID Berita', required: true },
  ]},
  { id: 'layananunggulan', label: 'Layanan Unggulan', group: 'Berita', fields: [] },

  /* ─── Lainnya ─── */
  { id: 'cekrujukan', label: 'Cek Rujukan', group: 'Lainnya', fields: [] },
  { id: 'antrian', label: 'Cek Antrian', group: 'Lainnya', fields: [] },
  { id: 'simpanretensirekammedik', label: 'Simpan Retensi', group: 'Lainnya', fields: [
    { name: 'no_rkm_medis', label: 'No. RM', required: true },
  ]},
];

const GROUPS = [...new Set(ACTIONS.map((a) => a.group))];

/* ════════════════════════════════════════════════════════════════════ */
/*                         COMPONENT                                   */
/* ════════════════════════════════════════════════════════════════════ */

export default function ApamPage() {
  const [token, setToken] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('signin');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, logout } = useApamStore();

  const actionDef = ACTIONS.find((a) => a.id === selectedAction);

  const handleActionChange = useCallback((id: string) => {
    setSelectedAction(id);
    setFields({});
    setResponse('');
    setError('');
  }, []);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!token.trim()) {
      setError('Token API wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const body = {
        token: token.trim(),
        action: selectedAction,
        ...fields,
      };

      const res = await fetch('/api/apam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let formatted: string;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        formatted = text;
      }

      setResponse(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [token, selectedAction, fields]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-emerald-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-teal-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">RSUD H. Damanhuri</p>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">APAM API</h1>
          <p className="mt-4 text-lg text-emerald-100/80">
            Akses API pendaftaran, booking, riwayat, dan layanan rumah sakit
          </p>
          {user && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-800/50 px-5 py-2 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-emerald-100">
                {user.fullname || user.username}
              </span>
              <button
                onClick={logout}
                className="ml-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* ─── Sidebar: Action List ─── */}
          <aside className="space-y-6">
            {/* Token Input */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700">
                API Token <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Masukkan token API"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            {/* Action Groups */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Pilih Action
              </h3>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                {GROUPS.map((group) => (
                  <div key={group}>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {ACTIONS.filter((a) => a.group === group).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => handleActionChange(a.id)}
                          className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                            selectedAction === a.id
                              ? 'bg-emerald-50 font-medium text-emerald-700'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ─── Main Panel ─── */}
          <div className="space-y-6">
            {/* Current Action */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                  {actionDef?.fields.length ?? 0}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {actionDef?.label ?? selectedAction}
                  </h2>
                  <p className="text-xs text-slate-400">action: {selectedAction}</p>
                </div>
              </div>

              {actionDef && actionDef.fields.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {actionDef.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-slate-600">
                        {field.label}
                        {field.required && <span className="ml-0.5 text-rose-500">*</span>}
                      </label>
                      <input
                        type={field.type || 'text'}
                        value={fields[field.name] ?? ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                  ))}
                </div>
              )}

              {actionDef && actionDef.fields.length === 0 && (
                <p className="rounded-xl bg-slate-50 py-4 text-center text-sm text-slate-500">
                  Action ini tidak memerlukan parameter.
                </p>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 hover:shadow-emerald-600/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A1.5 1.5 0 001.935 4.5H12" />
                      </svg>
                      Kirim Request
                    </>
                  )}
                </button>
                <span className="text-xs text-slate-400">POST /api/apam</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <p className="font-semibold">Error</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {/* Response */}
            {response && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
                  <h3 className="text-sm font-semibold text-slate-700">Response</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(response)}
                    className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                  >
                    Salin
                  </button>
                </div>
                <pre className="max-h-[500px] overflow-auto p-6 font-mono text-xs leading-relaxed text-slate-700">
                  {response}
                </pre>
              </div>
            )}

            {/* Quick Reference */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-700">Cara Penggunaan</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <strong>Method:</strong> <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">POST</code>
                </p>
                <p>
                  <strong>URL:</strong> <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">/api/apam</code>
                </p>
                <p>
                  <strong>Content-Type:</strong>{' '}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">application/json</code>
                </p>
                <p className="mt-3">
                  <strong>Contoh request body:</strong>
                </p>
                <pre className="rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-600">
{`{
  "token": "your-api-token",
  "action": "signin",
  "no_rkm_medis": "000001",
  "no_ktp": "6301010101010001"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
