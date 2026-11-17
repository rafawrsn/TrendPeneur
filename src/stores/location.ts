// [REQUIREMENT: Location State Management]
import { create } from 'zustand';
import type * as Location from 'expo-location';
import type {
  LocationFix,
  GeofenceEvent,
  TrackingProfileKey,
  TrackingProfile,
  TrackingStats,
} from '../location/types';

export const TRACKING_PROFILES: Record<TrackingProfileKey, TrackingProfile> = {
  balanced: {
    key: 'balanced',
    label: 'Seimbang (Rekomendasi)',
    description: 'Interval 5 detik, jarak 10 m. Menyeimbangkan akurasi dengan konsumsi daya baterai.',
    accuracyName: 'Balanced (Menengah)',
    timeInterval: 5000,
    distanceInterval: 10,
  },
  high_accuracy: {
    key: 'high_accuracy',
    label: 'Akurasi Tinggi',
    description: 'Interval 2 detik, jarak 3 m. Akurasi maksimal sinyal satelit GPS (konsumsi baterai lebih tinggi).',
    accuracyName: 'High (Presisi GPS)',
    timeInterval: 2000,
    distanceInterval: 3,
  },
  battery_saver: {
    key: 'battery_saver',
    label: 'Hemat Baterai',
    description: 'Interval 15 detik, jarak 30 m. Ideal untuk pemantauan pasif dan menghemat daya.',
    accuracyName: 'Low / Network Provider',
    timeInterval: 15000,
    distanceInterval: 30,
  },
};

interface LocationStoreState {
  permissionStatus: Location.PermissionStatus | 'undetermined' | null;
  currentFix: LocationFix | null;
  simulationEnabled: boolean;
  trackingEnabled: boolean;
  insideZoneIds: string[];
  events: GeofenceEvent[];
  trackingStats: TrackingStats;
  selectedProfileKey: TrackingProfileKey;
  selectedZoneId: string | null;

  setPermissionStatus: (status: Location.PermissionStatus | 'undetermined' | null) => void;
  setCurrentFix: (fix: LocationFix | null) => void;
  setSimulationEnabled: (enabled: boolean) => void;
  setTrackingEnabled: (enabled: boolean) => void;
  setInsideZoneIds: (ids: string[]) => void;
  addEvent: (event: Omit<GeofenceEvent, 'id' | 'at'>) => void;
  clearEvents: () => void;
  incrementReceived: () => void;
  incrementProcessed: () => void;
  resetStats: () => void;
  setSelectedProfileKey: (key: TrackingProfileKey) => void;
  setSelectedZoneId: (id: string | null) => void;
}

export const useLocationStore = create<LocationStoreState>((set) => ({
  permissionStatus: 'undetermined',
  currentFix: null,
  simulationEnabled: false,
  trackingEnabled: false,
  insideZoneIds: [],
  events: [],
  trackingStats: {
    received: 0,
    processed: 0,
  },
  selectedProfileKey: 'balanced',
  selectedZoneId: null,

  setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
  setCurrentFix: (currentFix) => set({ currentFix }),
  setSimulationEnabled: (simulationEnabled) => set({ simulationEnabled }),
  setTrackingEnabled: (trackingEnabled) => set({ trackingEnabled }),
  setInsideZoneIds: (insideZoneIds) => set({ insideZoneIds }),

  addEvent: (eventData) =>
    set((state) => {
      const newEvent: GeofenceEvent = {
        ...eventData,
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: Date.now(),
      };
      // Keep maximum 50 events, newest first
      const updated = [newEvent, ...state.events].slice(0, 50);
      return { events: updated };
    }),

  clearEvents: () => set({ events: [] }),

  incrementReceived: () =>
    set((state) => ({
      trackingStats: {
        ...state.trackingStats,
        received: state.trackingStats.received + 1,
      },
    })),

  incrementProcessed: () =>
    set((state) => ({
      trackingStats: {
        ...state.trackingStats,
        processed: state.trackingStats.processed + 1,
      },
    })),

  resetStats: () =>
    set({
      trackingStats: {
        received: 0,
        processed: 0,
      },
    }),

  setSelectedProfileKey: (selectedProfileKey) => set({ selectedProfileKey }),
  setSelectedZoneId: (selectedZoneId) => set({ selectedZoneId }),
}));
