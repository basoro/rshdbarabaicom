import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  createSessionToken,
  createSlug,
  hasAdminAccess,
  hashPassword,
  nowUnix,
  verifyPassword,
} from '../lib/auth.js';
import {
  all,
  cleanupExpiredSessions,
  get,
  run,
  syncLegacyUser,
  toNumber,
} from '../lib/database.js';
import { resolveNewsCover } from '../lib/uploadPaths.js';
import { requireAdmin, requireAdminModule } from '../middleware/requireAdmin.js';

type UserRow = {
  id: number;
  username: string;
  fullname: string | null;
  description: string | null;
  email: string;
  password: string;
  avatar: string;
  role: string;
  cap: string | null;
  access: string;
};

type PageRow = {
  id: number;
  title: string;
  slug: string;
  desc: string | null;
  template: string;
  date: string;
  content: string;
  markdown: number;
};

type NewsRow = {
  id: number;
  title: string;
  slug: string;
  user_id: number;
  intro: string | null;
  content: string;
  cover_photo: string | null;
  status: number;
  comments: number;
  markdown: number;
  views: number;
  published_at: number;
  updated_at: number;
  created_at: number;
  author_name: string | null;
};

type ArchiveRow = {
  id: number;
  kategori: string;
  jenis: string;
  nama_dokumen: string;
  tahun: number;
  file_path: string;
  ekstensi: string;
  created_at: string;
};

