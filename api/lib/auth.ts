import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export type AdminSessionUser = {
  id: number;
  username: string;
  fullname: string | null;
  email: string;
  role: string;
  access: string;
};

export const ALL_ADMIN_MODULES = [
  'dashboard',
  'pages',
  'news',
  'arsip',
  'users',
  'settings',
] as const;

export type AdminModuleKey = (typeof ALL_ADMIN_MODULES)[number];

export function normalizePasswordHash(hash: string): string {
  return hash.startsWith('$2y$') ? `$2a$${hash.slice(4)}` : hash;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, normalizePasswordHash(hash));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function parseAdminAccess(access: string | null | undefined): AdminModuleKey[] {
  const raw = (access || '').trim().toLowerCase();

  if (!raw || raw === 'all' || raw === '*') {
    return [...ALL_ADMIN_MODULES];
  }

  const modules = raw
    .split(/[,\s|;]+/)
    .map((item) => item.trim())
    .filter((item): item is AdminModuleKey =>
      (ALL_ADMIN_MODULES as readonly string[]).includes(item),
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

export function hasAdminAccess(
  access: string | null | undefined,
  module: AdminModuleKey,
): boolean {
  return parseAdminAccess(access).includes(module);
}
