import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import AdminRichTextEditor from '@/components/AdminRichTextEditor';
import { adminListSettings, adminSaveSettings } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';

const RICH_TEXT_FIELDS = new Set(['footer']);
const LONG_TEXT_FIELDS = new Set(['alamat', 'update_changelog', 'license']);

const FIELD_META: Record<
  string,
  {
    label: string;
    description?: string;
  }
> = {
  nama_instansi: {
    label: 'Nama instansi',
  },
  alamat: {
    label: 'Alamat',
  },
  nomor_telepon: {
    label: 'Nomor telepon',
  },
  email: {
    label: 'Email',
  },
  website: {
    label: 'Website',
  },
  footer: {
    label: 'Footer situs',
    description: 'Mendukung HTML ringan untuk copyright, tautan, atau teks tambahan.',
  },
  logo: {
    label: 'Logo',
  },
  wallpaper: {
    label: 'Wallpaper',
  },
  homepage: {
    label: 'Halaman depan',
  },
  theme: {
    label: 'Tema publik',
  },
  theme_admin: {
    label: 'Tema admin',
  },
  timezone: {
    label: 'Zona waktu',
  },
  text_color: {
    label: 'Warna teks',
  },
};

function humanizeField(field: string) {
  return field
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function AdminSettingsPage() {
  const token = useAdminStore((state) => state.token);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    adminListSettings(token).then((response) => {
      const mapped = response.reduce<Record<string, string>>((accumulator, item) => {
        accumulator[item.field] = item.value || '';
        return accumulator;
      }, {});
      setSettings(mapped);
    });
  }, [token]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      await adminSaveSettings(token, settings);
      window.alert('Pengaturan berhasil disimpan.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  }

  const entries = useMemo(() => Object.entries(settings), [settings]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Pengaturan Situs</p>
      <h1 className="mt-2 font-display text-5xl text-white">Identitas website</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {entries.map(([field, value]) => {
          const meta = FIELD_META[field];
          const label = meta?.label || humanizeField(field);

          if (RICH_TEXT_FIELDS.has(field)) {
            return (
              <div key={field} className="md:col-span-2">
                <AdminRichTextEditor
                  label={label}
                  value={value}
                  onChange={(nextValue) =>
                    setSettings((current) => ({ ...current, [field]: nextValue }))
                  }
                  placeholder={`Isi ${label.toLowerCase()}`}
                  minHeightClassName="min-h-40"
                />
                {meta?.description ? (
                  <p className="mt-3 text-sm leading-6 text-slate-400">{meta.description}</p>
                ) : null}
              </div>
            );
          }

          if (LONG_TEXT_FIELDS.has(field)) {
            return (
              <label key={field} className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
                <textarea
                  value={value}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, [field]: event.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-white outline-none ring-emerald-500 focus:ring"
                />
                {meta?.description ? (
                  <span className="mt-2 block text-xs leading-6 text-slate-400">
                    {meta.description}
                  </span>
                ) : null}
              </label>
            );
          }

          return (
            <label key={field} className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
              <input
                value={value}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, [field]: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none ring-emerald-500 focus:ring"
              />
              {meta?.description ? (
                <span className="mt-2 block text-xs leading-6 text-slate-400">
                  {meta.description}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </div>
  );
}