type LegacyNamingRequest = Request & {
  _useLegacyMliteNaming?: boolean;
  _archiveVisibility?: 'public' | 'private';
};

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const uploadsRoot = path.join(projectRoot, 'uploads');
const localMediaRoot = path.join(projectRoot, 'api', 'public', 'media', 'local');
const privateArsipRoot = path.join(projectRoot, 'private-arsip');
const envLegacyRoot = (process.env.LIVE_LEGACY_ARCHIVE_ROOT || '').trim();

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    const req = _req as LegacyNamingRequest;
    const requestTarget =
      typeof _req.query.target === 'string'
        ? _req.query.target
        : typeof _req.body.target === 'string'
          ? _req.body.target
          : 'misc';
    const target = requestTarget.replace(/[^a-z0-9-_]+/gi, '').toLowerCase() || 'misc';
    const rawVisibility =
      (typeof _req.query.visibility === 'string'
        ? _req.query.visibility
        : typeof _req.body.visibility === 'string'
          ? _req.body.visibility
          : 'public') || 'public';
    const visibility = rawVisibility.toLowerCase() === 'private' ? 'private' : 'public';

    req._archiveVisibility = visibility;
    req._useLegacyMliteNaming = false;

    if (target === 'arsip' && envLegacyRoot) {
      const resolvedLegacyRoot = path.resolve(envLegacyRoot);
      if (visibility === 'private') {
        const legacyPrivate = path.join(resolvedLegacyRoot, 'arsipdokumen', 'pdfprivate');
        try {
          if (!fs.existsSync(legacyPrivate)) {
            fs.mkdirSync(legacyPrivate, { recursive: true });
          }
          fs.accessSync(legacyPrivate, fs.constants.W_OK);
          req._useLegacyMliteNaming = true;
          callback(null, legacyPrivate);
          return;
        } catch {
          // fallback to privateArsipRoot (default project) below
        }
      } else {
        const legacyPublic = path.join(resolvedLegacyRoot, 'arsipdokumen', 'pdf');
        try {
          if (!fs.existsSync(legacyPublic)) {
            fs.mkdirSync(legacyPublic, { recursive: true });
          }
          fs.accessSync(legacyPublic, fs.constants.W_OK);
          req._useLegacyMliteNaming = true;
          callback(null, legacyPublic);
          return;
        } catch {
          // fallback to localMediaRoot/arsip (default project) below
        }
      }
    }

    if (target === 'arsip' && visibility === 'private') {
      fs.mkdirSync(privateArsipRoot, { recursive: true });
      callback(null, privateArsipRoot);
      return;
    }
    const folder = ['news', 'pages', 'arsip'].includes(target)
      ? path.join(localMediaRoot, target)
      : path.join(uploadsRoot, target);
    fs.mkdirSync(folder, { recursive: true });
    callback(null, folder);
  },
  filename: (_req, file, callback) => {
    const req = _req as LegacyNamingRequest;
    const extension = (path.extname(file.originalname) || '').toLowerCase() || '.pdf';
    if (req._useLegacyMliteNaming === true) {
      const hashPart1 = crypto.randomBytes(6).toString('hex');
      const hashPart2 = crypto.randomBytes(4).toString('hex');
      callback(null, `${hashPart1}_${hashPart2}${extension}`);
      return;
    }
    const baseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    callback(null, `${Date.now()}-${baseName || 'file'}${extension}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  desc: z.string().nullable().optional(),
  template: z.string().default('page.html'),
  date: z.string().min(1),
  content: z.string().min(1),
  markdown: z.coerce.number().default(0),
});

const newsSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  intro: z.string().nullable().optional(),
  content: z.string().min(1),
  cover_photo: z.string().nullable().optional(),
  status: z.coerce.number().default(1),
  comments: z.coerce.number().default(1),
  markdown: z.coerce.number().default(0),
  published_at: z.coerce.number().optional(),
});

const archiveSchema = z.object({
  kategori: z.string().min(1),
  jenis: z.string().min(1),
  nama_dokumen: z.string().min(1),
  tahun: z.coerce.number().int(),
  file_path: z.string().min(1),
  ekstensi: z.string().min(1),
});

const settingsSchema = z.object({
  settings: z.record(z.string()),
});

const userSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  fullname: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  email: z.string().email('Email tidak valid.'),
  password: z.string().optional(),
  avatar: z.string().optional().default(''),
  role: z.string().default('admin'),
  cap: z.string().nullable().optional(),
  access: z.string().default('dashboard'),
});

function sanitizeUser(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    fullname: row.fullname,
    description: row.description,
    email: row.email,
    avatar: row.avatar,
    role: row.role,
    cap: row.cap,
    access: row.access,
  };
}

function mapNews(row: NewsRow) {
  return {
    ...row,
    cover_url: resolveNewsCover(row.cover_photo),
    author: {
      name: row.author_name ?? 'Admin RSHD',
    },
  };
}

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Data login tidak valid.',
    });
    return;
  }

  const user = get<UserRow>(
    `SELECT id, username, fullname, description, email, password, avatar, role, cap, access FROM mlite_users WHERE username = ? LIMIT 1`,
    [parsed.data.username],
  );

  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    res.status(401).json({
      success: false,
      error: 'Username atau password salah.',
    });
    return;
  }

  const currentTime = nowUnix();
  const expiresAt = currentTime + 60 * 60 * 24 * 14;
  const token = createSessionToken();

  cleanupExpiredSessions(currentTime);
  run(`DELETE FROM admin_sessions WHERE user_id = ?`, [user.id]);
  run(
    `INSERT INTO admin_sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [user.id, token, expiresAt, currentTime],
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
        avatar: user.avatar,
        role: user.role,
        description: user.description,
        cap: user.cap,
        access: user.access,
      },
    },
  });
});

router.use(requireAdmin);

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  const requestTarget =
    typeof req.query.target === 'string'
      ? req.query.target
      : typeof req.body.target === 'string'
        ? req.body.target
        : 'misc';
  const target = requestTarget.replace(/[^a-z0-9-_]+/gi, '').toLowerCase() || 'misc';
  const targetAccessMap = {
    pages: 'pages',
    news: 'news',
    arsip: 'arsip',
    users: 'users',
    avatars: 'users',
    settings: 'settings',
  } as const;
  const requiredAccess = targetAccessMap[target as keyof typeof targetAccessMap];

  if (requiredAccess && !req.adminUser) {
    res.status(401).json({
      success: false,
      error: 'Sesi admin tidak valid.',
    });
    return;
  }

  if (
    requiredAccess &&
    req.adminUser &&
    !hasAdminAccess(req.adminUser.access, requiredAccess)
  ) {
    res.status(403).json({
      success: false,
      error: `Akun ini tidak memiliki akses upload untuk modul ${requiredAccess}.`,
    });
    return;
  }

  const uploadedFile = req.file;

  if (!uploadedFile) {
    res.status(400).json({
      success: false,
      error: 'File upload tidak ditemukan.',
    });
    return;
  }

  let relativePath = path
    .relative(projectRoot, uploadedFile.path)
    .split(path.sep)
    .join('/');

  if (envLegacyRoot) {
    const resolvedLegacyRoot = path.resolve(envLegacyRoot);
    const absUploadedPath = path.resolve(uploadedFile.path);
    const legacyPrefix = resolvedLegacyRoot + path.sep;
    if (absUploadedPath.startsWith(legacyPrefix) || absUploadedPath === resolvedLegacyRoot) {
      relativePath = path
        .relative(resolvedLegacyRoot, absUploadedPath)
        .split(path.sep)
        .join('/');
    }
  }

  res.json({
    success: true,
    data: {
      fileName: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      filePath: relativePath,
      fileUrl: `/${relativePath}`,
    },
  });
});

