import { create } from 'zustand';
import { getBootstrap } from '@/lib/api';
import type { SiteBootstrap } from '@/types';

type SiteStore = {
  bootstrap: SiteBootstrap | null;
  loading: boolean;
  error: string | null;
  loadBootstrap: () => Promise<void>;
};

export const useSiteStore = create<SiteStore>((set, get) => ({
  bootstrap: null,
  loading: false,
  error: null,
  loadBootstrap: async () => {
    if (get().bootstrap) return;

    set({ loading: true, error: null });
    try {
      const bootstrap = await getBootstrap();
      set({ bootstrap, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data situs.',
      });
    }
  },
}));
