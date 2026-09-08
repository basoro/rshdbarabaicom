import { Router, type Request, type Response } from 'express';
import mysql, { type RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';
import { all, get, run } from '../lib/database.js';
import { verifyPassword, createSessionToken } from '../lib/auth.js';
import crypto from 'node:crypto';

/* ════════════════════════════════════════════════════════════════════ */
/*                     ZOD VALIDATION SCHEMAS                          */
/* ════════════════════════════════════════════════════════════════════ */

const s = {
  signin: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
    no_ktp: z.string().min(1, 'No. KTP wajib diisi.'),
  }),

  register: z.object({
    nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi.'),
    email: z.string().email('Email tidak valid.'),
    nomor_ktp: z.string().min(1, 'Nomor KTP wajib diisi.'),
    nomor_telepon: z.string().min(1, 'Nomor telepon wajib diisi.'),
  }),

  postregister: z.object({
    email: z.string().email('Email tidak valid.'),
  }),

  saveregister: z.object({
    nm_pasien: z.string().min(1, 'Nama pasien wajib diisi.'),
    email: z.string().email('Email tidak valid.'),
    no_ktp: z.string().min(1, 'No. KTP wajib diisi.'),
    no_tlp: z.string().min(1, 'No. telepon wajib diisi.'),
    jk: z.enum(['L', 'P'], { message: 'Jenis kelamin harus L atau P.' }),
    tgl_lahir: z.string().min(1, 'Tanggal lahir wajib diisi.'),
    alamat: z.string().min(1, 'Alamat wajib diisi.'),
  }),

  notifikasi: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  notifikasilist: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  tandaisudahdibaca: z.object({
    id: z.string().min(1, 'ID notifikasi wajib diisi.'),
  }),

  notifbooking: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  booking: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  lastbooking: z.object({}).passthrough(),

  bookingdetail: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
    tanggal_periksa: z.string().min(1, 'Tanggal periksa wajib diisi.'),
    no_reg: z.string().min(1, 'No. registrasi wajib diisi.'),
  }),

  kamar: z.object({}).passthrough(),

  dokter: z.object({
    tanggal: z.string().optional().default(''),
  }).passthrough(),

  riwayat: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  riwayatdetail: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
    tgl_registrasi: z.string().min(1, 'Tanggal registrasi wajib diisi.'),
    no_reg: z.string().min(1, 'No. registrasi wajib diisi.'),
  }),

  riwayatranap: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  riwayatranapdetail: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
    tgl_registrasi: z.string().min(1, 'Tanggal registrasi wajib diisi.'),
    no_reg: z.string().min(1, 'No. registrasi wajib diisi.'),
  }),

  billing: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  profil: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  jadwalklinik: z.object({
    tanggal: z.string().min(1, 'Tanggal wajib diisi.'),
  }),

  jadwaldokter: z.object({
    tanggal: z.string().min(1, 'Tanggal wajib diisi.'),
    kd_poli: z.string().min(1, 'Kode poli wajib diisi.'),
  }),

  carabayar: z.object({}).passthrough(),

  daftar: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
    tanggal: z.string().min(1, 'Tanggal wajib diisi.'),
    kd_poli: z.string().min(1, 'Kode poli wajib diisi.'),
    kd_dokter: z.string().min(1, 'Kode dokter wajib diisi.'),
    kd_pj: z.string().min(1, 'Kode penanggung jawab wajib diisi.'),
  }),

  sukses: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  pengaduan: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  pengaduandetail: z.object({
    pengaduan_id: z.string().min(1, 'ID pengaduan wajib diisi.'),
  }),

  simpanpengaduan: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
    message: z.string().min(1, 'Pesan wajib diisi.'),
  }),

  simpanpengaduandetail: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
    message: z.string().min(1, 'Pesan wajib diisi.'),
    pengaduan_id: z.string().min(1, 'ID pengaduan wajib diisi.'),
  }),

  cekrujukan: z.object({}).passthrough(),

  rawatjalan: z.object({}).passthrough(),

  rawatinap: z.object({}).passthrough(),

  laboratorium: z.object({}).passthrough(),

  radiologi: z.object({}).passthrough(),

  hitungralan: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  hitungranap: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  layananunggulan: z.object({}).passthrough(),

  lastnews: z.object({}).passthrough(),

  news: z.object({}).passthrough(),

  newsdetail: z.object({
    id: z.string().min(1, 'ID berita wajib diisi.'),
  }),

  telemedicine: z.object({
    tanggal: z.string().optional().default(''),
  }).passthrough(),

  duitku_callback: z.object({
    merchantCode: z.string().min(1, 'Merchant code wajib diisi.'),
    amount: z.string().min(1, 'Amount wajib diisi.'),
    merchantOrderId: z.string().min(1, 'Merchant order ID wajib diisi.'),
    signature: z.string().min(1, 'Signature wajib diisi.'),
    resultCode: z.string().optional().default(''),
  }).passthrough(),

  telemedicinedaftar: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
    tanggal: z.string().min(1, 'Tanggal wajib diisi.'),
    kd_poli: z.string().min(1, 'Kode poli wajib diisi.'),
    kd_dokter: z.string().min(1, 'Kode dokter wajib diisi.'),
  }),

  telemedicinesukses: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  simpanretensirekammedik: z.object({
    no_rkm_medis: z.string().min(1, 'No. RM wajib diisi.'),
  }),

  antrian: z.object({}).passthrough(),
};

type ActionKey = keyof typeof s;
const VALID_ACTIONS = Object.keys(s) as ActionKey[];

function validateAction(body: Record<string, unknown>, action: string): {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
} {
  if (!VALID_ACTIONS.includes(action as ActionKey)) {
    return { ok: false, error: `Action tidak dikenal: ${action}` };
  }

  const schema = s[action as ActionKey];
  const result = schema.safeParse(body);

  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? 'Data tidak valid.';
    return { ok: false, error: msg };
  }

  return { ok: true, data: result.data as Record<string, unknown> };
}

const router = Router();

/* ───────── MySQL connection (mirrors the legacy hospital DB) ───────── */

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  return pool;
}

/* ───────── SQLite helpers (settings + local data) ───────── */

interface SettingRow {
  module: string;
  field: string;
  value: string | null;
}

function getSetting(moduleName: string): Record<string, string> {
  const rows = all<SettingRow>(
    `SELECT module, field, value FROM mlite_settings WHERE module = ?`,
    [moduleName],
  );
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (r.value !== null) map[r.field] = r.value;
  }
  return map;
}

function getSettingValue(moduleName: string, field: string): string {
  const row = get<{ value: string | null }>(
    `SELECT value FROM mlite_settings WHERE module = ? AND field = ? LIMIT 1`,
    [moduleName, field],
  );
  return row?.value ?? '';
}

/* ───────── Utility helpers ───────── */

function dayNameID(dateStr: string): string {
  const dayMap: Record<string, string> = {
    Sunday: 'AKHAD',
    Monday: 'SENIN',
    Tuesday: 'SELASA',
    Wednesday: 'RABU',
    Thursday: 'KAMIS',
    Friday: 'JUMAT',
    Saturday: 'SABTU',
  };
  const d = new Date(dateStr);
  return dayMap[d.toLocaleDateString('en-US', { weekday: 'long' })] ?? '';
}

