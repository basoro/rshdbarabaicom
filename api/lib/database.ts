import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

type SqlParam = string | number | null;

type RunResult = {
  changes?: number;
  lastInsertRowid?: number | bigint;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = path.resolve(__dirname, '../database.sdb');

export const db = new DatabaseSync(databasePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
  CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
  CREATE INDEX IF NOT EXISTS idx_news_slug ON mlite_news(slug);
  CREATE INDEX IF NOT EXISTS idx_news_status_published ON mlite_news(status, published_at);
  CREATE INDEX IF NOT EXISTS idx_arsip_tahun_kategori ON arsip_dokumen(tahun, kategori);
  CREATE INDEX IF NOT EXISTS idx_settings_module_field ON mlite_settings(module, field);

  -- Compatibility mirror for legacy foreign keys that still reference users(id).
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    fullname TEXT DEFAULT '',
    email TEXT DEFAULT ''
  );
`);

db.exec(`
  INSERT OR REPLACE INTO users (id, username, fullname, email)
  SELECT id, username, COALESCE(fullname, ''), COALESCE(email, '')
  FROM mlite_users
`);

// Migration: add views column to mlite_news if missing
try {
  db.exec(`ALTER TABLE mlite_news ADD COLUMN views INTEGER NOT NULL DEFAULT 0`);
} catch {
  // column already exists — safe to ignore
}

export function all<T>(sql: string, params: SqlParam[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, params: SqlParam[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: SqlParam[] = []): RunResult {
  return db.prepare(sql).run(...params) as RunResult;
}

export function syncLegacyUser(user: {
  id: number;
  username: string;
  fullname?: string | null;
  email?: string | null;
}): void {
  run(
    `
      INSERT OR REPLACE INTO users (id, username, fullname, email)
      VALUES (?, ?, ?, ?)
    `,
    [user.id, user.username, user.fullname ?? '', user.email ?? ''],
  );
}

export function getSettingsMap(): Record<string, string> {
  const rows = all<{ field: string; value: string | null }>(
    `SELECT field, value FROM mlite_settings WHERE module = 'settings'`,
  );

  return rows.reduce<Record<string, string>>((accumulator, row) => {
    accumulator[row.field] = row.value ?? '';
    return accumulator;
  }, {});
}

export function cleanupExpiredSessions(now: number): void {
  run(`DELETE FROM admin_sessions WHERE expires_at <= ?`, [now]);
}

export function toNumber(value: number | bigint | undefined): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  return value ?? 0;
}
