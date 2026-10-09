import { create } from 'zustand';
import { storageGetJSON, storageSetJSON } from '../utils/storage';

const UI_KEY = 'trendpreneur_ui';

interface UIState {
  recentSearches: string[];
  hasSeenIntro: boolean;
  simulateAiFailure: boolean;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  setHasSeenIntro: (v: boolean) => void;
  setSimulateAiFailure: (v: boolean) => void;
  initialize: () => Promise<void>;
}

interface UIStorage {
  recentSearches: string[];
  hasSeenIntro: boolean;
  simulateAiFailure: boolean;
}

export const useUiStore = create<UIState>((set, get) => ({
  recentSearches: [],
  hasSeenIntro: false,
  simulateAiFailure: false,

  addRecentSearch: (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const existing = get().recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...existing].slice(0, 5);
    set({ recentSearches: updated });
    persist();
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    persist();
  },

  setHasSeenIntro: (v) => {
    set({ hasSeenIntro: v });
    persist();
  },

  setSimulateAiFailure: (v) => {
    set({ simulateAiFailure: v });
    persist();
  },

  initialize: async () => {
    const saved = await storageGetJSON<UIStorage>(UI_KEY);
    if (saved) {
      set({
        recentSearches: saved.recentSearches ?? [],
        hasSeenIntro: saved.hasSeenIntro ?? false,
        simulateAiFailure: saved.simulateAiFailure ?? false,
      });
    }
  },
}));

function persist() {
  const s = useUiStore.getState();
  storageSetJSON<UIStorage>(UI_KEY, {
    recentSearches: s.recentSearches,
    hasSeenIntro: s.hasSeenIntro,
    simulateAiFailure: s.simulateAiFailure,
  });
}
