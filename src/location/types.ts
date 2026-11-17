// [REQUIREMENT: Location-Based Services Types]
// Types for GPS, LocationFix, Geofencing, and Tracking Profiles

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type AccuracyLevel = 'tinggi' | 'sedang' | 'rendah';

export interface LocationFix {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: number;
  source: 'gps' | 'simulated';
}

export type ZoneType = 'campus' | 'market' | 'mall' | 'public_space';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  center: LatLng;
  radiusMeters: number;
  productSlugs: string[];
  rationale: string;
  approximate?: boolean;
}

export type GeofenceEventType = 'enter' | 'exit';

export interface GeofenceEvent {
  id: string;
  zoneId: string;
  zoneName: string;
  type: GeofenceEventType;
  at: number;
  message: string;
}

export type TrackingProfileKey = 'balanced' | 'high_accuracy' | 'battery_saver';

export interface TrackingProfile {
  key: TrackingProfileKey;
  label: string;
  description: string;
  accuracyName: string;
  timeInterval: number; // in milliseconds
  distanceInterval: number; // in meters
}

export interface TrackingStats {
  received: number;
  processed: number;
}

export interface GeocodeResult {
  formattedAddress: string;
  street?: string;
  district?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}
