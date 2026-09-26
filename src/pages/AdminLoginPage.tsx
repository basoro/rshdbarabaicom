import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminStore = useAdminStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await adminStore.login(username, password);
      const destination = (location.state as { from?: string } | undefined)?.from || '/admin';
      navigate(destination, { replace: true });
    } catch (error) {
      void error;
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-emerald-950/20 backdrop-blur">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-emerald-600">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.35em] text-emerald-300 text-center">CMS RSHD</p>
        <h1 className="mt-4 font-display text-4xl text-center text-white">Masuk Admin</h1>
        {/* <p className="mt-3 text-sm leading-7 text-slate-300">
          Login menggunakan akun pada tabel `mlite_users` untuk mengelola website dan konten.
        </p> */}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none ring-emerald-500 transition focus:ring"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none ring-emerald-500 transition focus:ring"
          />
          {adminStore.error ? <p className="text-sm text-rose-300">{adminStore.error}</p> : null}
          <button
            type="submit"
            disabled={adminStore.loading}
            className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adminStore.loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
