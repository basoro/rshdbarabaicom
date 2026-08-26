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
const uploadsRoot = path.resolve(__dirname, '../../uploads');

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
  const filePath = path.join(uploadsRoot, target, filename);

  if (!fs.existsSync(filePath)) {
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

  const baseUrl = process.env.LITE_BASE_URL || SITE_ORIGIN;
  const photoUrl = `${baseUrl}/${requestedPath}`;
  console.log('[media/pegawai] Fetching photo from:', photoUrl);
  const response = await fetch(photoUrl);

  if (!response.ok) {
    console.log('[media/pegawai] Photo not found, status:', response.status, '→ redirecting to fallback');
    res.redirect(doctorFallbackUrl);
    return;
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(buffer);
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
