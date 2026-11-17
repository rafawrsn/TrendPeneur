// [REQUIREMENT: Task 03 - Reverse Geocode Hook]
import { useState, useEffect, useCallback, useRef } from 'react';
import type { LocationFix, GeocodeResult } from './types';
import { reverseGeocode } from './reverseGeocode';
import { haversineMeters } from './geo';

export function useReverseGeocode(fix: LocationFix | null) {
  const [address, setAddress] = useState<GeocodeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastCoordRef = useRef<{ lat: number; lng: number } | null>(null);

  const fetchAddress = useCallback(
    async (lat: number, lng: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await reverseGeocode(lat, lng);
        setAddress(result);
        lastCoordRef.current = { lat, lng };
      } catch (err) {
        setError('Gagal membaca nama jalan/lokasi.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!fix) {
      setAddress(null);
      lastCoordRef.current = null;
      return;
    }

    // If moved less than 15 meters from last fetched address, don't spam reverse geocoder
    if (lastCoordRef.current) {
      const distance = haversineMeters(lastCoordRef.current, fix);
      if (distance < 15 && address) {
        return;
      }
    }

    fetchAddress(fix.lat, fix.lng);
  }, [fix?.lat, fix?.lng, fetchAddress, address]);

  const refetch = useCallback(async () => {
    if (fix) {
      await fetchAddress(fix.lat, fix.lng);
    }
  }, [fix, fetchAddress]);

  return {
    address,
    isLoading,
    error,
    refetch,
  };
}
