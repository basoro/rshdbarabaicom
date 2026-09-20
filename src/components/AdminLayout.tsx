import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, LayoutDashboard, LogOut, Newspaper, Settings, Shield, Users } from 'lucide-react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('rshd-admin-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const { initialized, initialize, loading, token, user, logout } = useAdminStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    try {
      window.localStorage.setItem('rshd-admin-sidebar-collapsed', String(sidebarCollapsed));
    } catch {
      // Ignore storage errors (for example, private browsing restrictions).
    }
  }, [sidebarCollapsed]);

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
      <div
        className={`grid min-h-screen transition-[grid-template-columns] duration-300 ${
          sidebarCollapsed ? 'lg:grid-cols-[88px_1fr]' : 'lg:grid-cols-[280px_1fr]'
        }`}
      >
        <aside className={`border-r border-white/10 bg-slate-900 px-4 py-8 transition-all duration-300 ${sidebarCollapsed ? 'lg:px-3' : 'lg:px-6'}`}>
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <Link
              to="/"
              title="Buka situs publik"
              className={`flex items-center rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10 ${sidebarCollapsed ? 'h-12 w-12 justify-center' : 'gap-3 px-4 py-3'}`}
            >
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">CMS</span>
              {!sidebarCollapsed ? <span className="font-display text-2xl text-white">RSHD</span> : null}
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              title={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
              aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white ${sidebarCollapsed ? 'hidden' : ''}`}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
          {!sidebarCollapsed ? (
            <p className="mt-3 px-1 text-xs leading-5 text-slate-400">Manajemen website dan konten rumah sakit</p>
          ) : null}
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              title="Buka sidebar"
              aria-label="Buka sidebar"
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}

          <nav className="mt-8 space-y-2">
            {visibleLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-2xl py-3 text-sm font-medium transition ${sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-4'} ${
                      isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed ? <span>{item.label}</span> : null}
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
