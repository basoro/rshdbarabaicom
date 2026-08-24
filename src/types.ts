export type MenuItem = {
  label: string;
  href?: string;
  slug?: string;
  children?: MenuItem[];
};

export type SiteSettings = Record<string, string>;

export type SiteBootstrap = {
  settings: SiteSettings;
  menu: MenuItem[];
  heroSlides: Array<{
    eyebrow: string;
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
    image: string;
  }>;
  homeStats: Array<{
    label: string;
    value: string;
  }>;
  featuredServices: Array<{
    title: string;
    description: string;
    slug: string;
  }>;
  doctorHighlights: Array<{
    code?: string;
    name: string;
    specialty: string;
    photo_url?: string;
    photo_path?: string | null;
  }>;
  quickLinks: Array<{
    label: string;
    slug?: string;
    url?: string;
  }>;
  about: PageItem | null;
  latestNews: NewsItem[];
  totals: {
    pages: number;
    news: number;
    archives: number;
  };
  contacts: {
    address: string;
    email: string;
    phone: string;
    complaintPhone: string;
    serviceHours: string;
  };
};

export type PageItem = {
  id: number;
  title: string;
  slug: string;
  desc: string | null;
  template: string;
  date: string;
  content: string;
  markdown: number;
};

export type NewsItem = {
  id: number;
  title: string;
  slug: string;
  user_id: number;
  intro: string | null;
  content: string;
  cover_photo: string | null;
  cover_url?: string;
  status: number;
  comments: number;
  markdown: number;
  views: number;
  published_at: number;
  updated_at: number;
  created_at: number;
  author: {
    name: string;
  };
};

export type ArchiveItem = {
  id: number;
  kategori: string;
  jenis: string;
  nama_dokumen: string;
  tahun: number;
  file_path: string;
  file_url?: string;
  ekstensi: string;
  created_at: string;
};

export type AdminUser = {
  id: number;
  username: string;
  fullname: string | null;
  description?: string | null;
  email: string;
  avatar?: string;
  role: string;
  cap?: string | null;
  access: string;
};

export type AdminUserItem = {
  id: number;
  username: string;
  fullname: string | null;
  description: string | null;
  email: string;
  avatar: string;
  role: string;
  cap: string | null;
  access: string;
};
