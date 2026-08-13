import { useEffect, useMemo } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, LogOut, Newspaper, Settings, Shield, Users } from 'lucide-react';
import { canAccessAdminModule, type AdminModuleKey } from '@/lib/adminAccess';
import { useAdminStore } from '@/store/adminStore';

const adminLinks: Array<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  module: AdminModuleKey;
}> = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { to: '/admin/pages', label: 'Halaman', icon: FileText, module: 'pages' },
  { to: '/admin/news', label: 'Berita', icon: Newspaper, module: 'news' },
  { to: '/admin/arsip', label: 'Arsip', icon: Shield, module: 'arsip' },
  { to: '/admin/users', label: 'Pengguna', icon: Users, module: 'users' },
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings, module: 'settings' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { initialized, initialize, loading, token, user, logout } = useAdminStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const visibleLinks = useMemo(
    () =>
      adminLinks.filter((item) =>
        canAccessAdminModule(user?.access || 'dashboard', item.module),
      ),
    [user?.access],
  );
  const currentLink = adminLinks.find((item) =>
    item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to),
  );

  if (!initialized || loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">CMS RSHD</p>
          <h1 className="mt-4 font-display text-4xl">Memuat panel admin</h1>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (currentLink && !canAccessAdminModule(user.access, currentLink.module)) {
    return <Navigate to={visibleLinks[0]?.to || '/admin'} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-slate-900 px-6 py-8">
          <Link to="/" className="block rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">CMS</p>
            <h1 className="mt-3 font-display text-4xl text-white">RSHD</h1>
            <p className="mt-2 text-sm text-slate-400">Manajemen website dan konten rumah sakit</p>
          </Link>

          <nav className="mt-8 space-y-2">
            {visibleLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-white/10 bg-slate-950/80 px-6 py-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Administrator</p>
                <h2 className="mt-2 font-display text-4xl text-white">
                  {user.fullname || user.username}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </header>

          <main className="flex-1 px-6 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
