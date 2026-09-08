import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApamStore } from '@/store/apamStore';

export default function ApamGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, initialized, initialize } = useApamStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && !token) {
      navigate('/apam/login', {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [initialized, token, navigate, location]);

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="mt-4 text-sm text-slate-500">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <Outlet />;
}
