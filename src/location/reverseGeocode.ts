// [REQUIREMENT: Task 03 - Reverse Geocoding]
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { GEOCODER_URL } from '../config/env';
import type { GeocodeResult } from './types';

// Simple in-memory cache to prevent spamming geocoding queries
const geocodeCache = new Map<string, GeocodeResult>();

function getCacheKey(lat: number, lng: number): string {
  // Round to ~4 decimals (~11 meters) for cache hits
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * Perform reverse geocoding on coordinates.
 * Native platforms use Location.reverseGeocodeAsync.
 * Web (and fallback if native fails) uses OpenStreetMap Nominatim API.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  const cacheKey = getCacheKey(lat, lng);
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Try native expo-location reverse geocoding on iOS/Android
  if (Platform.OS !== 'web') {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (results && results.length > 0) {
        const item = results[0];
        const parts: string[] = [];

        if (item.name && item.name !== item.street) parts.push(item.name);
        if (item.street) {
          parts.push(item.streetNumber ? `${item.street} No. ${item.streetNumber}` : item.street);
        }
        if (item.district || item.subregion) parts.push(item.district || item.subregion || '');
        if (item.city) parts.push(item.city);
        if (item.region) parts.push(item.region);

        const formatted = parts.filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        const result: GeocodeResult = {
          formattedAddress: formatted,
          street: item.street ?? item.name ?? undefined,
          district: item.district ?? item.subregion ?? undefined,
          city: item.city ?? undefined,
          region: item.region ?? undefined,
          country: item.country ?? undefined,
          postalCode: item.postalCode ?? undefined,
        };

        geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch {
      // Fallback to Nominatim if native geocoding is unavailable or fails
    }
  }

  // 2. Web or fallback: OpenStreetMap Nominatim
  try {
    const url = `${GEOCODER_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TrendPreneur-App/1.0 (contact@trendpreneur.id)',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const street =
      addr.road ||
      addr.pedestrian ||
      addr.footway ||
      addr.amenity ||
      addr.building ||
      '';
    const district = addr.suburb || addr.neighbourhood || addr.village || addr.quarter || '';
    const city = addr.city || addr.town || addr.municipality || addr.county || '';
    const region = addr.state || '';
    const country = addr.country || '';
    const postalCode = addr.postcode || '';

    let formattedAddress = data.display_name || '';
    // Format a cleaner address if detailed parts are present
    const cleanParts = [street, district, city, region].filter(Boolean);
    if (cleanParts.length >= 2) {
      formattedAddress = cleanParts.join(', ');
    }

    const result: GeocodeResult = {
      formattedAddress: formattedAddress || `Lokasi (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      street: street || undefined,
      district: district || undefined,
      city: city || undefined,
      region: region || undefined,
      country: country || undefined,
      postalCode: postalCode || undefined,
    };

    geocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    // If geocoding fails completely (e.g. offline), return formatted coordinates
    const fallback: GeocodeResult = {
      formattedAddress: `Koordinat ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
    return fallback;
  }
}
