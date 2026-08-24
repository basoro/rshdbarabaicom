import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import PublicLayout from '@/components/PublicLayout';
import ScrollToTop from '@/components/ScrollToTop';
import AdminArchivesPage from '@/pages/AdminArchivesPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminNewsPage from '@/pages/AdminNewsPage';
import AdminPagesPage from '@/pages/AdminPagesPage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import AdminUsersPage from '@/pages/AdminUsersPage';
import ArchivePage from '@/pages/ArchivePage';
import HomePage from '@/pages/HomePage';
import NewsDetailPage from '@/pages/NewsDetailPage';
import NewsListPage from '@/pages/NewsListPage';
import NotFoundPage from '@/pages/NotFoundPage';
import PageContentPage from '@/pages/PageContentPage';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="pages" element={<AdminPagesPage />} />
          <Route path="news" element={<AdminNewsPage />} />
          <Route path="arsip" element={<AdminArchivesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="news" element={<NewsListPage />} />
          <Route path="news/:slug" element={<NewsDetailPage />} />
          <Route path="arsip-dokumen" element={<ArchivePage />} />
          <Route path="dokumenarsip" element={<Navigate to="/arsip-dokumen" replace />} />
          <Route path=":slug" element={<PageContentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
