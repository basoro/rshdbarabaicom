import type {
  AdminUser,
  AdminUserItem,
  ArchiveItem,
  NewsItem,
  PageItem,
  SiteBootstrap,
} from '@/types';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: isFormData
      ? options?.headers
      : {
          'Content-Type': 'application/json',
          ...(options?.headers ?? {}),
        },
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'Permintaan gagal diproses.');
  }

  return payload.data;
}

export function getBootstrap() {
  return request<SiteBootstrap>('/api/public/bootstrap');
}

export function getPage(slug: string) {
  return request<PageItem>(`/api/public/pages/${slug}`);
}

export function getNewsList(page = 1) {
  return request<{ items: NewsItem[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
    `/api/public/news?page=${page}`,
  );
}

export function getNewsDetail(slug: string) {
  return request<{ item: NewsItem; related: NewsItem[] }>(`/api/public/news/${slug}`);
}

export function getArchives(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  return request<{
    items: ArchiveItem[];
    filters: { years: number[]; categories: string[] };
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }>(`/api/public/arsip?${query.toString()}`);
}

export function adminLogin(username: string, password: string) {
  return request<{ token: string; user: AdminUser }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function adminSession(token: string) {
  return request<{ user: AdminUser }>('/api/admin/session', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminLogout(token: string) {
  return request<true>('/api/admin/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export type DashboardUserPostStat = {
  user_id: number;
  label: string;
  total: number;
};

export type DashboardMonthPostStat = {
  month: number;
  label: string;
  total: number;
};

export function adminDashboard(token: string) {
  return request<{
    cards: Array<{ label: string; value: number }>;
    newsByUser: DashboardUserPostStat[];
    newsByMonth: DashboardMonthPostStat[];
    currentUser: AdminUser;
  }>('/api/admin/dashboard', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminListPages(token: string) {
  return request<PageItem[]>('/api/admin/pages', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminSavePage(token: string, values: Partial<PageItem>) {
  const method = values.id ? 'PUT' : 'POST';
  const url = values.id ? `/api/admin/pages/${values.id}` : '/api/admin/pages';

  return request<{ id?: number }>(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(values),
  });
}

export function adminDeletePage(token: string, id: number) {
  return request<true>(`/api/admin/pages/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminListNews(token: string) {
  return request<NewsItem[]>('/api/admin/news', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminDeleteNews(token: string, id: number) {
  return request<true>(`/api/admin/news/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminSaveNews(token: string, values: Partial<NewsItem>) {
  const method = values.id ? 'PUT' : 'POST';
  const url = values.id ? `/api/admin/news/${values.id}` : '/api/admin/news';

  return request<{ id?: number }>(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(values),
  });
}

export function adminListArchives(token: string) {
  return request<ArchiveItem[]>('/api/admin/arsip', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminSaveArchive(token: string, values: Partial<ArchiveItem>) {
  const method = values.id ? 'PUT' : 'POST';
  const url = values.id ? `/api/admin/arsip/${values.id}` : '/api/admin/arsip';

  return request<{ id?: number }>(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(values),
  });
}

export function adminDeleteArchive(token: string, id: number) {
  return request<true>(`/api/admin/arsip/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminListSettings(token: string) {
  return request<Array<{ id: number; module: string; field: string; value: string | null }>>('/api/admin/settings', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminListUsers(token: string) {
  return request<AdminUserItem[]>('/api/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminSaveUser(
  token: string,
  values: Partial<AdminUserItem> & { password?: string },
) {
  const method = values.id ? 'PUT' : 'POST';
  const url = values.id ? `/api/admin/users/${values.id}` : '/api/admin/users';

  return request<{ id?: number }>(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(values),
  });
}

export function adminDeleteUser(token: string, id: number) {
  return request<true>(`/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function adminSaveSettings(token: string, settings: Record<string, string>) {
  return request<true>('/api/admin/settings', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ settings }),
  });
}

export function adminUploadFile(token: string, file: File, target: string) {
  const formData = new FormData();
  formData.append('target', target);
  formData.append('file', file);

  return request<{
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    filePath: string;
    fileUrl: string;
  }>(`/api/admin/upload?target=${encodeURIComponent(target)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}
