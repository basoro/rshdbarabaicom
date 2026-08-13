import { useEffect, useMemo, useState } from 'react';
import { Copy, KeyRound, Plus, RefreshCw, Save, Trash2, Users } from 'lucide-react';
import AdminRichTextEditor from '@/components/AdminRichTextEditor';
import AdminUploadField from '@/components/AdminUploadField';
import { ADMIN_MODULES, parseAdminAccess, serializeAdminAccess } from '@/lib/adminAccess';
import { adminDeleteUser, adminListUsers, adminSaveUser } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import type { AdminUserItem } from '@/types';

type UserForm = AdminUserItem & {
  password?: string;
};

function getAvatarInitials(fullname?: string | null, username?: string | null) {
  const source = (fullname || username || '').trim();
  if (!source) return '';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

type UserAvatarProps = {
  avatar?: string | null;
  fullname?: string | null;
  username?: string | null;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

function UserAvatar({
  avatar,
  fullname,
  username,
  className = 'h-11 w-11 rounded-2xl',
  iconClassName = 'h-5 w-5',
  textClassName = 'text-sm font-semibold',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  const initials = getAvatarInitials(fullname, username);

  return (
    <div
      className={`grid place-items-center overflow-hidden bg-emerald-500/15 text-emerald-200 ${className}`}
    >
      {avatar && !imageError ? (
        <img
          src={avatar}
          alt={fullname || username || 'Avatar pengguna'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <span className={textClassName}>{initials}</span>
      ) : (
        <Users className={iconClassName} />
      )}
    </div>
  );
}

const emptyUser: UserForm = {
  id: 0,
  username: '',
  fullname: '',
  description: '',
  email: '',
  avatar: '',
  role: 'admin',
  cap: '',
  access: serializeAdminAccess(ADMIN_MODULES.map((item) => item.key)),
  password: '',
};

export default function AdminUsersPage() {
  const token = useAdminStore((state) => state.token);
  const currentUser = useAdminStore((state) => state.user);
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [form, setForm] = useState<UserForm>(emptyUser);
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'fallback'>('idle');

  async function loadUsers() {
    if (!token) return;
    const response = await adminListUsers(token);
    setItems(response);
    if (!selectedId && response.length) {
      setSelectedId(response[0].id);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedItem) {
      setForm(emptyUser);
      return;
    }

    setForm({
      ...selectedItem,
      password: '',
    });
  }, [selectedItem]);

  async function handleSave() {
    if (!token) return;
    try {
      await adminSaveUser(token, form);
      await loadUsers();
      window.alert('Pengguna berhasil disimpan.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan pengguna.');
    }
  }

  async function handleDelete() {
    if (!token || !form.id) return;
    const confirmed = window.confirm(`Hapus pengguna "${form.fullname || form.username}"?`);
    if (!confirmed) return;

    try {
      await adminDeleteUser(token, form.id);
      setSelectedId(0);
      setForm(emptyUser);
      await loadUsers();
      window.alert('Pengguna berhasil dihapus.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menghapus pengguna.');
    }
  }

  function generatePassword() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const password = Array.from({ length: 12 }, () =>
      characters[Math.floor(Math.random() * characters.length)],
    ).join('');
    setForm((current) => ({ ...current, password }));
    setCopyState('idle');
  }

  async function copyPassword() {
    if (!form.password) return;
    try {
      await navigator.clipboard.writeText(form.password);
      setCopyState('done');
    } catch {
      setCopyState('fallback');
      window.prompt('Salin password berikut secara manual:', form.password);
    }
    window.setTimeout(() => setCopyState('idle'), 1800);
  }

  const isCurrentUser = currentUser?.id === form.id;
  const selectedModules = parseAdminAccess(form.access);

  return (
    <div className="grid gap-6 2xl:grid-cols-[360px_1fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Pengguna</p>
            <h1 className="mt-2 font-display text-4xl text-white">Akun CMS</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(0);
              setForm(emptyUser);
            }}
            className="rounded-2xl bg-emerald-600 p-3 text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                selectedId === item.id
                  ? 'border-emerald-400 bg-emerald-500/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <UserAvatar
                  avatar={item.avatar}
                  fullname={item.fullname}
                  username={item.username}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {item.fullname || item.username}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-400">@{item.username}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-300">
                    {item.role}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="Username"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            value={form.fullname || ''}
            onChange={(event) => setForm((current) => ({ ...current, fullname: event.target.value }))}
            placeholder="Nama lengkap"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            type="password"
            value={form.password || ''}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder={form.id ? 'Password baru (opsional)' : 'Password'}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <input
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            placeholder="Role"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Reset password
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generatePassword}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Generate
              </button>
              <button
                type="button"
                onClick={copyPassword}
                disabled={!form.password}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40"
              >
                <Copy className="h-4 w-4" />
                {copyState === 'done'
                  ? 'Tersalin'
                  : copyState === 'fallback'
                    ? 'Salin manual'
                    : 'Copy'}
              </button>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-400">
              Password hanya diubah saat field password terisi lalu pengguna disimpan.
            </p>
          </div>
          <input
            value={form.cap || ''}
            onChange={(event) => setForm((current) => ({ ...current, cap: event.target.value }))}
            placeholder="Capability"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring md:col-span-2"
          />
          <input
            value={form.avatar}
            onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))}
            placeholder="URL avatar"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring md:col-span-2"
          />
        </div>

        <div className="mt-4 rounded-[2rem] border border-white/10 bg-slate-950/40 px-5 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Preview avatar
          </p>
          <div className="mt-4 flex items-center gap-4">
            <UserAvatar
              avatar={form.avatar}
              fullname={form.fullname}
              username={form.username}
              className="h-16 w-16 rounded-3xl"
              iconClassName="h-7 w-7"
              textClassName="text-lg font-semibold"
            />
            <div className="text-sm leading-6 text-slate-400">
              Placeholder otomatis dipakai jika URL avatar kosong atau gambar gagal dimuat.
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[2rem] border border-white/10 bg-slate-950/40 px-5 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Hak akses per modul
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Pilih menu yang boleh dibuka pengguna ini. Dashboard selalu aktif agar pengguna
            tetap bisa masuk ke panel admin.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {ADMIN_MODULES.map((module) => {
              const active = selectedModules.includes(module.key);
              const locked = module.key === 'dashboard';
              return (
                <button
                  key={module.key}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    const nextModules = active
                      ? selectedModules.filter((item) => item !== module.key)
                      : [...selectedModules, module.key];
                    setForm((current) => ({
                      ...current,
                      access: serializeAdminAccess(nextModules),
                    }));
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  } ${locked ? 'cursor-not-allowed opacity-90' : ''}`}
                >
                  {module.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <AdminUploadField
            label="Upload avatar pengguna"
            target="avatars"
            accept="image/*"
            helpText="Avatar akan disimpan ke folder uploads/avatars dan URL-nya otomatis diisi ke profil pengguna."
            onUploaded={(result) =>
              setForm((current) => ({
                ...current,
                avatar: result.fileUrl,
              }))
            }
          />
        </div>

        <div className="mt-4">
          <AdminRichTextEditor
            label="Deskripsi pengguna"
            value={form.description || ''}
            onChange={(description) => setForm((current) => ({ ...current, description }))}
            placeholder="Tulis profil singkat atau keterangan pengguna"
            minHeightClassName="min-h-44"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
          >
            <Save className="h-4 w-4" />
            Simpan Pengguna
          </button>
          {form.password ? (
            <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/25 px-4 py-3 text-sm text-emerald-200">
              <KeyRound className="h-4 w-4" />
              Password baru siap diterapkan saat disimpan
            </span>
          ) : null}
          {form.id ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isCurrentUser}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 px-5 py-3 text-sm font-semibold text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isCurrentUser ? 'Tidak bisa hapus akun aktif' : 'Hapus'}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