router.get('/session', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.adminUser,
    },
  });
});

router.get('/users', requireAdminModule('users'), (_req: Request, res: Response) => {
  const users = all<UserRow>(
    `
      SELECT id, username, fullname, description, email, password, avatar, role, cap, access
      FROM mlite_users
      ORDER BY fullname ASC, username ASC
    `,
  ).map(sanitizeUser);

  res.json({
    success: true,
    data: users,
  });
});

router.post('/users', requireAdminModule('users'), async (req: Request, res: Response) => {
  const parsed = userSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Data pengguna tidak valid.',
    });
    return;
  }

  const payload = parsed.data;
  const password = payload.password?.trim();

  if (!password) {
    res.status(400).json({
      success: false,
      error: 'Password wajib diisi untuk pengguna baru.',
    });
    return;
  }

  const duplicateUser = get<{ id: number }>(
    `SELECT id FROM mlite_users WHERE username = ? OR email = ? LIMIT 1`,
    [payload.username, payload.email],
  );

  if (duplicateUser) {
    res.status(409).json({
      success: false,
      error: 'Username atau email sudah digunakan.',
    });
    return;
  }

  const passwordHash = await hashPassword(password);
  const result = run(
    `
      INSERT INTO mlite_users (
        username, fullname, description, password, avatar, email, role, cap, access
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.username.trim(),
      payload.fullname?.trim() ?? '',
      payload.description?.trim() ?? '',
      passwordHash,
      payload.avatar?.trim() ?? '',
      payload.email.trim(),
      payload.role.trim() || 'admin',
      payload.cap?.trim() ?? '',
      payload.access.trim() || 'dashboard',
    ],
  );

  syncLegacyUser({
    id: toNumber(result.lastInsertRowid),
    username: payload.username.trim(),
    fullname: payload.fullname?.trim() ?? '',
    email: payload.email.trim(),
  });

  res.json({
    success: true,
    data: { id: toNumber(result.lastInsertRowid) },
  });
});

router.put('/users/:id', requireAdminModule('users'), async (req: Request, res: Response) => {
  const parsed = userSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Data pengguna tidak valid.',
    });
    return;
  }

  const userId = Number(req.params.id);
  const payload = parsed.data;
  const currentUser = get<UserRow>(
    `
      SELECT id, username, fullname, description, email, password, avatar, role, cap, access
      FROM mlite_users
      WHERE id = ?
      LIMIT 1
    `,
    [userId],
  );

  if (!currentUser) {
    res.status(404).json({
      success: false,
      error: 'Pengguna tidak ditemukan.',
    });
    return;
  }

  const duplicateUser = get<{ id: number }>(
    `SELECT id FROM mlite_users WHERE (username = ? OR email = ?) AND id != ? LIMIT 1`,
    [payload.username, payload.email, userId],
  );

  if (duplicateUser) {
    res.status(409).json({
      success: false,
      error: 'Username atau email sudah digunakan.',
    });
    return;
  }

  const nextPassword = payload.password?.trim()
    ? await hashPassword(payload.password.trim())
    : currentUser.password;

  run(
    `
      UPDATE mlite_users
      SET username = ?, fullname = ?, description = ?, password = ?, avatar = ?,
          email = ?, role = ?, cap = ?, access = ?
      WHERE id = ?
    `,
    [
      payload.username.trim(),
      payload.fullname?.trim() ?? '',
      payload.description?.trim() ?? '',
      nextPassword,
      payload.avatar?.trim() ?? '',
      payload.email.trim(),
      payload.role.trim() || 'admin',
      payload.cap?.trim() ?? '',
      payload.access.trim() || 'dashboard',
      userId,
    ],
  );

  syncLegacyUser({
    id: userId,
    username: payload.username.trim(),
    fullname: payload.fullname?.trim() ?? '',
    email: payload.email.trim(),
  });

  res.json({ success: true });
});

router.delete('/users/:id', requireAdminModule('users'), (req: Request, res: Response) => {
  const userId = Number(req.params.id);

  if (req.adminUser?.id === userId) {
    res.status(400).json({
      success: false,
      error: 'Anda tidak bisa menghapus akun yang sedang dipakai login.',
    });
    return;
  }

  run(`DELETE FROM admin_sessions WHERE user_id = ?`, [userId]);
  run(`DELETE FROM mlite_users WHERE id = ?`, [userId]);
  res.json({ success: true });
});

router.post('/logout', (req: Request, res: Response) => {
  if (req.authToken) {
    run(`DELETE FROM admin_sessions WHERE token = ?`, [req.authToken]);
  }

  res.json({
    success: true,
  });
});

router.get('/dashboard', requireAdminModule('dashboard'), (req: Request, res: Response) => {
  const pages = get<{ total: number }>(`SELECT COUNT(*) AS total FROM pages`)?.total ?? 0;
  const news = get<{ total: number }>(`SELECT COUNT(*) AS total FROM mlite_news`)?.total ?? 0;
  const archives = get<{ total: number }>(`SELECT COUNT(*) AS total FROM arsip_dokumen`)?.total ?? 0;
  const users = get<{ total: number }>(`SELECT COUNT(*) AS total FROM mlite_users`)?.total ?? 0;
  const visits = get<{ total: number }>(`SELECT COUNT(*) AS total FROM site_visits`)?.total ?? 0;

  const newsByUser = all<{ user_id: number; username: string; fullname: string | null; total: number }>(
    `
      SELECT n.user_id, u.username, u.fullname, COUNT(*) AS total
      FROM mlite_news n
      LEFT JOIN mlite_users u ON u.id = n.user_id
      GROUP BY n.user_id, u.username, u.fullname
      ORDER BY total DESC
      LIMIT 12
    `,
  ).map((row) => ({
    user_id: row.user_id,
    label: row.fullname?.trim() || row.username || 'Anonim',
    total: row.total,
  }));

  const currentYear = new Date().getFullYear();
  const yearStart = Math.floor(new Date(currentYear, 0, 1).getTime() / 1000);
  const yearEnd = Math.floor(new Date(currentYear + 1, 0, 1).getTime() / 1000);
  const newsByMonthRows = all<{ bulan: number; total: number }>(
    `
      SELECT CAST(strftime('%m', datetime(published_at, 'unixepoch')) AS INTEGER) AS bulan,
             COUNT(*) AS total
      FROM mlite_news
      WHERE published_at >= ? AND published_at < ?
      GROUP BY bulan
      ORDER BY bulan ASC
    `,
    [yearStart, yearEnd],
  );
  const visitsByMonthRows = all<{ bulan: number; total: number }>(
    `
      SELECT CAST(strftime('%m', datetime(created_at, 'unixepoch')) AS INTEGER) AS bulan,
             COUNT(*) AS total
      FROM site_visits
      WHERE created_at >= ? AND created_at < ?
      GROUP BY bulan
      ORDER BY bulan ASC
    `,
    [yearStart, yearEnd],
  );

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const newsByMonth = monthLabels.map((label, index) => {
    const match = newsByMonthRows.find((row) => row.bulan === index + 1);
    return {
      month: index + 1,
      label,
      total: match?.total ?? 0,
    };
  });
  const visitsByMonth = monthLabels.map((label, index) => {
    const match = visitsByMonthRows.find((row) => row.bulan === index + 1);
    return {
      month: index + 1,
      label,
      total: match?.total ?? 0,
    };
  });

  res.json({
    success: true,
    data: {
      cards: [
        { label: 'Halaman', value: pages },
        { label: 'Berita', value: news },
        { label: 'Arsip', value: archives },
        { label: 'Admin', value: users },
        { label: 'Kunjungan', value: visits },
      ],
      newsByUser,
      newsByMonth,
      visitsByMonth,
      currentUser: req.adminUser,
    },
  });
});

router.get('/pages', requireAdminModule('pages'), (_req: Request, res: Response) => {
  const items = all<PageRow>(`SELECT * FROM pages ORDER BY id ASC`);
  res.json({ success: true, data: items });
});

router.post('/pages', requireAdminModule('pages'), (req: Request, res: Response) => {
  const parsed = pageSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Data halaman tidak valid.' });
    return;
  }

  const payload = parsed.data;
  const pageSlug = payload.slug?.trim() || createSlug(payload.title);
  const result = run(
    `
      INSERT INTO pages (title, slug, desc, template, date, content, markdown)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.title,
      pageSlug,
      payload.desc ?? '',
      payload.template,
      payload.date,
      payload.content,
      payload.markdown,
    ],
  );

  res.json({
    success: true,
    data: {
      id: toNumber(result.lastInsertRowid),
    },
  });
});

