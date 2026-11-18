// [REQUIREMENT: Task 02 - Native Map Component (react-native-maps)]
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Crosshair, MapPin } from 'lucide-react-native';
import type { LocationMapProps } from './LocationMap.types';
import { DEFAULT_MAP_CENTER } from '../../mock/zones';
import { colors, radius, shadows, spacing, typography } from '../../theme/tokens';

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
  const mapRef = useRef<MapView | null>(null);

  const initialRegion = {
    latitude: userLocation ? userLocation.lat : DEFAULT_MAP_CENTER.latitude,
    longitude: userLocation ? userLocation.lng : DEFAULT_MAP_CENTER.longitude,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600
      );
    }
  }, [userLocation?.lat, userLocation?.lng]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const target = userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : DEFAULT_MAP_CENTER;

    mapRef.current.animateToRegion(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600
    );
  };

  return (
    <View style={[styles.container, { height }, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onPress={(e) => {
          if (onMapPress) {
            onMapPress(e.nativeEvent.coordinate);
          }
        }}
      >
        {/* Render Zone Circles and Markers */}
        {zones.map((zone) => {
          const isInside = insideZoneIds.includes(zone.id);
          const isSelected = selectedZoneId === zone.id;

          const strokeColor = isInside
            ? colors.accent
            : isSelected
            ? colors.primaryDark
            : colors.primary;
          const fillColor = isInside
            ? 'rgba(15, 181, 166, 0.28)'
            : isSelected
            ? 'rgba(8, 76, 158, 0.22)'
            : 'rgba(11, 99, 206, 0.15)';

          return (
            <React.Fragment key={zone.id}>
              <Circle
                center={zone.center}
                radius={zone.radiusMeters}
                strokeColor={strokeColor}
                fillColor={fillColor}
                strokeWidth={isInside || isSelected ? 3 : 2}
                lineDashPattern={zone.approximate ? [6, 6] : undefined}
              />
              <Marker
                coordinate={zone.center}
                title={zone.name}
                description={`Radius ${zone.radiusMeters} m • ${zone.rationale}`}
                onPress={() => onZonePress?.(zone)}
              >
                <View
                  style={[
                    styles.zoneMarker,
                    isInside && styles.zoneMarkerInside,
                    isSelected && styles.zoneMarkerSelected,
                  ]}
                >
                  <MapPin
                    size={16}
                    color={isInside ? colors.accent : colors.surface}
                  />
                  <Text
                    style={[
                      styles.zoneMarkerText,
                      isInside && styles.zoneMarkerTextInside,
                    ]}
                    numberOfLines={1}
                  >
                    {zone.name}
                  </Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* User Location Accuracy Circle and Marker */}
        {userLocation && (
          <>
            {userLocation.accuracy && userLocation.accuracy > 0 && (
              <Circle
                center={{
                  latitude: userLocation.lat,
                  longitude: userLocation.lng,
                }}
                radius={userLocation.accuracy}
                strokeColor="rgba(11, 99, 206, 0.5)"
                fillColor="rgba(11, 99, 206, 0.12)"
                strokeWidth={1}
              />
            )}
            <Marker
              coordinate={{
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              }}
              title={
                userLocation.source === 'simulated'
                  ? 'Lokasi Simulasi'
                  : 'Lokasi Anda (GPS)'
              }
              description={`Akurasi: ±${userLocation.accuracy ?? '?'} m`}
            >
              <View style={styles.userMarkerContainer}>
                <View
                  style={[
                    styles.userMarkerDot,
                    userLocation.source === 'simulated' &&
                      styles.userMarkerSimulated,
                  ]}
                />
              </View>
            </Marker>
          </>
        )}
      </MapView>

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
  map: {
    width: '100%',
    height: '100%',
  },
  recenterButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
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
  zoneMarker: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.surface,
    ...shadows.small,
  },
  zoneMarkerInside: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  zoneMarkerSelected: {
    backgroundColor: colors.primaryDark,
  },
  zoneMarkerText: {
    fontSize: 11,
    fontFamily: typography.fontFamilyBold,
    color: colors.surface,
  },
  zoneMarkerTextInside: {
    color: colors.accent,
  },
  userMarkerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 99, 206, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userMarkerSimulated: {
    backgroundColor: colors.warning,
  },
});
