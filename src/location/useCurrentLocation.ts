// [REQUIREMENT: Task 01 - GPS Location Hook]
import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '../stores/location';
import type { LocationFix } from './types';

export interface UseCurrentLocationResult {
  isLoading: boolean;
  error: string | null;
  requestPermissionAndGetLocation: (showExplainerIfNeeded?: () => void) => Promise<LocationFix | null>;
  getCurrentPosition: () => Promise<LocationFix | null>;
  permissionStatus: Location.PermissionStatus | 'undetermined' | null;
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const setPermissionStatus = useLocationStore((s) => s.setPermissionStatus);
  const setCurrentFix = useLocationStore((s) => s.setCurrentFix);
  const simulationEnabled = useLocationStore((s) => s.simulationEnabled);

  const getCurrentPosition = useCallback(async (): Promise<LocationFix | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check current permission status first
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setError('Izin lokasi belum diberikan.');
        setIsLoading(false);
        return null;
      }

      // Check if location services are enabled on device
      const hasServices = await Location.hasServicesEnabledAsync();
      if (!hasServices) {
        setError('Layanan lokasi (GPS) pada perangkat dalam keadaan nonaktif. Mohon aktifkan GPS perangkat.');
        setIsLoading(false);
        return null;
      }

      // Balanced accuracy balances battery consumption and precision
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const fix: LocationFix = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy != null ? Math.round(loc.coords.accuracy) : null,
        timestamp: loc.timestamp || Date.now(),
        source: 'gps',
      };

      // Only override store fix if not currently in simulation mode
      if (!simulationEnabled) {
        setCurrentFix(fix);
      }

      setIsLoading(false);
      return fix;
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'Gagal memperoleh lokasi saat ini.';
      setError(`Kesalahan GPS: ${errMessage}`);
      setIsLoading(false);
      return null;
    }
  }, [setPermissionStatus, setCurrentFix, simulationEnabled]);

  const requestPermissionAndGetLocation = useCallback(
    async (): Promise<LocationFix | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);

        if (status !== Location.PermissionStatus.GRANTED) {
          setError(
            'Izin akses lokasi ditolak oleh pengguna. Aktifkan izin lokasi untuk menggunakan fitur ini.'
          );
          setIsLoading(false);
          return null;
        }

        return await getCurrentPosition();
      } catch (err: unknown) {
        const errMessage =
          err instanceof Error ? err.message : 'Gagal meminta izin lokasi.';
        setError(`Kesalahan izin: ${errMessage}`);
        setIsLoading(false);
        return null;
      }
    },
    [setPermissionStatus, getCurrentPosition]
  );

  return {
    isLoading,
    error,
    requestPermissionAndGetLocation,
    getCurrentPosition,
    permissionStatus,
  };
}