router.put('/pages/:id', requireAdminModule('pages'), (req: Request, res: Response) => {
  const parsed = pageSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Data halaman tidak valid.' });
    return;
  }

  const payload = parsed.data;
  const pageId = Number(req.params.id);
  const pageSlug = payload.slug?.trim() || createSlug(payload.title);
  run(
    `
      UPDATE pages
      SET title = ?, slug = ?, desc = ?, template = ?, date = ?, content = ?, markdown = ?
      WHERE id = ?
    `,
    [
      payload.title,
      pageSlug,
      payload.desc ?? '',
      payload.template,
      payload.date,
      payload.content,
      payload.markdown,
      pageId,
    ],
  );

  res.json({ success: true });
});

router.delete('/pages/:id', requireAdminModule('pages'), (req: Request, res: Response) => {
  const pageId = Number(req.params.id);
  run(`DELETE FROM pages WHERE id = ?`, [pageId]);
  res.json({ success: true });
});

router.get('/news', requireAdminModule('news'), (_req: Request, res: Response) => {
  const items = all<NewsRow>(
    `
      SELECT n.*, u.fullname AS author_name
      FROM mlite_news n
      LEFT JOIN mlite_users u ON u.id = n.user_id
      ORDER BY n.updated_at DESC, n.id DESC
    `,
  );

  res.json({
    success: true,
    data: items.map(mapNews),
  });
});

