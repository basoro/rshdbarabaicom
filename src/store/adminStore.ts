import { create } from 'zustand';
import { adminLogin, adminLogout, adminSession } from '@/lib/api';
import type { AdminUser } from '@/types';

const STORAGE_KEY = 'rshd-admin-token';

type AdminStore = {
  token: string;
  user: AdminUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  token: localStorage.getItem(STORAGE_KEY) ?? '',
  user: null,
  loading: false,
  initialized: false,
  error: null,
  initialize: async () => {
    const token = get().token;

    if (!token) {
      set({ initialized: true });
      return;
    }

    set({ loading: true, error: null });
    try {
      const response = await adminSession(token);
      set({
        user: response.user,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      set({
        token: '',
        user: null,
        loading: false,
        initialized: true,
        error: error instanceof Error ? error.message : 'Sesi admin tidak valid.',
      });
    }
  },
  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await adminLogin(username, password);
      localStorage.setItem(STORAGE_KEY, response.token);
      set({
        token: response.token,
        user: response.user,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Login gagal.',
      });
      throw error;
    }
  },
  logout: async () => {
    const token = get().token;
    if (token) {
      await adminLogout(token);
    }
    localStorage.removeItem(STORAGE_KEY);
    set({
      token: '',
      user: null,
      loading: false,
      initialized: true,
      error: null,
    });
  },
}));