function dayNameShort(dateStr: string): string {
  const dayMap: Record<string, string> = {
    Sun: 'AKHAD',
    Mon: 'SENIN',
    Tue: 'SELASA',
    Wed: 'RABU',
    Thu: 'KAMIS',
    Fri: 'JUMAT',
    Sat: 'SABTU',
  };
  const d = new Date(dateStr);
  return dayMap[d.toLocaleDateString('en-US', { weekday: 'short' })] ?? '';
}

function hitungUmur(tglLahir: string): string {
  const birth = new Date(tglLahir);
  const today = new Date();
  if (birth >= today) return '0 Th 0 Bl 0 Hr';
  const y = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  const d = today.getDate() - birth.getDate();
  const adj = d < 0 ? m - 1 : m;
  const adjD = d < 0 ? d + 30 : d;
  return `${y} Th ${adj < 0 ? adj + 12 : adj} Bl ${adjD} Hr`;
}

function getDayIndonesia(dateStr: string): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date(dateStr).getDay()];
}

function dateIndonesia(dateStr: string): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* ───────── MySQL query helpers ───────── */

interface QueryResult {
  affectedRows?: number;
  insertId?: number;
}

async function query(sql: string, params: unknown[] = []): Promise<RowDataPacket[]> {
  const [rows] = await getPool().query(sql, params);
  return rows as RowDataPacket[];
}

async function queryOne(sql: string, params: unknown[] = []): Promise<RowDataPacket | null> {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

async function execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
  const [, header] = await getPool().query(sql, params);
  const h = header as RowDataPacket;
  return { affectedRows: Number(h.affectedRows ?? 0), insertId: Number(h.insertId ?? 0) };
}

/* ───────── Token validation middleware ───────── */

function validateApamToken(req: Request, res: Response): boolean {
  const apamSettings = getSetting('api');
  const key = apamSettings['apam_key'] || '';
  const token = (req.body.token ?? req.query.token ?? '').toString().trim();

  if (token !== key) {
    res.status(401).json({ error: 'Error key' });
    return false;
  }
  return true;
}

/* ════════════════════════════════════════════════════════════════════ */
/*                    APAM LOGIN (Frontend Auth)                       */
/* ════════════════════════════════════════════════════════════════════ */

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