router.post('/news', requireAdminModule('news'), (req: Request, res: Response) => {
  const parsed = newsSchema.safeParse(req.body);

  if (!parsed.success || !req.adminUser) {
    res.status(400).json({
      success: false,
      error: parsed.success ? 'Data berita tidak valid.' : parsed.error.issues[0]?.message || 'Data berita tidak valid.',
    });
    return;
  }

  const payload = parsed.data;
  const currentTime = nowUnix();
  const newsSlug = payload.slug?.trim() || createSlug(payload.title);
  const publishedAt =
    payload.published_at || (payload.status === 2 ? currentTime : 0);

  const result = run(
    `
      INSERT INTO mlite_news (
        title, slug, user_id, content, intro, cover_photo, status, comments, markdown,
        published_at, updated_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.title,
      newsSlug,
      req.adminUser.id,
      payload.content,
      payload.intro ?? '',
      payload.cover_photo ?? '',
      payload.status,
      payload.comments,
      payload.markdown,
      publishedAt,
      currentTime,
      currentTime,
    ],
  );

  const newsId = toNumber(result.lastInsertRowid);

  res.json({
    success: true,
    data: { id: newsId },
  });
});

router.put('/news/:id', requireAdminModule('news'), (req: Request, res: Response) => {
  const parsed = newsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message || 'Data berita tidak valid.',
    });
    return;
  }

  const payload = parsed.data;
  const newsId = Number(req.params.id);
  const currentNews = get<NewsRow>(`SELECT * FROM mlite_news WHERE id = ? LIMIT 1`, [newsId]);
  const currentTime = nowUnix();
  const newsSlug = payload.slug?.trim() || createSlug(payload.title);
  const publishedAt =
    payload.published_at ||
    currentNews?.published_at ||
    (payload.status === 2 ? currentTime : 0);

  run(
    `
      UPDATE mlite_news
      SET title = ?, slug = ?, content = ?, intro = ?, cover_photo = ?, status = ?,
          comments = ?, markdown = ?, published_at = ?, updated_at = ?
      WHERE id = ?
    `,
    [
      payload.title,
      newsSlug,
      payload.content,
      payload.intro ?? '',
      payload.cover_photo ?? '',
      payload.status,
      payload.comments,
      payload.markdown,
      publishedAt,
      currentTime,
      newsId,
    ],
  );

  res.json({ success: true });
});

router.delete('/news/:id', requireAdminModule('news'), (req: Request, res: Response) => {
  const newsId = Number(req.params.id);
  run(`DELETE FROM mlite_news WHERE id = ?`, [newsId]);
  res.json({ success: true });
});

router.get('/arsip', requireAdminModule('arsip'), (_req: Request, res: Response) => {
  const items = all<ArchiveRow>(`SELECT * FROM arsip_dokumen ORDER BY tahun DESC, id DESC`);
  res.json({ success: true, data: items });
});

router.post('/arsip', requireAdminModule('arsip'), (req: Request, res: Response) => {
  const parsed = archiveSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Data arsip tidak valid.' });
    return;
  }

  const result = run(
    `
      INSERT INTO arsip_dokumen (kategori, jenis, nama_dokumen, tahun, file_path, ekstensi)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      parsed.data.kategori,
      parsed.data.jenis,
      parsed.data.nama_dokumen,
      parsed.data.tahun,
      parsed.data.file_path,
      parsed.data.ekstensi,
    ],
  );

  res.json({
    success: true,
    data: { id: toNumber(result.lastInsertRowid) },
  });
});

