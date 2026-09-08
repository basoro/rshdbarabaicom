import { create } from 'zustand';
import { apamLogin, apamLogout, apamSession } from '@/lib/api';

const STORAGE_KEY = 'rshd-apam-token';

type ApamUser = {
  id: number;
  username: string;
  fullname: string | null;
  email: string;
  role: string;
  access: string;
};

type ApamStore = {
  token: string;
  user: ApamUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useApamStore = create<ApamStore>((set, get) => ({
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
      const response = await apamSession(token);
      set({ user: response.user, loading: false, initialized: true });
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      set({
        token: '',
        user: null,
        loading: false,
        initialized: true,
        error: error instanceof Error ? error.message : 'Sesi tidak valid.',
      });
    }
  },

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apamLogin(username, password);
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
      try {
        await apamLogout(token);
      } catch {
        // ignore logout errors
      }
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
