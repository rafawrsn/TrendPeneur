// [REQUIREMENT: Task 03 - Geofencing & Distance Calculations]
import type { LatLng, LocationFix, Zone, AccuracyLevel } from './types';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates great-circle distance between two points using the Haversine formula in meters.
 */
export function haversineMeters(
  coord1: LatLng | { lat: number; lng: number },
  coord2: LatLng | { lat: number; lng: number }
): number {
  const lat1 = 'latitude' in coord1 ? coord1.latitude : coord1.lat;
  const lon1 = 'longitude' in coord1 ? coord1.longitude : coord1.lng;
  const lat2 = 'latitude' in coord2 ? coord2.latitude : coord2.lat;
  const lon2 = 'longitude' in coord2 ? coord2.longitude : coord2.lng;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Checks whether a given location fix or coordinate is inside a zone's virtual boundary (geofence).
 */
export function isInsideZone(
  location: LocationFix | LatLng | { lat: number; lng: number },
  zone: Zone
): boolean {
  const dist = haversineMeters(location, zone.center);
  return dist <= zone.radiusMeters;
}

/**
 * Finds the nearest zone to the given location fix and returns the zone plus the distance in meters.
 */
export function nearestZone(
  location: LocationFix | LatLng | { lat: number; lng: number },
  zones: Zone[]
): { zone: Zone; distanceMeters: number } | null {
  if (!zones || zones.length === 0) return null;

  let minDistance = Infinity;
  let nearest: Zone = zones[0];

  for (const zone of zones) {
    const d = haversineMeters(location, zone.center);
    if (d < minDistance) {
      minDistance = d;
      nearest = zone;
    }
  }

  return {
    zone: nearest,
    distanceMeters: Math.round(minDistance),
  };
}

/**
 * Classifies location accuracy into 'tinggi', 'sedang', or 'rendah' based on Sprint 08 criteria:
 * <= 20m: tinggi (5-20m)
 * 21 - 100m: sedang
 * > 100m: rendah
 */
export function accuracyLevel(meters: number | null | undefined): AccuracyLevel {
  if (meters == null || isNaN(meters)) return 'rendah';
  if (meters <= 20) return 'tinggi';
  if (meters <= 100) return 'sedang';
  return 'rendah';
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