router.put('/arsip/:id', requireAdminModule('arsip'), (req: Request, res: Response) => {
  const parsed = archiveSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Data arsip tidak valid.' });
    return;
  }

  run(
    `
      UPDATE arsip_dokumen
      SET kategori = ?, jenis = ?, nama_dokumen = ?, tahun = ?, file_path = ?, ekstensi = ?
      WHERE id = ?
    `,
    [
      parsed.data.kategori,
      parsed.data.jenis,
      parsed.data.nama_dokumen,
      parsed.data.tahun,
      parsed.data.file_path,
      parsed.data.ekstensi,
      Number(req.params.id),
    ],
  );
  res.json({ success: true });
});

router.delete('/arsip/:id', requireAdminModule('arsip'), (req: Request, res: Response) => {
  run(`DELETE FROM arsip_dokumen WHERE id = ?`, [Number(req.params.id)]);
  res.json({ success: true });
});

function buildArchiveContentDisposition(
  row: ArchiveRow,
  mode: 'view' | 'download',
): { contentType: string; disposition: string } {
  const fileName = `${row.nama_dokumen.replace(/[^a-z0-9-_ .]+/gi, '_').trim() || `arsip-${row.id}`}.${row.ekstensi || 'pdf'}`;
  const contentTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  const contentType = contentTypeMap[(row.ekstensi || 'pdf').toLowerCase()] || 'application/octet-stream';
  const dispositionType = mode === 'view' ? 'inline' : 'attachment';
  const disposition = `${dispositionType}; filename*=UTF-8''${encodeURIComponent(fileName)}; filename="${encodeURIComponent(fileName)}"`;
  return { contentType, disposition };
}

