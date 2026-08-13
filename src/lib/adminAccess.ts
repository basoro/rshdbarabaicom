export const ADMIN_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pages', label: 'Halaman' },
  { key: 'news', label: 'Berita' },
  { key: 'arsip', label: 'Arsip' },
  { key: 'users', label: 'Pengguna' },
  { key: 'settings', label: 'Pengaturan' },
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULES)[number]['key'];

export function parseAdminAccess(access: string | null | undefined): AdminModuleKey[] {
  const raw = (access || '').trim().toLowerCase();

  if (!raw || raw === 'all' || raw === '*') {
    return ADMIN_MODULES.map((item) => item.key);
  }

  const modules = raw
    .split(/[,\s|;]+/)
    .map((item) => item.trim())
    .filter((item): item is AdminModuleKey =>
      ADMIN_MODULES.some((module) => module.key === item),
    );

  if (!modules.length) {
    return ['dashboard'];
  }

  if (!modules.includes('dashboard')) {
    modules.unshift('dashboard');
  }

  return Array.from(new Set(modules));
}

export function serializeAdminAccess(modules: readonly AdminModuleKey[]): string {
  return Array.from(new Set(['dashboard', ...modules])).join(',');
}

export function canAccessAdminModule(access: string | null | undefined, module: AdminModuleKey) {
  return parseAdminAccess(access).includes(module);
}
