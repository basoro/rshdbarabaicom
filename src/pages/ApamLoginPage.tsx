import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useApamStore } from '@/store/apamStore';

export default function ApamLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, initialized, initialize } = useApamStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  // If already logged in, redirect
  useEffect(() => {
    if (initialized && useApamStore.getState().token) {
      const destination = (location.state as { from?: string } | undefined)?.from || '/apam';
      navigate(destination, { replace: true });
    }
  }, [initialized, navigate, location]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login(username, password);
      const destination = (location.state as { from?: string } | undefined)?.from || '/apam';
      navigate(destination, { replace: true });
    } catch {
      // error is set in the store
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950 px-6">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-emerald-950/20 backdrop-blur">
        <div className="grid h-16 w-16 place-items-center rounded-[1.5rem] bg-emerald-600">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.35em] text-emerald-300">RSUD H. Damanhuri</p>
        <h1 className="mt-4 font-display text-5xl">APAM Login</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Masuk untuk mengakses API pendaftaran, booking, dan layanan rumah sakit.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            autoFocus
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none ring-emerald-500 transition focus:ring"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none ring-emerald-500 transition focus:ring"
          />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
