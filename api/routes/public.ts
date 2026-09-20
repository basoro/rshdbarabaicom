import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Router, type Request, type Response } from 'express';
import {
  featuredServices,
  heroSlides,
  homeStats,
  publicMenu,
  quickLinks,
  resolveArchiveUrl,
  resolveNewsCover,
  SITE_ORIGIN,
} from '../lib/content.js';
import { all, get, getSettingsMap, run } from '../lib/database.js';
import { getFeaturedDoctors } from '../lib/mysql.js';

type NewsRow = {
  id: number;
  title: string;
  slug: string;
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const uploadsRoot = path.resolve(__dirname, '../../uploads');
const localMediaRoot = path.resolve(__dirname, '../public/media/local');

const router = Router();
const PUBLIC_NEWS_STATUS = 2;
const imageFallbackUrl =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20hospital%20building%20with%20green%20medical%20branding%2C%20clean%20daylight%2C%20realistic%20editorial%20photography&image_size=landscape_16_9';
const doctorFallbackUrl =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20indonesian%20doctor%20portrait%2C%20white%20coat%2C%20friendly%20hospital%20staff%2C%20green%20medical%20background%2C%20realistic%20editorial%20photography&image_size=portrait_4_3';

function mapNews(row: NewsRow) {
  return {
    ...row,
    cover_url: resolveNewsCover(row.cover_photo),
    author: {
      name: row.author_name ?? 'Admin RSHD',
    },
  };
}

router.get('/media/local/:target/:filename', (req: Request, res: Response) => {
  const target = req.params.target.replace(/[^a-z0-9-_]+/gi, '').toLowerCase();
  const filename = path.basename(req.params.filename);
  const candidatePaths = [
    path.join(localMediaRoot, target, filename),
    path.join(uploadsRoot, target, filename),
  ];
  const filePath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!filePath) {
    res.redirect(imageFallbackUrl);
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(filePath);
});

router.get('/media/news/:filename', async (req: Request, res: Response) => {
  const response = await fetch(
    `${SITE_ORIGIN}/uploads/news/${encodeURIComponent(req.params.filename)}`,
  );

  if (!response.ok) {
    res.redirect(imageFallbackUrl);
    return;
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(buffer);
});

router.get('/media/legacy', async (req: Request, res: Response) => {
  const requestedPath =
    typeof req.query.path === 'string' ? req.query.path.replace(/^\/+/, '') : '';

  if (!requestedPath.startsWith('uploads/')) {
    res.status(400).json({
      success: false,
      error: 'Path legacy tidak valid.',
    });
    return;
  }

  const response = await fetch(`${SITE_ORIGIN}/${requestedPath}`);

  if (!response.ok) {
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(requestedPath)) {
      res.redirect(imageFallbackUrl);
      return;
    }

    res.status(404).json({
      success: false,
      error: 'Aset legacy tidak ditemukan.',
    });
    return;
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(buffer);
});

router.get('/media/pegawai', async (req: Request, res: Response) => {
  const requestedPath =
    typeof req.query.path === 'string' ? req.query.path.replace(/^\/+/, '') : '';

  if (!requestedPath.startsWith('pages/pegawai/photo/')) {
    res.status(400).json({
      success: false,
      error: 'Path foto pegawai tidak valid.',
    });
    return;
  }

  const FALLBACK_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const parsedDir = path.dirname(requestedPath);
  const parsedBase = path.basename(requestedPath, path.extname(requestedPath));
  const originalExt = path.extname(requestedPath).replace(/^\./, '').toLowerCase();

  const candidateExts = new Set<string>();
  if (originalExt) candidateExts.add(originalExt);
  FALLBACK_EXT.forEach((ext) => candidateExts.add(ext));
  const extList = Array.from(candidateExts);

  function withAllExts(baseDir: string, baseName: string): string[] {
    return extList.map((ext) => path.join(baseDir, `${baseName}.${ext}`));
  }

  const searchPaths: string[] = [];

  const litePhotoDir = process.env.LITE_PHOTO_DIR?.trim();
  if (litePhotoDir) {
    withAllExts(path.join(litePhotoDir, 'pages', 'pegawai', 'photo'), parsedBase).forEach((p) =>
      searchPaths.push(p),
    );
  }

  const litePhotoDirMac = process.env.LITE_PHOTO_DIR_MAC?.trim();
  if (litePhotoDirMac) {
    withAllExts(path.join(litePhotoDirMac, 'pages', 'pegawai', 'photo'), parsedBase).forEach((p) =>
      searchPaths.push(p),
    );
  }

  withAllExts(path.join(projectRoot, parsedDir), parsedBase).forEach((p) => searchPaths.push(p));
  withAllExts(path.join(uploadsRoot, 'pegawai'), parsedBase).forEach((p) => searchPaths.push(p));

  for (const candidate of searchPaths) {
    try {
      if (fs.existsSync(candidate)) {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) {
          const ext = path.extname(candidate).replace(/^\./, '').toLowerCase();
          const mimeType: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
            gif: 'image/gif',
          };
          const mt = mimeType[ext] || 'image/jpeg';
          const cacheBust = `v=${stat.mtimeMs.toString(36)}`;
          res.setHeader('Content-Type', mt);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.setHeader('ETag', `"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`);
          if (req.query.v !== cacheBust) {
            res.setHeader('X-Cache-Local', candidate);
          }
          console.log('[media/pegawai] Serve local:', candidate);
          res.sendFile(candidate);
          return;
        }
      }
    } catch {
      // skip
    }
  }

  const baseUrl = process.env.LITE_BASE_URL?.trim() || SITE_ORIGIN;
  const candidateUrls: string[] = [];
  for (const ext of extList) {
    candidateUrls.push(`${baseUrl}/pages/pegawai/photo/${encodeURIComponent(parsedBase)}.${ext}`);
  }
  candidateUrls.push(`${baseUrl}/${requestedPath}`);

  for (const photoUrl of candidateUrls) {
    try {
      console.log('[media/pegawai] Try proxy:', photoUrl);
      const response = await fetch(photoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (RSHD Photo Proxy)',
          'Accept': 'image/*,*/*;q=0.8',
          'Referer': SITE_ORIGIN,
        },
      });
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > 200) {
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.setHeader('X-Cache-Proxy', photoUrl);
          console.log('[media/pegawai] Proxy OK from:', photoUrl);
          res.send(buffer);
          return;
        }
        console.log('[media/pegawai] Tiny/empty response from:', photoUrl, '-> skip');
      }
    } catch (error) {
      console.error('[media/pegawai] Proxy error for:', photoUrl, error instanceof Error ? error.message : String(error));
    }
  }

  const legacyProxy = process.env.LEGACY_PHOTO_PROXY?.trim();
  if (legacyProxy) {
    const legacyUrl = `${legacyProxy}/pages/pegawai/photo/${encodeURIComponent(parsedBase)}.${originalExt || 'jpg'}`;
    try {
      const response = await fetch(legacyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (RSHD Photo Proxy)',
          'Accept': 'image/*,*/*;q=0.8',
        },
      });
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > 200) {
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          console.log('[media/pegawai] Legacy proxy OK');
          res.send(buffer);
          return;
        }
      }
    } catch {
      // skip
    }
  }

  console.log('[media/pegawai] All strategies failed → SVG fallback for:', parsedBase);
  const initials = parsedBase
    .replace(/[^a-z0-9 ]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || 'RS';
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#d1fae5"/>
    </linearGradient>
    <linearGradient id="avatar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <rect width="400" height="533" rx="28" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="92" fill="url(#avatar)" opacity="0.92"/>
  <text x="200" y="228" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="88" font-weight="700" fill="#ffffff">${initials}</text>
  <rect x="80" y="340" width="240" height="18" rx="9" fill="#a7f3d0"/>
  <rect x="110" y="378" width="180" height="14" rx="7" fill="#a7f3d0" opacity="0.85"/>
  <rect x="128" y="406" width="144" height="12" rx="6" fill="#a7f3d0" opacity="0.7"/>
  <rect x="40" y="20" width="320" height="493" rx="24" fill="none" stroke="#6ee7b7" stroke-width="2" opacity="0.45"/>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

router.get('/media/pegawai-fallback', (_req: Request, res: Response) => {
  const nameRaw = typeof _req.query.i === 'string' ? _req.query.i : '';
  const specRaw = typeof _req.query.s === 'string' ? _req.query.s : '';
  const gender = typeof _req.query.g === 'string' ? _req.query.g : '';

  const words = nameRaw
    .split(/[-\s_]+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = words
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || 'RS';

  const primary = gender === 'p' ? '#0ea5e9' : '#059669';
  const primaryDark = gender === 'p' ? '#0284c7' : '#047857';
  const softBg = gender === 'p' ? '#e0f2fe' : '#ecfdf5';
  const softBg2 = gender === 'p' ? '#bae6fd' : '#d1fae5';
  const accent = gender === 'p' ? '#7dd3fc' : '#6ee7b7';

  const displayName = nameRaw
    .split(/[-\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .slice(0, 3)
    .join(' ') || 'Dokter RSHD';
  const displaySpec = specRaw
    .split(/[-\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .slice(0, 4)
    .join(' ') || 'Dokter Umum';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${softBg}"/>
      <stop offset="100%" stop-color="${softBg2}"/>
    </linearGradient>
    <linearGradient id="avatar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${primaryDark}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="533" rx="28" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="92" fill="url(#avatar)" opacity="0.92"/>
  <text x="200" y="228" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="88" font-weight="700" fill="#ffffff">${initials}</text>
  <text x="200" y="352" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#0f172a">${displayName}</text>
  <text x="200" y="386" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="${primaryDark}">${displaySpec}</text>
  <text x="200" y="424" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#475569">RSUD H. Damanhuri Barabai</text>
  <rect x="40" y="20" width="320" height="493" rx="24" fill="none" stroke="${accent}" stroke-width="2" opacity="0.45"/>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  res.send(svg);
});

router.post('/track-visit', (req: Request, res: Response) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const pathRaw = typeof req.body?.path === 'string' ? req.body.path.trim().slice(0, 500) : '';
    const titleRaw = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    const referrerRaw = typeof req.body?.referrer === 'string' ? req.body.referrer.trim().slice(0, 500) : '';
    const visitorIdRaw = typeof req.body?.visitorId === 'string' ? req.body.visitorId.trim().slice(0, 64) : '';
    const userAgentRaw = (req.headers['user-agent'] || '').toString().slice(0, 500);

    const safePath = pathRaw && pathRaw.length > 0 ? pathRaw : '/';
    const safeVisitor = visitorIdRaw.match(/^[a-z0-9_-]+$/i) ? visitorIdRaw : '';

    setImmediate(() => {
      try {
        run(
          `
            INSERT INTO site_visits (path, title, referrer, user_agent, visitor_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [safePath, titleRaw, referrerRaw, userAgentRaw, safeVisitor, now],
        );
      } catch (error) {
        console.error('[track-visit] Insert error:', error instanceof Error ? error.message : String(error));
      }
    });

    res.json({ success: true, data: { ok: true } });
  } catch (error) {
    console.error('[track-visit] Request error:', error instanceof Error ? error.message : String(error));
    res.json({ success: true, data: { ok: false } });
  }
});

router.get('/bootstrap', async (_req: Request, res: Response) => {
  const settings = getSettingsMap();
  const latestNewsRows = all<NewsRow>(
    `
      SELECT n.*, u.fullname AS author_name
      FROM mlite_news n
      LEFT JOIN mlite_users u ON u.id = n.user_id
      WHERE n.status = ?
      ORDER BY n.published_at DESC, n.id DESC
      LIMIT 3
    `,
    [PUBLIC_NEWS_STATUS],
  );

  const latestNews = latestNewsRows.map(mapNews);
  const aboutPage = get<PageRow>(
    `SELECT * FROM pages WHERE slug = 'profil' LIMIT 1`,
  );

  const totalPages = get<{ total: number }>(`SELECT COUNT(*) AS total FROM pages`)?.total ?? 0;
  const totalNews =
    get<{ total: number }>(`SELECT COUNT(*) AS total FROM mlite_news WHERE status = ?`, [PUBLIC_NEWS_STATUS])
      ?.total ?? 0;
  const totalArchives =
    get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM arsip_dokumen WHERE lower(jenis) = lower('Publik')`,
    )?.total ?? 0;
  const featuredDoctors = await getFeaturedDoctors(20);

  res.json({
    success: true,
    data: {
      settings,
      menu: publicMenu,
      heroSlides,
      homeStats,
      featuredServices,
      doctorHighlights: featuredDoctors,
      quickLinks,
      about: aboutPage
        ? {
            ...aboutPage,
          }
        : null,
      latestNews,
      totals: {
        pages: totalPages,
        news: totalNews,
        archives: totalArchives,
      },
      contacts: {
        address: 'Jl. Murakata No. 04 Barabai - Kalimantan Selatan',
        email: 'rshd@hstkab.go.id',
        phone: '0811-800-5050',
        complaintPhone: '0852-4980-8800',
        serviceHours: 'Pagi (08:00 - 11:00) dan Sore (14:00 - 16:00)',
      },
    },
  });
});

router.get('/pages/:slug', (req: Request, res: Response) => {
  const page = get<PageRow>(
    `SELECT * FROM pages WHERE slug = ? LIMIT 1`,
    [req.params.slug],
  );

  if (!page) {
    res.status(404).json({
      success: false,
      error: 'Halaman tidak ditemukan.',
    });
    return;
  }

  res.json({
    success: true,
    data: {
      ...page,
    },
  });
});

router.get('/news', (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 9), 1), 24);
  const offset = (page - 1) * pageSize;

  const rows = all<NewsRow>(
    `
      SELECT n.*, u.fullname AS author_name
      FROM mlite_news n
      LEFT JOIN mlite_users u ON u.id = n.user_id
      WHERE n.status = ?
      ORDER BY n.published_at DESC, n.id DESC
      LIMIT ? OFFSET ?
    `,
    [PUBLIC_NEWS_STATUS, pageSize, offset],
  );

  const total =
    get<{ total: number }>(`SELECT COUNT(*) AS total FROM mlite_news WHERE status = ?`, [PUBLIC_NEWS_STATUS])
      ?.total ?? 0;

  res.json({
    success: true,
    data: {
      items: rows.map(mapNews),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    },
  });
});

router.get('/news/:slug', (req: Request, res: Response) => {
  const row = get<NewsRow>(
    `
      SELECT n.*, u.fullname AS author_name
      FROM mlite_news n
      LEFT JOIN mlite_users u ON u.id = n.user_id
      WHERE n.slug = ? AND n.status = ?
      LIMIT 1
    `,
    [req.params.slug, PUBLIC_NEWS_STATUS],
  );

  if (!row) {
    res.status(404).json({
      success: false,
      error: 'Berita tidak ditemukan.',
    });
    return;
  }

  const relatedRows = all<NewsRow>(
    `
      SELECT n.*, u.fullname AS author_name
      FROM mlite_news n
      LEFT JOIN mlite_users u ON u.id = n.user_id
      WHERE n.status = ? AND n.id != ?
      ORDER BY n.published_at DESC, n.id DESC
      LIMIT 3
    `,
    [PUBLIC_NEWS_STATUS, row.id],
  );

  res.json({
    success: true,
    data: {
      item: mapNews(row),
      related: relatedRows.map(mapNews),
    },
  });
});

router.get('/arsip', (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 12), 1), 50);
  const offset = (page - 1) * pageSize;

  const filters: string[] = [`lower(jenis) = lower(?)`];
  const params: Array<string | number> = ['Publik'];

  if (typeof req.query.tahun === 'string' && req.query.tahun.trim()) {
    filters.push(`tahun = ?`);
    params.push(Number(req.query.tahun));
  }

  if (typeof req.query.kategori === 'string' && req.query.kategori.trim()) {
    filters.push(`kategori = ?`);
    params.push(req.query.kategori.trim());
  }

  if (typeof req.query.q === 'string' && req.query.q.trim()) {
    filters.push(`nama_dokumen LIKE ?`);
    params.push(`%${req.query.q.trim()}%`);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
  const rows = all<ArchiveRow>(
    `
      SELECT *
      FROM arsip_dokumen
      ${whereClause}
      ORDER BY tahun DESC, id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset],
  );

  const total =
    get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM arsip_dokumen ${whereClause}`,
      params,
    )?.total ?? 0;

  const years = all<{ tahun: number }>(
    `SELECT DISTINCT tahun FROM arsip_dokumen WHERE lower(jenis) = lower('Publik') ORDER BY tahun DESC`,
  );
  const categories = all<{ kategori: string }>(
    `SELECT DISTINCT kategori FROM arsip_dokumen WHERE lower(jenis) = lower('Publik') ORDER BY kategori ASC`,
  );

  res.json({
    success: true,
    data: {
      items: rows.map((item) => ({
        ...item,
        file_url: resolveArchiveUrl(item.file_path),
      })),
      filters: {
        years: years.map((item) => item.tahun),
        categories: categories.map((item) => item.kategori),
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    },
  });
});

async function serveArchiveFile(
  req: Request,
  res: Response,
  mode: 'view' | 'download',
) {
  const archiveId = Number(req.params.id);
  if (!archiveId || Number.isNaN(archiveId)) {
    res.status(400).json({ success: false, error: 'ID arsip tidak valid.' });
    return;
  }

  const row = get<ArchiveRow>(
    `SELECT * FROM arsip_dokumen WHERE id = ? AND lower(jenis) = lower('Publik') LIMIT 1`,
    [archiveId],
  );

  if (!row) {
    res.status(404).json({ success: false, error: 'Arsip dokumen tidak ditemukan.' });
    return;
  }

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
  };
  const contentType = contentTypeMap[(row.ekstensi || 'pdf').toLowerCase()] || 'application/octet-stream';
  const dispositionType = mode === 'view' ? 'inline' : 'attachment';
  const dispositionHeader = `${dispositionType}; filename*=UTF-8''${encodeURIComponent(fileName)}; filename="${encodeURIComponent(fileName)}"`;

  const filePath = row.file_path || '';
  const normalizedPath = filePath.replace(/^\/+/, '');
  const isExternalUrl = /^https?:\/\//i.test(filePath);
  const isLocalUploadPath =
    !isExternalUrl &&
    (filePath.startsWith('uploads/') || filePath.startsWith('/uploads/'));

  let localCandidate: string | null = null;
  if (!isExternalUrl) {
    if (isLocalUploadPath) {
      localCandidate = path.join(uploadsRoot, filePath.replace(/^\/?uploads\//, ''));
    } else {
      localCandidate = path.join(projectRoot, normalizedPath);
    }
  }

  if (localCandidate && fs.existsSync(localCandidate)) {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', dispositionHeader);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(localCandidate);
    return;
  }

  if (isExternalUrl) {
    try {
      console.log(`[arsip:${mode}] Proxy external archive #${row.id}: ${filePath}`);
      const response = await fetch(filePath, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (RSHD Archive Proxy)',
          'Accept': '*/*',
        },
      });
      if (response.ok) {
        const finalContentType = response.headers.get('content-type') || contentType;
        const buffer = Buffer.from(await response.arrayBuffer());
        res.setHeader('Content-Type', finalContentType);
        res.setHeader('Content-Disposition', dispositionHeader);
        res.setHeader('Content-Length', String(buffer.length));
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.send(buffer);
        return;
      }
      console.log(`[arsip:${mode}] External failed (${response.status}) → redirect browser`);
    } catch (error) {
      console.error(`[arsip:${mode}] External proxy error #${row.id}:`, error);
    }
    res.redirect(302, filePath);
    return;
  }

  const remoteUrl = `${SITE_ORIGIN}/${normalizedPath}`;
  const isPdf = (row.ekstensi || '').toLowerCase() === 'pdf';
  const legacyViewerPathMatch = /^arsipdokumen[\\/]/i.test(normalizedPath);

  if (isPdf && mode === 'view') {
    let viewerUrl: string;
    if (legacyViewerPathMatch) {
      viewerUrl = `${SITE_ORIGIN}/arsipdokumen/viewer.php?file=${encodeURIComponent(normalizedPath.split(path.sep).join('/'))}`;
    } else {
      viewerUrl = `${SITE_ORIGIN}/viewer.php?file=${encodeURIComponent(normalizedPath.split(path.sep).join('/'))}`;
    }
    console.log(`[arsip:view] Legacy PDF #${row.id} → mLITE viewer: ${viewerUrl}`);
    res.redirect(302, viewerUrl);
    return;
  }

  try {
    console.log(`[arsip:${mode}] Proxy from mLITE #${row.id}: ${remoteUrl}`);
    const response = await fetch(remoteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (RSHD Archive Proxy)',
        'Accept': '*/*',
        'Referer': SITE_ORIGIN,
      },
    });
    if (response.ok) {
      const finalContentType = response.headers.get('content-type') || contentType;
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', finalContentType);
      res.setHeader('Content-Disposition', dispositionHeader);
      res.setHeader('Content-Length', String(buffer.length));
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.send(buffer);
      return;
    }
    console.log(`[arsip:${mode}] Remote failed (${response.status}) → redirect browser`);
  } catch (error) {
    console.error(`[arsip:${mode}] Remote proxy error #${row.id}:`, error);
  }
  res.redirect(302, remoteUrl);
}

router.get('/arsip/:id/view', (req: Request, res: Response) => {
  void serveArchiveFile(req, res, 'view');
});

router.get('/arsip/:id/download', (req: Request, res: Response) => {
  void serveArchiveFile(req, res, 'download');
});

// IP-based rate limit: one view per news per 30 minutes
const viewRateLimit = new Map<string, number>();
const VIEW_RATE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewRateLimit) {
    if (now - timestamp > VIEW_RATE_LIMIT_MS) {
      viewRateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);

router.post('/news/:slug/view', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const rateLimitKey = `${ip}:${slug}`;
  const now = Date.now();

  const lastView = viewRateLimit.get(rateLimitKey);
  if (lastView && now - lastView < VIEW_RATE_LIMIT_MS) {
    // Rate limited — return current views without incrementing
    const row = get<NewsRow>(
      `SELECT views FROM mlite_news WHERE slug = ? AND status = ? LIMIT 1`,
      [slug, PUBLIC_NEWS_STATUS],
    );
    res.json({
      success: true,
      data: { views: row?.views ?? 0 },
    });
    return;
  }

  // Increment views using atomic SQL
  run(
    `UPDATE mlite_news SET views = views + 1 WHERE slug = ? AND status = ?`,
    [slug, PUBLIC_NEWS_STATUS],
  );

  viewRateLimit.set(rateLimitKey, now);

  const row = get<NewsRow>(
    `SELECT views FROM mlite_news WHERE slug = ? AND status = ? LIMIT 1`,
    [slug, PUBLIC_NEWS_STATUS],
  );

  res.json({
    success: true,
    data: { views: row?.views ?? 0 },
  });
});

export default router;
