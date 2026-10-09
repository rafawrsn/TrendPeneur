import { create } from 'zustand';
import type { User } from '../api/types';
import { storageGet, storageSet, storageDelete } from '../utils/storage';
import { getService } from '../api';

const REFRESH_TOKEN_KEY = 'trendpreneur_refresh_token';

interface SessionState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setTokens: (access: string | null, refresh: string | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),

  setTokens: (access, refresh) => {
    set({ accessToken: access, refreshToken: refresh });
    if (refresh) {
      storageSet(REFRESH_TOKEN_KEY, refresh);
    } else {
      storageDelete(REFRESH_TOKEN_KEY);
    }
  },

  logout: async () => {
    try {
      await getService().logout();
    } catch {
      // ignore
    }
    set({ user: null, accessToken: null, refreshToken: null });
    await storageDelete(REFRESH_TOKEN_KEY);
  },

  initialize: async () => {
    if (get().isInitialized) return;
    const storedRefresh = await storageGet(REFRESH_TOKEN_KEY);
    if (storedRefresh) {
      try {
        const result = await getService().refreshTokens(storedRefresh);
        set({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          isInitialized: true,
        });
        await storageSet(REFRESH_TOKEN_KEY, result.refreshToken);
        return;
      } catch {
        await storageDelete(REFRESH_TOKEN_KEY);
      }
    }
    set({ isInitialized: true });
  },

  refreshUser: async () => {
    try {
      const user = await getService().getMe();
      set({ user });
    } catch {
      // ignore
    }
  },
}));