async function serveAdminArchive(
  req: Request,
  res: Response,
  mode: 'view' | 'download',
) {
  const archiveId = Number(req.params.id);
  if (!archiveId || Number.isNaN(archiveId)) {
    res.status(400).json({ success: false, error: 'ID arsip tidak valid.' });
    return;
  }
  const row = get<ArchiveRow>(`SELECT * FROM arsip_dokumen WHERE id = ? LIMIT 1`, [archiveId]);
  if (!row) {
    res.status(404).json({ success: false, error: 'Arsip dokumen tidak ditemukan.' });
    return;
  }
  const { contentType, disposition } = buildArchiveContentDisposition(row, mode);
  const filePath = row.file_path || '';
  const normalizedPath = filePath.replace(/^\/+/, '');
  const isExternalUrl = /^https?:\/\//i.test(filePath);
  const isLocalUploadPath =
    !isExternalUrl && (filePath.startsWith('uploads/') || filePath.startsWith('/uploads/'));
  const isPrivateArsip = !isExternalUrl && normalizedPath.startsWith('private-arsip/');
  const LIVE_LEGACY_ARCHIVE_ROOT = (process.env.LIVE_LEGACY_ARCHIVE_ROOT || '').trim().replace(/\/+$/, '');
  const localCandidates: string[] = [];
  if (!isExternalUrl) {
    if (isPrivateArsip) {
      localCandidates.push(path.join(privateArsipRoot, normalizedPath.replace(/^private-arsip\//, '')));
    } else if (isLocalUploadPath) {
      localCandidates.push(path.join(uploadsRoot, filePath.replace(/^\/?uploads\//, '')));
    } else {
      localCandidates.push(path.join(projectRoot, normalizedPath));
    }
    if (!normalizedPath.includes('/') && !normalizedPath.includes('\\')) {
      localCandidates.push(path.join(localMediaRoot, 'arsip', normalizedPath));
      localCandidates.push(path.join(uploadsRoot, 'arsip', normalizedPath));
      if (LIVE_LEGACY_ARCHIVE_ROOT) {
        localCandidates.push(path.join(LIVE_LEGACY_ARCHIVE_ROOT, 'arsipdokumen', 'pdf', normalizedPath));
      }
    }
    if (LIVE_LEGACY_ARCHIVE_ROOT && /^arsipdokumen\/(pdf|pdfprivate)/i.test(normalizedPath)) {
      localCandidates.unshift(path.join(LIVE_LEGACY_ARCHIVE_ROOT, normalizedPath));
    }
    const baseName = path.basename(normalizedPath, path.extname(normalizedPath));
    const ext = path.extname(normalizedPath).replace(/^\./, '').toLowerCase() || row.ekstensi?.toLowerCase() || 'pdf';
    const fallbackExts = new Set<string>([ext, 'pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png', 'gif']);
    for (const candidate of [...localCandidates]) {
      const dir = path.dirname(candidate);
      fallbackExts.forEach((e) => {
        if (!candidate.toLowerCase().endsWith(`.${e}`)) {
          localCandidates.push(path.join(dir, `${baseName}.${e}`));
        }
      });
    }
  }

  let matched: string | null = null;
  for (const candidate of localCandidates) {
    try {
      if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        matched = candidate;
        break;
      }
    } catch {
      // skip
    }
  }
  if (matched) {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.sendFile(matched);
    return;
  }
  if (isExternalUrl) {
    try {
      const remote = await fetch(filePath, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (RSHD Admin Archive Proxy)',
          'Accept': '*/*',
        },
      });
      if (remote.ok) {
        const finalContentType = remote.headers.get('content-type') || contentType;
        const buffer = Buffer.from(await remote.arrayBuffer());
        res.setHeader('Content-Type', finalContentType);
        res.setHeader('Content-Disposition', disposition);
        res.setHeader('Content-Length', String(buffer.length));
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.send(buffer);
        return;
      }
    } catch {
      // skip
    }
    res.redirect(302, filePath);
    return;
  }
  res.status(404).json({
    success: false,
    error: 'File arsip tidak ditemukan di lokasi manapun.',
  });
}

router.get('/arsip/:id/view', requireAdminModule('arsip'), (req: Request, res: Response) => {
  void serveAdminArchive(req, res, 'view');
});

router.get('/arsip/:id/download', requireAdminModule('arsip'), (req: Request, res: Response) => {
  void serveAdminArchive(req, res, 'download');
});

router.get('/settings', requireAdminModule('settings'), (_req: Request, res: Response) => {
  const rows = all<{ id: number; module: string; field: string; value: string | null }>(
    `SELECT id, module, field, value FROM mlite_settings WHERE module = 'settings' ORDER BY field ASC`,
  );
  res.json({ success: true, data: rows });
});

router.put('/settings', requireAdminModule('settings'), (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Data pengaturan tidak valid.' });
    return;
  }

  Object.entries(parsed.data.settings).forEach(([field, value]) => {
    const existing = get<{ id: number }>(
      `SELECT id FROM mlite_settings WHERE module = 'settings' AND field = ? LIMIT 1`,
      [field],
    );

    if (existing) {
      run(`UPDATE mlite_settings SET value = ? WHERE id = ?`, [value, existing.id]);
      return;
    }

    run(`INSERT INTO mlite_settings (module, field, value) VALUES ('settings', ?, ?)`, [
      field,
      value,
    ]);
  });

  res.json({ success: true });
});

export default router;