type UserRow = {
  id: number;
  username: string;
  fullname: string | null;
  email: string;
  password: string;
  role: string;
  access: string;
};

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Data login tidak valid.',
    });
    return;
  }

  const { username, password } = parsed.data;

  const user = get<UserRow>(
    `SELECT id, username, fullname, email, password, role, access FROM mlite_users WHERE username = ? LIMIT 1`,
    [username],
  );

  if (!user || !(await verifyPassword(password, user.password))) {
    res.status(401).json({
      success: false,
      error: 'Username atau password salah.',
    });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 60 * 60 * 24 * 7; // 7 days
  const token = createSessionToken();

  // Reuse admin_sessions table
  run(`DELETE FROM admin_sessions WHERE user_id = ?`, [user.id]);
  run(
    `INSERT INTO admin_sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [user.id, token, expiresAt, now],
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        access: user.access,
      },
    },
  });
});

/* ════════════════════════════════════════════════════════════════════ */
/*                    APAM SESSION CHECK                               */
/* ════════════════════════════════════════════════════════════════════ */

type SessionRow = {
  user_id: number;
  token: string;
  expires_at: number;
  username: string;
  fullname: string | null;
  email: string;
  role: string;
  access: string;
};

router.get('/session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({ success: false, error: 'Tidak terautentikasi.' });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const session = get<SessionRow>(
    `SELECT s.user_id, s.token, s.expires_at, u.username, u.fullname, u.email, u.role, u.access
     FROM admin_sessions s
     INNER JOIN mlite_users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?
     LIMIT 1`,
    [token, now],
  );

  if (!session) {
    res.status(401).json({ success: false, error: 'Sesi tidak valid atau sudah berakhir.' });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: session.user_id,
        username: session.username,
        fullname: session.fullname,
        email: session.email,
        role: session.role,
        access: session.access,
      },
    },
  });
});

/* ════════════════════════════════════════════════════════════════════ */
/*                    APAM LOGOUT                                     */
/* ════════════════════════════════════════════════════════════════════ */

router.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (token) {
    run(`DELETE FROM admin_sessions WHERE token = ?`, [token]);
  }

  res.json({ success: true });
});

/* ════════════════════════════════════════════════════════════════════ */
/*                          MAIN ROUTE                                 */
/* ════════════════════════════════════════════════════════════════════ */

router.all('/', async (req: Request, res: Response) => {
  // CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  if (!validateApamToken(req, res)) return;

  const action = (req.body.action ?? req.query.action ?? '').toString().trim();

  // Validate input with Zod
  const validation = validateAction(req.body as Record<string, unknown>, action);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const input = validation.data!;

  try {
    switch (action) {
      /* ────────────── AUTH ────────────── */

      case 'signin': {
        const noRkmMedis = String(input.no_rkm_medis);
        const noKtp = String(input.no_ktp);

        const pasien = await queryOne(
          'SELECT no_rkm_medis FROM pasien WHERE no_rkm_medis = ? AND no_ktp = ?',
          [noRkmMedis, noKtp],
        );

        if (pasien) {
          res.json({ state: 'valid', no_rkm_medis: pasien.no_rkm_medis });
        } else {
          res.json({ state: 'invalid' });
        }
        break;
      }

      case 'register': {
        const namaLengkap = String(input.nama_lengkap);
        const email = String(input.email);
        const nomorKtp = String(input.nomor_ktp);
        const nomorTelepon = String(input.nomor_telepon);

        await execute('DELETE FROM mlite_apamregister WHERE email = ?', [email]);

        const saved = await execute(
          'INSERT INTO mlite_apamregister (nama_lengkap, email, nomor_ktp, nomor_telepon) VALUES (?, ?, ?, ?)',
          [namaLengkap, email, nomorKtp, nomorTelepon],
        );

        if (saved.affectedRows === 0) {
          res.json({ state: 'invalid' });
          break;
        }

        const dup = await queryOne(
          'SELECT 1 FROM pasien WHERE no_ktp = ? OR email = ? LIMIT 1',
          [nomorKtp, email],
        );

        if (dup) {
          res.json({ state: 'duplicate' });
        } else {
          const rand = Math.floor(100000 + Math.random() * 900000);
          res.json({
            state: 'valid',
            email,
            kode_validasi: rand,
            time_wait: Math.floor(Date.now() / 1000),
          });
        }
        break;
      }

      case 'postregister': {
        const email = String(input.email);
        const row = await queryOne(
          'SELECT * FROM mlite_apamregister WHERE email = ?',
          [email],
        );
        res.json(row ?? {});
        break;
      }

      case 'saveregister': {
        const nmPasien = String(input.nm_pasien);
        const emailVal = String(input.email);
        const noKtpVal = String(input.no_ktp);
        const noTlp = String(input.no_tlp);
        const jk = String(input.jk);
        const tglLahir = String(input.tgl_lahir);
        const alamat = String(input.alamat);

        const apamSettings = getSetting('api');

        const lastRow = await queryOne('SELECT no_rkm_medis FROM set_no_rkm_medis');
        let lastNoRm = '000000';
        if (lastRow && lastRow.no_rkm_medis) {
          lastNoRm = String(lastRow.no_rkm_medis).substring(0, 6);
        }
        const nextNoRm = String(Number(lastNoRm) + 1).padStart(6, '0');

        const umur = hitungUmur(tglLahir);

        const result = await execute(
          `INSERT INTO pasien (no_rkm_medis, nm_pasien, email, no_ktp, no_tlp, jk, tmp_lahir, tgl_lahir, nm_ibu, alamat, gol_darah, pekerjaan, stts_nikah, agama, tgl_daftar, umur, pnd, keluarga, namakeluarga, kd_pj, no_peserta, kd_kel, kd_kec, kd_kab, pekerjaanpj, alamatpj, kelurahanpj, kecamatanpj, kabupatenpj, perusahaan_pasien, suku_bangsa, bahasa_pasien, cacat_fisik, nip, kd_prop, propinsipj)
           VALUES (?, ?, ?, ?, ?, ?, '-', ?, '-', ?, '-', '-', 'JOMBLO', '-', CURDATE(), ?, '-', 'AYAH', '-', ?, '', '1', ?, ?, '-', '-', '-', '-', '-', '-', '1', '1', '1', '', ?, '-')`,
          [
            nextNoRm, nmPasien, emailVal, noKtpVal, noTlp, jk,
            tglLahir, alamat, umur,
            apamSettings['apam_kdpj'] || '',
            apamSettings['apam_kdkec'] || '',
            apamSettings['apam_kdkab'] || '',
            apamSettings['apam_kdprop'] || '',
          ],
        );

        if (result.affectedRows > 0) {
          await execute('UPDATE set_no_rkm_medis SET no_rkm_medis = ?', [nextNoRm]);
          await execute('DELETE FROM mlite_apamregister WHERE email = ?', [emailVal]);
          res.json({ state: 'valid', no_rkm_medis: nextNoRm });
        } else {
          res.json({ state: 'invalid' });
        }
        break;
      }

      /* ────────────── NOTIFICATIONS ────────────── */

      case 'notifikasi': {
        const noRkmMedis = String(input.no_rkm_medis);
        const rows = await query(
          "SELECT *, 'valid' AS state FROM mlite_notifications WHERE no_rkm_medis = ? AND status = 'unread'",
          [noRkmMedis],
        );
        res.json(rows);
        break;
      }

      case 'notifikasilist': {
        const noRkmMedis = String(input.no_rkm_medis);
        const rows = await query(
          'SELECT * FROM mlite_notifications WHERE no_rkm_medis = ? ORDER BY id DESC',
          [noRkmMedis],
        );
        res.json(rows);
        break;
      }

      case 'tandaisudahdibaca': {
        const id = String(input.id);
        await execute("UPDATE mlite_notifications SET status = 'read' WHERE id = ?", [id]);
        res.json({ state: 'valid' });
        break;
      }

      /* ────────────── BOOKING ────────────── */

      case 'notifbooking': {
        const noRkmMedis = String(input.no_rkm_medis);
        const today = new Date().toISOString().split('T')[0];

        const row = await queryOne(
          "SELECT stts FROM reg_periksa WHERE tgl_registrasi = ? AND no_rkm_medis = ? AND (stts = 'Belum' OR stts = 'Berkas Diterima')",
          [today, noRkmMedis],
        );

        if (!row) {
          res.json({ state: 'invalid' });
          break;
        }

        const apamSettings = getSetting('api');
        if (row.stts === 'Belum') {
          res.json({ state: 'notifbooking', stts: apamSettings['apam_status_daftar'] || '' });
        } else if (row.stts === 'Berkas Diterima') {
          res.json({ state: 'notifberkas', stts: apamSettings['apam_status_dilayani'] || '' });
        } else {
          res.json({ state: 'invalid' });
        }
        break;
      }

      case 'booking': {
        const noRkmMedis = String(input.no_rkm_medis);
        const rows = await query(
          `SELECT a.tanggal_booking, a.tanggal_periksa, a.no_reg, a.status, b.nm_poli, c.nm_dokter, d.png_jawab
           FROM booking_registrasi a
           LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli
           LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter
           LEFT JOIN penjab d ON a.kd_pj = d.kd_pj
           WHERE a.no_rkm_medis = ?
           ORDER BY a.tanggal_periksa DESC`,
          [noRkmMedis],
        );
        res.json(rows);
        break;
      }

      case 'lastbooking': {
        res.json({ state: 'valid' });
        break;
      }

      case 'bookingdetail': {
        const noRkmMedis = String(input.no_rkm_medis);
        const tanggalPeriksa = String(input.tanggal_periksa);
        const noReg = String(input.no_reg);
        const rows = await query(
          `SELECT a.tanggal_booking, a.tanggal_periksa, a.no_reg, a.status, b.nm_poli, c.nm_dokter, d.png_jawab
           FROM booking_registrasi a
           LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli
           LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter
           LEFT JOIN penjab d ON a.kd_pj = d.kd_pj
           WHERE a.no_rkm_medis = ? AND a.tanggal_periksa = ? AND a.no_reg = ?`,
          [noRkmMedis, tanggalPeriksa, noReg],
        );
        res.json(rows);
        break;
      }

      /* ────────────── KAMAR ────────────── */

      case 'kamar': {
        const rows = await query(
          `SELECT nama.kelas,
                  (SELECT COUNT(*) FROM kamar WHERE kelas = nama.kelas AND statusdata = '1') AS total,
                  (SELECT COUNT(*) FROM kamar WHERE kelas = nama.kelas AND statusdata = '1' AND status = 'ISI') AS isi,
                  (SELECT COUNT(*) FROM kamar WHERE kelas = nama.kelas AND statusdata = '1' AND status = 'KOSONG') AS kosong
           FROM (SELECT DISTINCT kelas FROM kamar WHERE statusdata = '1') AS nama
           ORDER BY nama.kelas ASC`,
        );
        res.json(rows);
        break;
      }

      /* ────────────── DOKTER ────────────── */

      case 'dokter': {
        const tanggal = String(input.tanggal || '');
        const getTanggal = tanggal || new Date().toISOString().split('T')[0];
        const namahari = dayNameID(getTanggal);

        const rows = await query(
          `SELECT d.nm_dokter, d.jk, p.nm_poli,
                  DATE_FORMAT(j.jam_mulai, '%H:%i') AS jam_mulai,
                  DATE_FORMAT(j.jam_selesai, '%H:%i') AS jam_selesai,
                  d.kd_dokter
           FROM jadwal j
           INNER JOIN dokter d ON d.kd_dokter = j.kd_dokter
           INNER JOIN poliklinik p ON j.kd_poli = p.kd_poli
           WHERE j.hari_kerja = ?`,
          [namahari],
        );

        if (rows.length === 0) {
          res.json({ state: 'notfound' });
        } else {
          res.json(rows);
        }
        break;
      }

      /* ────────────── RIWAYAT ────────────── */

      case 'riwayat': {
        const noRkmMedis = String(input.no_rkm_medis);
        const rows = await query(
          `SELECT a.tgl_registrasi, a.no_rawat, a.no_reg, b.nm_poli, c.nm_dokter, d.png_jawab
           FROM reg_periksa a
           LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli
           LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter
           LEFT JOIN penjab d ON a.kd_pj = d.kd_pj
           WHERE a.no_rkm_medis = ? AND a.stts = 'Sudah'
           ORDER BY a.tgl_registrasi DESC`,
          [noRkmMedis],
        );
        res.json(rows);
        break;
      }

      case 'riwayatdetail': {
        const noRkmMedis = String(input.no_rkm_medis);
        const tglRegistrasi = String(input.tgl_registrasi);
        const noReg = String(input.no_reg);
        const rows = await query(
          `SELECT a.tgl_registrasi, a.no_rawat, a.no_reg,
                  b.nm_poli, c.nm_dokter, d.png_jawab,
                  e.keluhan, e.pemeriksaan,
                  GROUP_CONCAT(DISTINCT g.nm_penyakit SEPARATOR '<br>') AS nm_penyakit,
                  GROUP_CONCAT(DISTINCT i.nama_brng SEPARATOR '<br>') AS nama_brng,
                  GROUP_CONCAT(CONCAT_WS(':', k.pemeriksaan, j.nilai) SEPARATOR '<br>') AS pemeriksaan_lab,
                  GROUP_CONCAT(CONCAT_WS(':', m.nm_perawatan, n.hasil) SEPARATOR '<br>') AS hasil_radiologi,
                  GROUP_CONCAT(DISTINCT o.lokasi_gambar SEPARATOR '<br>') AS gambar_radiologi
           FROM reg_periksa a
           LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli
           LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter
           LEFT JOIN penjab d ON a.kd_pj = d.kd_pj
           LEFT JOIN pemeriksaan_ralan e ON a.no_rawat = e.no_rawat
           LEFT JOIN diagnosa_pasien f ON a.no_rawat = f.no_rawat
           LEFT JOIN penyakit g ON f.kd_penyakit = g.kd_penyakit
           LEFT JOIN detail_pemberian_obat h ON a.no_rawat = h.no_rawat
           LEFT JOIN databarang i ON h.kode_brng = i.kode_brng
           LEFT JOIN detail_periksa_lab j ON a.no_rawat = j.no_rawat
           LEFT JOIN template_laboratorium k ON j.id_template = k.id_template
           LEFT JOIN periksa_radiologi l ON a.no_rawat = l.no_rawat
           LEFT JOIN jns_perawatan_radiologi m ON l.kd_jenis_prw = m.kd_jenis_prw
           LEFT JOIN hasil_radiologi n ON a.no_rawat = n.no_rawat
           LEFT JOIN gambar_radiologi o ON a.no_rawat = o.no_rawat
           WHERE a.no_rkm_medis = ? AND a.tgl_registrasi = ? AND a.no_reg = ?
           GROUP BY a.no_rawat`,
          [noRkmMedis, tglRegistrasi, noReg],
        );
        res.json(rows);
        break;
      }

      /* ────────────── RIWAYAT RAWAT INAP ────────────── */

      case 'riwayatranap': {
        const noRkmMedis = String(input.no_rkm_medis);
        const rows = await query(
          `SELECT r.tgl_registrasi, r.no_reg, d.nm_dokter, bs.nm_bangsal, pj.png_jawab, r.no_rawat
           FROM kamar_inap ki
           INNER JOIN reg_periksa r ON ki.no_rawat = r.no_rawat
           INNER JOIN pasien p ON r.no_rkm_medis = p.no_rkm_medis
           INNER JOIN kamar k ON ki.kd_kamar = k.kd_kamar
           INNER JOIN bangsal bs ON k.kd_bangsal = bs.kd_bangsal
           INNER JOIN penjab pj ON r.kd_pj = pj.kd_pj
           INNER JOIN dpjp_ranap dr ON dr.no_rawat = r.no_rawat
           INNER JOIN dokter d ON dr.kd_dokter = d.kd_dokter
           WHERE p.no_rkm_medis = ?
           ORDER BY r.tgl_registrasi DESC`,
          [noRkmMedis],
        );
        res.json(rows);
        break;
      }

      case 'riwayatranapdetail': {
        const noRkmMedis = String(input.no_rkm_medis);
        const tglRegistrasi = String(input.tgl_registrasi);
        const noReg = String(input.no_reg);
        const rows = await query(
          `SELECT a.tgl_registrasi, a.no_rawat, a.no_reg,
                  bs.nm_bangsal, c.nm_dokter, d.png_jawab,
                  GROUP_CONCAT(DISTINCT e.keluhan SEPARATOR '<br>') AS keluhan,
                  GROUP_CONCAT(DISTINCT e.pemeriksaan SEPARATOR '<br>') AS pemeriksaan,
                  GROUP_CONCAT(DISTINCT g.nm_penyakit SEPARATOR '<br>') AS nm_penyakit,
                  GROUP_CONCAT(DISTINCT i.nama_brng SEPARATOR '<br>') AS nama_brng,
                  GROUP_CONCAT(CONCAT_WS(':', m.pemeriksaan, l.nilai) SEPARATOR '<br>') AS pemeriksaan_lab,
                  GROUP_CONCAT(CONCAT_WS(':', o.nm_perawatan, p_res.hasil) SEPARATOR '<br>') AS hasil_radiologi,
                  GROUP_CONCAT(DISTINCT q.lokasi_gambar SEPARATOR '<br>') AS gambar_radiologi
           FROM reg_periksa a
           LEFT JOIN kamar_inap j ON a.no_rawat = j.no_rawat
           LEFT JOIN kamar k ON j.kd_kamar = k.kd_kamar
           LEFT JOIN bangsal bs ON k.kd_bangsal = bs.kd_bangsal
           LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter
           LEFT JOIN penjab d ON a.kd_pj = d.kd_pj
           LEFT JOIN pemeriksaan_ranap e ON a.no_rawat = e.no_rawat
           LEFT JOIN diagnosa_pasien f ON a.no_rawat = f.no_rawat
           LEFT JOIN penyakit g ON f.kd_penyakit = g.kd_penyakit
           LEFT JOIN detail_pemberian_obat h ON a.no_rawat = h.no_rawat
           LEFT JOIN databarang i ON h.kode_brng = i.kode_brng
           LEFT JOIN detail_periksa_lab l ON a.no_rawat = l.no_rawat
           LEFT JOIN template_laboratorium m ON l.id_template = m.id_template
           LEFT JOIN periksa_radiologi n ON a.no_rawat = n.no_rawat
           LEFT JOIN jns_perawatan_radiologi o ON n.kd_jenis_prw = o.kd_jenis_prw
           LEFT JOIN hasil_radiologi p_res ON a.no_rawat = p_res.no_rawat
           LEFT JOIN gambar_radiologi q ON a.no_rawat = q.no_rawat
           WHERE a.no_rkm_medis = ? AND a.tgl_registrasi = ? AND a.no_reg = ?
           GROUP BY a.no_rawat`,
          [noRkmMedis, tglRegistrasi, noReg],
        );
        res.json(rows);
        break;
      }

      /* ────────────── BILLING ────────────── */

      case 'billing': {
        const noRkmMedis = String(input.no_rkm_medis);
        const rows = await query(
          `SELECT a.tgl_registrasi, a.no_rawat, a.no_reg, b.nm_poli, c.nm_dokter, d.png_jawab,
                  e.kd_billing, e.jumlah_harus_bayar
           FROM reg_periksa a
           LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli
           LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter
           LEFT JOIN penjab d ON a.kd_pj = d.kd_pj
           INNER JOIN mlite_billing e ON a.no_rawat = e.no_rawat
           WHERE a.no_rkm_medis = ? AND a.stts = 'Sudah'
           ORDER BY e.tgl_billing DESC, e.jam_billing DESC`,
          [noRkmMedis],
        );
        for (const row of rows) {
          row.total_bayar = Number(row.jumlah_harus_bayar).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        res.json(rows);
        break;
      }

      /* ────────────── PROFIL ────────────── */

      case 'profil': {
        const noRkmMedis = String(input.no_rkm_medis);
        const pasien = await queryOne(
          'SELECT * FROM pasien WHERE no_rkm_medis = ?',
          [noRkmMedis],
        );

        if (!pasien) {
          res.json({ state: 'invalid' });
          break;
        }

        const personal = await queryOne(
          'SELECT gambar FROM personal_pasien WHERE no_rkm_medis = ?',
          [noRkmMedis],
        );

        const apamSettings = getSetting('api');
        const baseUrl = apamSettings['apam_webappsurl'] || '';

        pasien.foto = pasien.jk === 'P' ? 'img/P.png' : 'img/L.png';
        if (personal && personal.gambar) {
          pasien.foto = `${baseUrl}/photopasien/${personal.gambar}`;
        }

        res.json(pasien);
        break;
      }

      /* ────────────── JADWAL ────────────── */

      case 'jadwalklinik': {
        const tanggal = String(input.tanggal);
        const hari = dayNameShort(tanggal);

        const rows = await query(
          `SELECT a.kd_poli, b.nm_poli,
                  DATE_FORMAT(a.jam_mulai, '%H:%i') AS jam_mulai,
                  DATE_FORMAT(a.jam_selesai, '%H:%i') AS jam_selesai
           FROM jadwal a
           INNER JOIN poliklinik b ON a.kd_poli = b.kd_poli
           INNER JOIN dokter c ON a.kd_dokter = c.kd_dokter
           WHERE a.hari_kerja LIKE ?
           GROUP BY b.kd_poli`,
          [`%${hari}%`],
        );
        res.json(rows);
        break;
      }

      case 'jadwaldokter': {
        const tanggal = String(input.tanggal);
        const kdPoli = String(input.kd_poli);
        const hari = dayNameShort(tanggal);

        const rows = await query(
          `SELECT a.kd_dokter, c.nm_dokter
           FROM jadwal a
           INNER JOIN poliklinik b ON a.kd_poli = b.kd_poli
           INNER JOIN dokter c ON a.kd_dokter = c.kd_dokter
           WHERE a.kd_poli = ? AND a.hari_kerja LIKE ?`,
          [kdPoli, `%${hari}%`],
        );
        res.json(rows);
        break;
      }

      /* ────────────── CARA BAYAR ────────────── */

      case 'carabayar': {
        const rows = await query('SELECT * FROM penjab');
        res.json(rows);
        break;
      }

      /* ────────────── DAFTAR ────────────── */

      case 'daftar': {
        const noRkmMedis = String(input.no_rkm_medis);
        const tanggal = String(input.tanggal);
        const kdPoli = String(input.kd_poli);
        const kdDokter = String(input.kd_dokter);
        const kdPj = String(input.kd_pj);
        const hari = dayNameShort(tanggal);

        const apamSettings = getSetting('api');
        const siteSettings = getSetting('settings');

        const jadwal = await queryOne(
          'SELECT kuota FROM jadwal WHERE kd_poli = ? AND hari_kerja = ?',
          [kdPoli, hari],
        );

        let checkKuotaSql: string;
        let checkKuotaParams: unknown[];

        if (siteSettings['dokter_ralan_per_dokter'] === 'true') {
          checkKuotaSql = 'SELECT COUNT(DISTINCT no_reg) AS cnt FROM booking_registrasi WHERE kd_poli = ? AND kd_dokter = ? AND tanggal_periksa = ?';
          checkKuotaParams = [kdPoli, kdDokter, tanggal];
        } else {
          checkKuotaSql = 'SELECT COUNT(DISTINCT no_reg) AS cnt FROM booking_registrasi WHERE kd_poli = ? AND tanggal_periksa = ?';
          checkKuotaParams = [kdPoli, tanggal];
        }

        const kuotaRow = await queryOne(checkKuotaSql, checkKuotaParams);
        const currCount = kuotaRow?.cnt ?? 0;
        const currKuota = jadwal?.kuota ?? 0;
        const limit = Number(apamSettings['apam_limit'] || 100);
        const online = currKuota / limit;

        const dupCheck = await queryOne(
          'SELECT 1 FROM booking_registrasi WHERE no_rkm_medis = ? AND tanggal_periksa = ? LIMIT 1',
          [noRkmMedis, tanggal],
        );

        if (currCount > online) {
          res.json({ state: 'limit' });
          break;
        }

        if (dupCheck) {
          res.json({ state: 'duplication' });
          break;
        }

        // Create booking
        const now = new Date();
        const mysqlDate = now.toISOString().split('T')[0];
        const mysqlTime = now.toTimeString().split(' ')[0];
        const waktuKunjungan = `${tanggal} ${mysqlTime}`;

        let maxIdSql: string;
        let maxIdParams: unknown[];
        if (siteSettings['dokter_ralan_per_dokter'] === 'true') {
          maxIdSql = 'SELECT IFNULL(MAX(CONVERT(RIGHT(no_reg, 3), SIGNED)), 0) AS max_reg FROM booking_registrasi WHERE kd_poli = ? AND kd_dokter = ? AND tanggal_periksa = ?';
          maxIdParams = [kdPoli, kdDokter, tanggal];
        } else {
          maxIdSql = 'SELECT IFNULL(MAX(CONVERT(RIGHT(no_reg, 3), SIGNED)), 0) AS max_reg FROM booking_registrasi WHERE kd_poli = ? AND tanggal_periksa = ?';
          maxIdParams = [kdPoli, tanggal];
        }

        const maxIdRow = await queryOne(maxIdSql, maxIdParams);
        const maxReg = maxIdRow?.max_reg ?? 0;
        const noReg = String(maxReg + 1).padStart(3, '0');

        await execute(
          `INSERT INTO booking_registrasi (no_rkm_medis, tanggal_periksa, kd_poli, kd_dokter, kd_pj, no_reg, tanggal_booking, jam_booking, waktu_kunjungan, limit_reg, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '1', 'Belum')`,
          [noRkmMedis, tanggal, kdPoli, kdDokter, kdPj, noReg, mysqlDate, mysqlTime, waktuKunjungan],
        );

        res.json({ state: 'success' });

        // Send WhatsApp notification (fire-and-forget)
        try {
          const pasienRow = await queryOne(
            'SELECT no_tlp, nm_pasien FROM pasien WHERE no_rkm_medis = ?',
            [noRkmMedis],
          );
          const poliRow = await queryOne(
            'SELECT nm_poli FROM poliklinik WHERE kd_poli = ?',
            [kdPoli],
          );

          const waSettings = getSetting('wagateway');
          if (pasienRow?.no_tlp && waSettings['server']) {
            const message = [
              `Terima kasih sudah melakukan pendaftaran Online di ${siteSettings['nama_instansi'] || ''}.`,
              '',
              'Detail pendaftaran anda adalah,',
              `Tanggal: ${mysqlDate}`,
              `Nomor Antrian: ${noReg}`,
              `Poliklinik: ${poliRow?.nm_poli || ''}`,
              'Status: Menunggu',
              '',
              'Bawalah kartu berobat anda.',
              'Datanglah 30 menit sebelumnya.',
              '',
              '-------------------',
              `Pesan WhatsApp ini dikirim otomatis oleh ${siteSettings['nama_instansi'] || ''}`,
              'Terima Kasih',
            ].join('\n');

            const waUrl = `${waSettings['server']}/wagateway/kirimpesan`;
            const waBody = new URLSearchParams({
              type: 'text',
              api_key: waSettings['token'] || '',
              sender: waSettings['phonenumber'] || '',
              number: pasienRow.no_tlp,
              message,
            });

            fetch(waUrl, {
              method: 'POST',
              body: waBody,
              signal: AbortSignal.timeout(10_000),
            }).catch(() => {});
          }
        } catch {
          // WhatsApp failure should not break the API response
        }
        break;
      }

      /* ────────────── SUKSES ────────────── */

      case 'sukses': {
        const noRkmMedis = String(input.no_rkm_medis);
        const today = new Date().toISOString().split('T')[0];

        const rows = await query(
          `SELECT a.tanggal_booking, a.tanggal_periksa, a.no_reg, a.status, b.nm_poli, c.nm_dokter, d.png_jawab
           FROM booking_registrasi a
           LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli
           LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter
           LEFT JOIN penjab d ON a.kd_pj = d.kd_pj
           WHERE a.no_rkm_medis = ? AND a.tanggal_booking = ?
             AND a.jam_booking = (SELECT MAX(ax.jam_booking) FROM booking_registrasi ax WHERE ax.tanggal_booking = a.tanggal_booking)
           ORDER BY a.tanggal_booking ASC LIMIT 1`,
          [noRkmMedis, today],
        );
        res.json(rows);
        break;
      }

      /* ────────────── PENGADUAN ────────────── */

      case 'pengaduan': {
        const noRkmMedis = String(input.no_rkm_medis);
        const apamSettings = getSetting('api');
        const petugasArray = (apamSettings['apam_normpetugas'] || '').split(',').map((s: string) => s.trim());

        let rows: RowDataPacket[];
        if (petugasArray.includes(noRkmMedis)) {
          rows = await query(
            `SELECT a.*, b.nm_pasien, b.jk FROM mlite_pengaduan a
             INNER JOIN pasien b ON a.no_rkm_medis = b.no_rkm_medis
             ORDER BY a.tanggal DESC`,
          );
        } else {
          rows = await query(
            `SELECT a.*, b.nm_pasien, b.jk FROM mlite_pengaduan a
             INNER JOIN pasien b ON a.no_rkm_medis = b.no_rkm_medis
             WHERE a.no_rkm_medis = ?
             ORDER BY a.tanggal DESC`,
            [noRkmMedis],
          );
        }
        res.json(rows);
        break;
      }

      case 'pengaduandetail': {
        const pengaduanId = String(input.pengaduan_id);
        const rows = await query(
          'SELECT * FROM mlite_pengaduan_detail WHERE pengaduan_id = ?',
          [pengaduanId],
        );

        if (rows.length === 0) {
          res.json({ state: 'invalid' });
          break;
        }

        for (const row of rows) {
          const pasien = await queryOne(
            'SELECT nm_pasien FROM pasien WHERE no_rkm_medis = ?',
            [row.no_rkm_medis],
          );
          row.nama = pasien?.nm_pasien ?? '';
        }

        res.json(rows);
        break;
      }

      case 'simpanpengaduan': {
        const noRkmMedis = String(input.no_rkm_medis);
        const message = String(input.message);

        const today = new Date().toISOString().split('T')[0];
        const maxIdRow = await queryOne(
          "SELECT IFNULL(MAX(CONVERT(RIGHT(id, 6), SIGNED)), 0) AS max_id FROM mlite_pengaduan WHERE tanggal LIKE ?",
          [`${today}%`],
        );
        const nextId = String((maxIdRow?.max_id ?? 0) + 1).padStart(6, '0');
        const fullId = `${today}${nextId}`;

        await execute(
          'INSERT INTO mlite_pengaduan (id, no_rkm_medis, pesan, tanggal) VALUES (?, ?, ?, NOW())',
          [fullId, noRkmMedis, message],
        );

        res.json({ state: 'success' });
        break;
      }

      case 'simpanpengaduandetail': {
        const noRkmMedis = String(input.no_rkm_medis);
        const message = String(input.message);
        const pengaduanId = String(input.pengaduan_id);

        await execute(
          'INSERT INTO mlite_pengaduan_detail (pengaduan_id, no_rkm_medis, pesan, tanggal) VALUES (?, ?, ?, NOW())',
          [pengaduanId, noRkmMedis, message],
        );

        res.json({ state: 'success' });
        break;
      }

      /* ────────────── RUJUKAN ────────────── */

      case 'cekrujukan': {
        res.json({ state: 'valid' });
        break;
      }

      /* ────────────── LAYANAN ────────────── */

      case 'rawatjalan': {
        const rows = await query(
          "SELECT * FROM poliklinik WHERE status = '1'",
        );
        for (const row of rows) {
          row.registrasi = Number(row.registrasi).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        res.json(rows);
        break;
      }

      case 'rawatinap': {
        const rows = await query(
          `SELECT bangsal.*, kamar.*
           FROM bangsal
           INNER JOIN kamar ON kamar.statusdata = '1' AND bangsal.kd_bangsal = kamar.kd_bangsal`,
        );
        for (const row of rows) {
          row.trf_kamar = Number(row.trf_kamar).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        res.json(rows);
        break;
      }

      case 'laboratorium': {
        const rows = await query(
          "SELECT * FROM jns_perawatan_lab WHERE status = '1'",
        );
        res.json(rows);
        break;
      }

      case 'radiologi': {
        const rows = await query(
          "SELECT * FROM jns_perawatan_radiologi WHERE status = '1'",
        );
        res.json(rows);
        break;
      }

      /* ────────────── HITUNG ────────────── */

      case 'hitungralan': {
        const noRkmMedis = String(input.no_rkm_medis);
        const row = await queryOne(
          'SELECT COUNT(DISTINCT no_rawat) AS cnt FROM reg_periksa WHERE no_rkm_medis = ?',
          [noRkmMedis],
        );
        res.json(row?.cnt ?? 0);
        break;
      }

      case 'hitungranap': {
        const noRkmMedis = String(input.no_rkm_medis);
        const row = await queryOne(
          `SELECT COUNT(DISTINCT ki.no_rawat) AS cnt
           FROM kamar_inap ki
           INNER JOIN reg_periksa r ON r.no_rawat = ki.no_rawat
           WHERE r.no_rkm_medis = ?`,
          [noRkmMedis],
        );
        res.json(row?.cnt ?? 0);
        break;
      }

      /* ────────────── LAYANAN UNGGULAN ────────────── */

      case 'layananunggulan': {
        const rows = all<{ field: string; value: string | null }>(
          "SELECT field, value FROM mlite_settings WHERE module = 'website'",
        );
        const data: Record<string, string> = {};
        for (const r of rows) {
          if (r.value) data[r.field] = r.value;
        }
        res.json([data]);
        break;
      }

      /* ────────────── NEWS ────────────── */

      case 'lastnews': {
        void input;
        const siteSettings = getSetting('settings');
        const limit = Number(siteSettings['latestPostsCount'] || 3);

        const rows = await query(
          `SELECT n.id, n.title, n.cover_photo, n.published_at, n.slug, n.intro, n.content,
                  u.username, u.fullname
           FROM mlite_news n
           LEFT JOIN mlite_users u ON u.id = n.user_id
           WHERE n.status = 2 AND n.published_at <= UNIX_TIMESTAMP()
           ORDER BY n.published_at DESC
           LIMIT ?`,
          [limit],
        );

        for (const row of rows) {
          const tagRow = await queryOne(
            `SELECT t.name
             FROM mlite_news_tags t
             INNER JOIN mlite_news_tags_relationship tr ON t.id = tr.tag_id
             WHERE tr.news_id = ?`,
            [row.id],
          );
          row.tag = tagRow?.name ?? '';
          const pubDate = new Date(row.published_at * 1000);
          row.tanggal = `${getDayIndonesia(pubDate.toISOString())}, ${dateIndonesia(pubDate.toISOString())}`;
        }

        res.json(rows);
        break;
      }

      case 'news': {
        void input;
        const rows = await query(
          `SELECT n.id, n.title, n.cover_photo, n.published_at, n.slug, n.intro, n.content,
                  u.username, u.fullname
           FROM mlite_news n
           LEFT JOIN mlite_users u ON u.id = n.user_id
           WHERE n.status = 2 AND n.published_at <= UNIX_TIMESTAMP()
           ORDER BY n.published_at DESC`,
        );

        for (const row of rows) {
          const tagRow = await queryOne(
            `SELECT t.name
             FROM mlite_news_tags t
             INNER JOIN mlite_news_tags_relationship tr ON t.id = tr.tag_id
             WHERE tr.news_id = ?`,
            [row.id],
          );
          row.tag = tagRow?.name ?? '';
          const pubDate = new Date(row.published_at * 1000);
          row.tanggal = `${getDayIndonesia(pubDate.toISOString())}, ${dateIndonesia(pubDate.toISOString())}`;
        }

        res.json(rows);
        break;
      }

      case 'newsdetail': {
        const id = String(input.id);
        const row = await queryOne(
          'SELECT id, title, cover_photo, content, published_at FROM mlite_news WHERE id = ?',
          [id],
        );
        if (row) {
          const pubDate = new Date(row.published_at * 1000);
          row.tanggal = `${getDayIndonesia(pubDate.toISOString())}, ${dateIndonesia(pubDate.toISOString())}`;
        }
        res.json(row ? [row] : []);
        break;
      }

      /* ────────────── TELEMEDICINE ────────────── */

      case 'telemedicine': {
        const tanggal = String(input.tanggal || '');
        const getTanggal = tanggal || new Date().toISOString().split('T')[0];
        const namahari = dayNameID(getTanggal);

        const rows = await query(
          `SELECT d.nm_dokter, d.jk, p.nm_poli, p.kd_poli,
                  DATE_FORMAT(j.jam_mulai, '%H:%i') AS jam_mulai,
                  DATE_FORMAT(j.jam_selesai, '%H:%i') AS jam_selesai,
                  d.kd_dokter
           FROM jadwal j
           INNER JOIN dokter d ON d.kd_dokter = j.kd_dokter
           INNER JOIN poliklinik p ON j.kd_poli = p.kd_poli
           WHERE j.hari_kerja = ?`,
          [namahari],
        );

        if (rows.length === 0) {
          res.json({ state: 'notfound' });
        } else {
          const duitkuSettings = getSetting('api');
          for (const row of rows) {
            row.biaya = duitkuSettings['duitku_paymentAmount'] || '';
          }
          res.json(rows);
        }
        break;
      }

      case 'duitku_callback': {
        const duitkuSettings = getSetting('api');
        const apiKey = duitkuSettings['duitku_merchantKey'] || '';
        const merchantCode = String(input.merchantCode);
        const amount = String(input.amount);
        const merchantOrderId = String(input.merchantOrderId);
        const signature = String(input.signature);
        const resultCode = String(input.resultCode || '');

        if (!merchantCode || !amount || !merchantOrderId || !signature) {
          res.status(400).json({ error: 'Bad Parameter' });
          return;
        }

        const calcSignature = crypto
          .createHash('md5')
          .update(merchantCode + amount + merchantOrderId + apiKey)
          .digest('hex');

        if (signature !== calcSignature) {
          res.status(403).json({ error: 'Bad Signature' });
          return;
        }

        if (resultCode === '00') {
          res.send('SUCCESS');
        } else {
          res.send('FAILED');
        }
        break;
      }

      case 'telemedicinedaftar': {
        const noRkmMedis = String(input.no_rkm_medis);
        const tanggal = String(input.tanggal);
        const kdPoli = String(input.kd_poli);
        const kdDokter = String(input.kd_dokter);
        const hari = dayNameShort(tanggal);

        const apamSettings = getSetting('api');
        const siteSettings = getSetting('settings');
        const duitkuSettings = getSetting('api');
        const kdPj = duitkuSettings['duitku_kdpj'] || '';

        const jadwal = await queryOne(
          'SELECT kuota FROM jadwal WHERE kd_poli = ? AND hari_kerja = ?',
          [kdPoli, hari],
        );

        let checkKuotaSql: string;
        let checkKuotaParams: unknown[];
        if (siteSettings['dokter_ralan_per_dokter'] === 'true') {
          checkKuotaSql = 'SELECT COUNT(DISTINCT no_reg) AS cnt FROM booking_registrasi WHERE kd_poli = ? AND kd_dokter = ? AND tanggal_periksa = ?';
          checkKuotaParams = [kdPoli, kdDokter, tanggal];
        } else {
          checkKuotaSql = 'SELECT COUNT(DISTINCT no_reg) AS cnt FROM booking_registrasi WHERE kd_poli = ? AND tanggal_periksa = ?';
          checkKuotaParams = [kdPoli, tanggal];
        }

        const kuotaRow = await queryOne(checkKuotaSql, checkKuotaParams);
        const currCount = kuotaRow?.cnt ?? 0;
        const currKuota = jadwal?.kuota ?? 0;
        const limit = Number(apamSettings['apam_limit'] || 100);
        const online = currKuota / limit;

        const dupCheck = await queryOne(
          'SELECT 1 FROM booking_registrasi WHERE no_rkm_medis = ? AND tanggal_periksa = ? LIMIT 1',
          [noRkmMedis, tanggal],
        );

        if (currCount > online) {
          res.json({ state: 'limit' });
          break;
        }

        if (dupCheck) {
          res.json({ state: 'duplication' });
          break;
        }

        const now = new Date();
        const mysqlDate = now.toISOString().split('T')[0];
        const mysqlTime = now.toTimeString().split(' ')[0];
        const waktuKunjungan = `${tanggal} ${mysqlTime}`;

        let maxIdSql: string;
        let maxIdParams: unknown[];
        if (siteSettings['dokter_ralan_per_dokter'] === 'true') {
          maxIdSql = 'SELECT IFNULL(MAX(CONVERT(RIGHT(no_reg, 3), SIGNED)), 0) AS max_reg FROM booking_registrasi WHERE kd_poli = ? AND kd_dokter = ? AND tanggal_periksa = ?';
          maxIdParams = [kdPoli, kdDokter, tanggal];
        } else {
          maxIdSql = 'SELECT IFNULL(MAX(CONVERT(RIGHT(no_reg, 3), SIGNED)), 0) AS max_reg FROM booking_registrasi WHERE kd_poli = ? AND tanggal_periksa = ?';
          maxIdParams = [kdPoli, tanggal];
        }

        const maxIdRow = await queryOne(maxIdSql, maxIdParams);
        const maxReg = maxIdRow?.max_reg ?? 0;
        const noReg = String(maxReg + 1).padStart(3, '0');

        await execute(
          `INSERT INTO booking_registrasi (no_rkm_medis, tanggal_periksa, kd_poli, kd_dokter, kd_pj, no_reg, tanggal_booking, jam_booking, waktu_kunjungan, limit_reg, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '1', 'Belum')`,
          [noRkmMedis, tanggal, kdPoli, kdDokter, kdPj, noReg, mysqlDate, mysqlTime, waktuKunjungan],
        );

        res.json({ state: 'success' });

        // Duitku payment integration (fire-and-forget)
        try {
          const pasienRow = await queryOne(
            'SELECT no_rkm_medis, email, no_tlp, nm_pasien FROM pasien WHERE no_rkm_medis = ?',
            [noRkmMedis],
          );
          const poliRow = await queryOne(
            'SELECT nm_poli FROM poliklinik WHERE kd_poli = ?',
            [kdPoli],
          );

          const merchantCode = duitkuSettings['duitku_merchantCode'] || '';
          const merchantKey = duitkuSettings['duitku_merchantKey'] || '';
          const paymentAmount = duitkuSettings['duitku_paymentAmount'] || '';
          const paymentMethod = duitkuSettings['duitku_paymentMethod'] || '';
          const merchantOrderId = String(Math.floor(Date.now() / 1000));
          const productDetails = duitkuSettings['duitku_productDetails'] || '';
          const expiryPeriod = duitkuSettings['duitku_expiryPeriod'] || '';
          const token = (req.body.token ?? '').toString().trim();

          const sigStr = merchantCode + merchantOrderId + paymentAmount + merchantKey;
          const duitkuSignature = crypto.createHash('md5').update(sigStr).digest('hex');

          const callbackUrl = `${siteSettings['apam_webappsurl'] || ''}/api/apam/?action=duitku_callback&token=${token}`;
          const returnUrl = `${siteSettings['apam_webappsurl'] || ''}/api/apam/?action=duitku&token=${token}`;

          const duitkuPayload = {
            merchantCode,
            paymentAmount: Number(paymentAmount),
            paymentMethod,
            merchantOrderId,
            productDetails,
            additionalParam: '',
            merchantUserInfo: '',
            customerVaName: pasienRow?.nm_pasien || '',
            email: pasienRow?.email || '',
            phoneNumber: pasienRow?.no_tlp || '',
            itemDetails: [
              {
                name: productDetails,
                price: Number(paymentAmount),
                quantity: 1,
              },
            ],
            callbackUrl,
            returnUrl,
            signature: duitkuSignature,
            expiryPeriod,
          };

          const duitkuResp = await fetch(
            'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(duitkuPayload),
            },
          );

          if (duitkuResp.ok) {
            const duitkuResult = (await duitkuResp.json()) as Record<string, unknown>;
            await execute(
              `INSERT INTO mlite_duitku (tanggal, no_rkm_medis, paymentUrl, merchantCode, reference, vaNumber, amount, statusCode, statusMessage)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                waktuKunjungan,
                noRkmMedis,
                duitkuResult.paymentUrl || '',
                duitkuResult.merchantCode || '',
                duitkuResult.reference || '',
                duitkuResult.vaNumber || '',
                duitkuResult.amount || 0,
                duitkuResult.statusCode || '',
                duitkuResult.statusMessage || '',
              ],
            );
          }

          // WhatsApp notification
          const waSettings = getSetting('wagateway');
          if (pasienRow?.no_tlp && waSettings['server']) {
            const message = [
              `Terima kasih sudah melakukan pendaftaran Online Telemedicine di ${siteSettings['nama_instansi'] || ''}.`,
              '',
              'Detail pendaftaran Telemedicine anda adalah,',
              `Tanggal: ${mysqlDate}`,
              `Nomor Antrian: ${noReg}`,
              `Poliklinik: ${poliRow?.nm_poli || ''}`,
              'Status: Menunggu',
              '',
              `Silahkan lakukan pembayaran dengan mengklik link berikut ${duitkuPayload.callbackUrl}.`,
              '',
              '-------------------',
              `Pesan WhatsApp ini dikirim otomatis oleh ${siteSettings['nama_instansi'] || ''}`,
              'Terima Kasih',
            ].join('\n');

            const waUrl = `${waSettings['server']}/wagateway/kirimpesan`;
            const waBody = new URLSearchParams({
              type: 'text',
              api_key: waSettings['token'] || '',
              sender: waSettings['phonenumber'] || '',
              number: pasienRow.no_tlp,
              message,
            });

            fetch(waUrl, {
              method: 'POST',
              body: waBody,
              signal: AbortSignal.timeout(10_000),
            }).catch(() => {});
          }
        } catch {
          // Payment/WhatsApp failure should not break the response
        }
        break;
      }

      case 'telemedicinesukses': {
        const noRkmMedis = String(input.no_rkm_medis);
        const today = new Date().toISOString().split('T')[0];

        const rows = await query(
          `SELECT a.tanggal_booking, a.tanggal_periksa, a.no_reg, a.status, b.nm_poli, c.nm_dokter, d.png_jawab, a.jam_booking
           FROM booking_registrasi a
           LEFT JOIN poliklinik b ON a.kd_poli = b.kd_poli
           LEFT JOIN dokter c ON a.kd_dokter = c.kd_dokter
           LEFT JOIN penjab d ON a.kd_pj = d.kd_pj
           WHERE a.no_rkm_medis = ? AND a.tanggal_booking = ?
             AND a.jam_booking = (SELECT MAX(ax.jam_booking) FROM booking_registrasi ax WHERE ax.tanggal_booking = a.tanggal_booking)
           ORDER BY a.tanggal_booking ASC LIMIT 1`,
          [noRkmMedis, today],
        );

        for (const row of rows) {
          const duitkuRow = await queryOne(
            'SELECT paymentUrl FROM mlite_duitku WHERE no_rkm_medis = ? AND tanggal = ?',
            [noRkmMedis, `${row.tanggal_booking} ${row.jam_booking}`],
          );
          row.paymentUrl = duitkuRow?.paymentUrl ?? '';
        }

        res.json(rows);
        break;
      }

      /* ────────────── RETENSI ────────────── */

      case 'simpanretensirekammedik': {
        const noRkmMedis = String(input.no_rkm_medis);
        const today = new Date().toISOString().split('T')[0];

        const result = await execute(
          'INSERT INTO retensi_pasien (no_rkm_medis, terakhir_daftar, tgl_retensi, lokasi_pdf) VALUES (?, ?, ?, ?)',
          [noRkmMedis, today, today, '-'],
        );

        if (result.affectedRows > 0) {
          res.json({ state: 'success' });
        } else {
          res.json({ state: 'error' });
        }
        break;
      }

      /* ────────────── ANTRIAN ────────────── */

      case 'antrian': {
        res.json({ state: 'valid' });
        break;
      }

      /* ────────────── DEFAULT ────────────── */

      default:
        res.json({ error: 'Unknown action' });
        break;
    }
  } catch (err) {
    console.error('[apam] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
