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
import { all, get, getSettingsMap } from '../lib/database.js';
import { getFeaturedDoctors } from '../lib/mysql.js';

type NewsRow = {
  id: number;
  title: string;
  slug: string;
  intro: string | null;
  content: string;
  cover_photo: string | null;
  status: number;
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

  const response = await fetch(`${SITE_ORIGIN}/${requestedPath}`);

  if (!response.ok) {
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
  const featuredDoctors = await getFeaturedDoctors(8);

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

export default router;
