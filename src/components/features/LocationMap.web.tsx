// [REQUIREMENT: Task 02 - Web Map Component (Leaflet + OpenStreetMap)]
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Navigation, Crosshair } from 'lucide-react-native';
import type { LocationMapProps } from './LocationMap.types';
import { DEFAULT_MAP_CENTER } from '../../mock/zones';
import { colors, radius, shadows, spacing, typography } from '../../theme/tokens';
import type * as LeafletType from 'leaflet';

export function LocationMap({
  userLocation,
  zones,
  selectedZoneId,
  insideZoneIds = [],
  onZonePress,
  onMapPress,
  height = 360,
  style,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const leafletModuleRef = useRef<typeof LeafletType | null>(null);

  const userMarkerRef = useRef<LeafletType.CircleMarker | null>(null);
  const userAccuracyCircleRef = useRef<LeafletType.Circle | null>(null);
  const zoneLayersRef = useRef<{ [zoneId: string]: { circle: LeafletType.Circle; marker: LeafletType.CircleMarker } }>({});

  const [isReady, setIsReady] = useState(false);

  // 1. Inject Leaflet CSS once in browser
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const cssId = 'leaflet-css-unpkg';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);

  // 2. Dynamically import Leaflet and initialize map instance
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === 'undefined' || !containerRef.current) return;

      const L = await import('leaflet');
      leafletModuleRef.current = L;

      if (isCancelled || !containerRef.current) return;

      // Clean existing map instance if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const initialLat = userLocation ? userLocation.lat : DEFAULT_MAP_CENTER.latitude;
      const initialLng = userLocation ? userLocation.lng : DEFAULT_MAP_CENTER.longitude;

      const map = L.map(containerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
      });

      // Add OpenStreetMap tile layer with required attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Handle map clicks
      map.on('click', (e: LeafletType.LeafletMouseEvent) => {
        if (onMapPress) {
          onMapPress({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        }
      });

      mapRef.current = map;
      setIsReady(true);
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsReady(false);
    };
  }, []);

  // 3. Update Zone Layers (Circles & Markers)
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletModuleRef.current;
    if (!map || !L || !isReady) return;

    // Clean old zone layers
    Object.values(zoneLayersRef.current).forEach(({ circle, marker }) => {
      circle.remove();
      marker.remove();
    });
    zoneLayersRef.current = {};

    zones.forEach((zone) => {
      const isInside = insideZoneIds.includes(zone.id);
      const isSelected = selectedZoneId === zone.id;

      const strokeColor = isInside ? colors.accent : isSelected ? colors.primaryDark : colors.primary;
      const fillColor = isInside ? colors.accent : colors.primary;
      const fillOpacity = isInside ? 0.28 : isSelected ? 0.22 : 0.14;

      // Circle representing geofence radius
      const circle = L.circle([zone.center.latitude, zone.center.longitude], {
        radius: zone.radiusMeters,
        color: strokeColor,
        weight: isInside || isSelected ? 3 : 2,
        fillColor,
        fillOpacity,
        dashArray: zone.approximate ? '6, 6' : undefined,
      }).addTo(map);

      // Center marker
      const marker = L.circleMarker([zone.center.latitude, zone.center.longitude], {
        radius: isInside ? 8 : 6,
        color: colors.surface,
        weight: 2,
        fillColor: strokeColor,
        fillOpacity: 1,
      }).addTo(map);

      // Popup with zone information
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 160px;">
          <b style="color: ${colors.primary}; font-size: 14px;">${zone.name}</b>
          <div style="font-size: 11px; color: ${colors.textMuted}; margin: 3px 0;">Radius: ${zone.radiusMeters} m</div>
          <div style="font-size: 12px; color: ${colors.text}; margin-top: 4px;">${zone.rationale}</div>
          ${isInside ? `<div style="margin-top: 6px; display: inline-block; padding: 2px 6px; background: ${colors.accentSoft}; color: ${colors.accent}; border-radius: 4px; font-weight: bold; font-size: 11px;">Kamu di dalam zona!</div>` : ''}
        </div>
      `);

      circle.on('click', () => onZonePress?.(zone));
      marker.on('click', () => onZonePress?.(zone));

      zoneLayersRef.current[zone.id] = { circle, marker };
    });
  }, [zones, insideZoneIds, selectedZoneId, isReady, onZonePress]);

  // 4. Update User Marker and Accuracy Circle
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletModuleRef.current;
    if (!map || !L || !isReady) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.remove();
        userAccuracyCircleRef.current = null;
      }
      return;
    }

    const { lat, lng, accuracy } = userLocation;

    // Accuracy Circle
    if (accuracy && accuracy > 0) {
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle([lat, lng], {
          radius: accuracy,
          color: colors.primary,
          weight: 1,
          fillColor: colors.primary,
          fillOpacity: 0.12,
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng([lat, lng]);
        userAccuracyCircleRef.current.setRadius(accuracy);
      }
    } else if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.remove();
      userAccuracyCircleRef.current = null;
    }

    // User location marker
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 9,
        color: colors.surface,
        weight: 3,
        fillColor: userLocation.source === 'simulated' ? colors.warning : colors.primary,
        fillOpacity: 1,
      }).addTo(map);

      userMarkerRef.current.bindPopup(
        `<b style="color: ${colors.text};">Posisi Anda (${userLocation.source === 'simulated' ? 'Simulasi' : 'GPS'})</b>`
      );
    } else {
      userMarkerRef.current.setLatLng([lat, lng]);
      userMarkerRef.current.setStyle({
        fillColor: userLocation.source === 'simulated' ? colors.warning : colors.primary,
      });
    }
  }, [userLocation, isReady]);

  // Recenter helper
  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
    } else {
      map.setView([DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude], 14, {
        animate: true,
      });
    }
  }, [userLocation]);

  return (
    <View style={[styles.container, { height }, style]}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius.card,
          overflow: 'hidden',
          zIndex: 1,
        }}
      />
      {/* Floating Recenter Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenter}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Pusatkan peta ke lokasi saya"
      >
        <Crosshair size={20} color={colors.primary} />
        <Text style={styles.recenterText}>Pusatkan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.card,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  recenterButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  recenterText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
  },
});
