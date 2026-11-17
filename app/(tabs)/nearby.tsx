// [REQUIREMENT: Week 10 - Location-Based Services (LBS) Main Screen]
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Crosshair,
  Compass,
  BatteryCharging,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import * as Location from 'expo-location';

import { colors, typography, radius, spacing, shadows } from '@/src/theme/tokens';
import { getService } from '@/src/api';
import { ZONES } from '@/src/mock/zones';
import { accuracyLevel, formatDistance, haversineMeters, nearestZone } from '@/src/location/geo';
import { useLocationStore, TRACKING_PROFILES } from '@/src/stores/location';
import { useCurrentLocation } from '@/src/location/useCurrentLocation';
import { useLocationTracking } from '@/src/location/useLocationTracking';
import { useGeofence } from '@/src/location/useGeofence';
import { useReverseGeocode } from '@/src/location/useReverseGeocode';
import { LocationMap } from '@/src/components/features/LocationMap';
import { ProductCard } from '@/src/components/features/ProductCard';

import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { Sheet } from '@/src/components/ui/Sheet';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Stat } from '@/src/components/ui/Stat';
import type { Zone, TrackingProfileKey, LatLng } from '@/src/location/types';

export default function NearbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- Location & Tracking Hooks ---
  const {
    isLoading: isLocationLoading,
    error: locationError,
    requestPermissionAndGetLocation,
    getCurrentPosition,
  } = useCurrentLocation();

  // Active tracking subscription (battery optimized)
  useLocationTracking();

  // Active geofencing evaluation & toast triggers
  useGeofence(ZONES);

  // Store state
  const currentFix = useLocationStore((s) => s.currentFix);
  const setCurrentFix = useLocationStore((s) => s.setCurrentFix);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const setPermissionStatus = useLocationStore((s) => s.setPermissionStatus);
  const insideZoneIds = useLocationStore((s) => s.insideZoneIds);
  const events = useLocationStore((s) => s.events);
  const clearEvents = useLocationStore((s) => s.clearEvents);
  const trackingEnabled = useLocationStore((s) => s.trackingEnabled);
  const setTrackingEnabled = useLocationStore((s) => s.setTrackingEnabled);
  const simulationEnabled = useLocationStore((s) => s.simulationEnabled);
  const setSimulationEnabled = useLocationStore((s) => s.setSimulationEnabled);
  const selectedProfileKey = useLocationStore((s) => s.selectedProfileKey);
  const setSelectedProfileKey = useLocationStore((s) => s.setSelectedProfileKey);
  const trackingStats = useLocationStore((s) => s.trackingStats);
  const resetStats = useLocationStore((s) => s.resetStats);
  const selectedZoneId = useLocationStore((s) => s.selectedZoneId);
  const setSelectedZoneId = useLocationStore((s) => s.setSelectedZoneId);

  // Reverse Geocoding Hook
  const { address, isLoading: isGeocodingLoading, refetch: refetchAddress } = useReverseGeocode(
    currentFix
  );

  // UI state
  const [showPermissionSheet, setShowPermissionSheet] = useState(false);
  const [showAccuracyInfo, setShowAccuracyInfo] = useState(false);

  // Fetch trending products from API
  const { data: trendingProducts = [] } = useQuery({
    queryKey: ['trending-products-lbs'],
    queryFn: () => getService().getTrendingProducts(undefined, 20),
    staleTime: 5 * 60 * 1000,
  });

  // Check initial permission status on mount
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setPermissionStatus(status);
      if (status === Location.PermissionStatus.GRANTED && !currentFix) {
        getCurrentPosition();
      }
    });
  }, [setPermissionStatus, getCurrentPosition, currentFix]);

  // Handle explicit permission request
  const handleRequestPermission = async () => {
    setShowPermissionSheet(false);
    await requestPermissionAndGetLocation();
  };

  // Open settings for denied permission
  const handleOpenSettings = () => {
    if (Platform.OS === 'web') {
      window.alert(
        'Untuk mengizinkan lokasi di web, klik ikon gembok / perizinan situs di bilah alamat browser Anda dan pilih "Izinkan Lokasi", lalu muat ulang halaman.'
      );
    } else {
      Linking.openSettings();
    }
  };

  // Simulation jump handlers
  const handleSimulateLocation = (zone: Zone) => {
    setSimulationEnabled(true);
    setSelectedZoneId(zone.id);
    setCurrentFix({
      lat: zone.center.latitude,
      lng: zone.center.longitude,
      accuracy: 8,
      timestamp: Date.now(),
      source: 'simulated',
    });
  };

  const handleSimulateOutside = () => {
    setSimulationEnabled(true);
    setSelectedZoneId(null);
    setCurrentFix({
      lat: -7.9500,
      lng: 112.6000,
      accuracy: 15,
      timestamp: Date.now(),
      source: 'simulated',
    });
  };

  const handleMapPress = (coord: LatLng) => {
    if (simulationEnabled) {
      setCurrentFix({
        lat: coord.latitude,
        lng: coord.longitude,
        accuracy: 10,
        timestamp: Date.now(),
        source: 'simulated',
      });
    }
  };

  // Identify active inside zones
  const activeInsideZones = useMemo(() => {
    return ZONES.filter((z) => insideZoneIds.includes(z.id));
  }, [insideZoneIds]);

  // Nearest zone info if outside
  const nearest = useMemo(() => {
    if (!currentFix) return null;
    return nearestZone(currentFix, ZONES);
  }, [currentFix]);

  // Accuracy level computation
  const currentAccuracyLevel = useMemo(() => {
    return accuracyLevel(currentFix?.accuracy);
  }, [currentFix?.accuracy]);

  // Products in current active zone(s)
  const zoneTrendingProducts = useMemo(() => {
    if (activeInsideZones.length === 0) return [];
    const activeSlugs = activeInsideZones.flatMap((z) => z.productSlugs);
    return trendingProducts.filter((item) => activeSlugs.includes(item.product.slug));
  }, [activeInsideZones, trendingProducts]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.appName}>TrendPreneur</Text>
            <Text style={styles.screenTitle}>Peluang Usaha Sekitar Saya</Text>
          </View>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: currentFix
                    ? currentFix.source === 'simulated'
                      ? colors.warning
                      : colors.success
                    : colors.border,
                },
              ]}
            />
            <Text style={styles.statusPillText}>
              {currentFix
                ? currentFix.source === 'simulated'
                  ? 'Simulasi'
                  : 'GPS Aktif'
                : 'GPS Siaga'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* TASK 01: LOCATION PERMISSION & GPS FIX CARD              */}
        {/* ========================================================= */}
        {permissionStatus === Location.PermissionStatus.DENIED ? (
          <Card style={styles.deniedCard}>
            <ErrorState
              message={
                Platform.OS === 'web'
                  ? 'Izin akses lokasi di browser diblokir. Silakan klik ikon gembok pada bilah alamat browser untuk mengaktifkan izin lokasi.'
                  : 'Izin akses lokasi tidak diberikan. Aktifkan izin lokasi di pengaturan perangkat untuk menikmati fitur Peluang Usaha Sekitar.'
              }
              onRetry={handleOpenSettings}
            />
            <View style={{ marginTop: spacing.md }}>
              <Button
                label="Buka Pengaturan Izin"
                onPress={handleOpenSettings}
                variant="primary"
                fullWidth
              />
            </View>
          </Card>
        ) : !currentFix ? (
          <Card style={styles.welcomeLocationCard}>
            <View style={styles.welcomeIconWrapper}>
              <Compass size={36} color={colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Jelajahi Peluang Sekitarmu</Text>
            <Text style={styles.welcomeSubtitle}>
              TrendPreneur membutuhkan izin lokasi untuk mendeteksi sentra usaha terdekat dan
              rekomendasi produk tren yang relevan di kawasanmu.
            </Text>
            <Button
              label={isLocationLoading ? 'Mengakses GPS...' : 'Aktifkan & Ambil Lokasi'}
              onPress={() => setShowPermissionSheet(true)}
              loading={isLocationLoading}
              variant="primary"
              fullWidth
              icon={<Crosshair size={18} color="#FFFFFF" />}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          <Card style={styles.locationCard}>
            <View style={styles.locationHeaderRow}>
              <View style={styles.locationTitleGroup}>
                <MapPin size={20} color={colors.primary} />
                <Text style={styles.locationCardTitle}>Lokasi Saya</Text>
              </View>
              <Badge
                label={
                  currentAccuracyLevel === 'tinggi'
                    ? 'Akurasi Tinggi'
                    : currentAccuracyLevel === 'sedang'
                    ? 'Akurasi Sedang'
                    : 'Akurasi Rendah'
                }
                variant={
                  currentAccuracyLevel === 'tinggi'
                    ? 'success'
                    : currentAccuracyLevel === 'sedang'
                    ? 'warning'
                    : 'neutral'
                }
              />
            </View>

            {/* [REQUIREMENT: Task 03A - Reverse Geocoding Address] */}
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Alamat Terdeteksi (Reverse Geocoding):</Text>
              {isGeocodingLoading ? (
                <View style={styles.geocodingLoadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.geocodingLoadingText}>Menerjemahkan koordinat...</Text>
                </View>
              ) : (
                <Text style={styles.addressValue}>
                  {address?.formattedAddress || 'Sedang memuat alamat...'}
                </Text>
              )}
            </View>

            {/* Coordinates & Accuracy Details */}
            <View style={styles.coordsGrid}>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>Latitude</Text>
                <Text style={styles.coordValue}>{currentFix.lat.toFixed(6)}°</Text>
              </View>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>Longitude</Text>
                <Text style={styles.coordValue}>{currentFix.lng.toFixed(6)}°</Text>
              </View>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>Presisi</Text>
                <Text style={styles.coordValue}>
                  {currentFix.accuracy != null ? `±${currentFix.accuracy} m` : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.locationActionsRow}>
              <Button
                label="Perbarui Lokasi"
                size="sm"
                variant="secondary"
                onPress={() => getCurrentPosition()}
                loading={isLocationLoading}
                icon={<RefreshCw size={14} color={colors.primary} />}
              />
              <TouchableOpacity
                style={styles.accuracyInfoToggle}
                onPress={() => setShowAccuracyInfo(!showAccuracyInfo)}
                activeOpacity={0.7}
              >
                <Info size={16} color={colors.textMuted} />
                <Text style={styles.accuracyInfoToggleText}>Kenapa akurasi bervariasi?</Text>
                {showAccuracyInfo ? (
                  <ChevronUp size={16} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={16} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            {/* Accuracy Factors Info Accordion */}
            {showAccuracyInfo && (
              <View style={styles.accuracyInfoPanel}>
                <Text style={styles.accuracyInfoTitle}>
                  Faktor-Faktor yang Memengaruhi Akurasi GPS:
                </Text>
                <Text style={styles.accuracyInfoItem}>
                  • <Text style={styles.boldText}>Sinyal Satelit:</Text> Terhalang saat berada di
                  dalam ruangan, basement, atau di bawah kanopi tebal.
                </Text>
                <Text style={styles.accuracyInfoItem}>
                  • <Text style={styles.boldText}>Jaringan Internet:</Text> Network Provider memakai
                  triangulasi BTS/Wi-Fi yang memiliki radius lebih lebar.
                </Text>
                <Text style={styles.accuracyInfoItem}>
                  • <Text style={styles.boldText}>Lingkungan Gedung:</Text> Bangunan tinggi dan pohon
                  rimbun memicu pantulan multipath sinyal.
                </Text>
                <Text style={styles.accuracyInfoItem}>
                  • <Text style={styles.boldText}>Platform Web Browser:</Text> Browser sering
                  memanfaatkan estimasi IP address atau Wi-Fi hotspot sehingga akurasi dapat
                  mencapai ratusan meter.
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* ========================================================= */}
        {/* TASK 02: MAP COMPONENT WITH SDK INTEGRATION              */}
        {/* ========================================================= */}
        <View style={styles.sectionWrapper}>
          <SectionHeader title="Peta Sentra Usaha & Geofencing" />
          <Text style={styles.sectionSubtitle}>
            Sentuh peta atau zona untuk melihat peluang usaha di kawasan tersebut
          </Text>

          <LocationMap
            userLocation={currentFix}
            zones={ZONES}
            selectedZoneId={selectedZoneId}
            insideZoneIds={insideZoneIds}
            onZonePress={(zone) => {
              setSelectedZoneId(zone.id);
            }}
            onMapPress={handleMapPress}
            height={340}
          />
        </View>

        {/* ========================================================= */}
        {/* TASK 03B: GEOFENCING STATUS & PELUANG USAHA               */}
        {/* ========================================================= */}
        <View style={styles.sectionWrapper}>
          {activeInsideZones.length > 0 ? (
            <Card style={styles.activeGeofenceCard}>
              <View style={styles.activeGeofenceHeader}>
                <View style={styles.activeGeofenceIconBadge}>
                  <Sparkles size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Badge label="Zona Aktif Terdeteksi" variant="accent" />
                  <Text style={styles.activeGeofenceTitle}>
                    {activeInsideZones.map((z) => z.name).join(', ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.activeGeofenceRationale}>
                {activeInsideZones[0].rationale}
              </Text>

              <View style={styles.zoneStatsRow}>
                <Text style={styles.zoneRadiusText}>
                  Radius Geofence: {activeInsideZones[0].radiusMeters} meter
                </Text>
                {activeInsideZones[0].approximate && (
                  <Badge label="Koordinat Estimasi" variant="warning" />
                )}
              </View>

              {/* Matching Trending Products */}
              <View style={styles.zoneProductsSection}>
                <Text style={styles.zoneProductsHeader}>
                  Produk Tren yang Sangat Cocok di Zona Ini:
                </Text>
                {zoneTrendingProducts.length > 0 ? (
                  zoneTrendingProducts.map((item) => (
                    <ProductCard
                      key={item.product.slug}
                      item={item}
                      onPress={() => router.push(`/product/${item.product.slug}` as any)}
                    />
                  ))
                ) : (
                  <Text style={styles.noProductsText}>
                    Memuat rekomendasi produk untuk zona ini...
                  </Text>
                )}
              </View>
            </Card>
          ) : (
            <Card style={styles.outsideGeofenceCard}>
              <View style={styles.outsideHeaderRow}>
                <AlertTriangle size={22} color={colors.warning} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.outsideTitle}>Di Luar Batas Zona Geofence</Text>
                  <Text style={styles.outsideSubtitle}>
                    {nearest
                      ? `Zona terdekat: ${nearest.zone.name} (${formatDistance(
                          nearest.distanceMeters
                        )}). Dekati lokasi atau gunakan simulasi untuk melihat rekomendasi.`
                      : 'Aktifkan lokasi untuk mengukur jarak ke sentra usaha terdekat.'}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* ========================================================= */}
        {/* SIMULASI & UJI GEOFENCING (TASK 03 & SPRINT DEMO)         */}
        {/* ========================================================= */}
        <View style={styles.sectionWrapper}>
          <SectionHeader title="Simulasi Lokasi (Demo Praktikum)" />
          <Text style={styles.sectionSubtitle}>
            Uji event masuk (ENTER) dan keluar (EXIT) geofence tanpa perlu berpindah fisik
          </Text>

          <Card style={styles.simulationCard}>
            <View style={styles.simulationHeaderRow}>
              <Text style={styles.simulationDescription}>
                Pilih target sentra usaha untuk mensimulasikan GPS perangkat:
              </Text>
              {simulationEnabled && (
                <TouchableOpacity
                  onPress={() => {
                    setSimulationEnabled(false);
                    getCurrentPosition();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Kembali ke GPS Asli"
                >
                  <Text style={styles.resetGpsText}>Kembali ke GPS Asli</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.zoneChipsWrap}>
              {ZONES.map((zone) => {
                const isSelected = selectedZoneId === zone.id && simulationEnabled;
                return (
                  <Chip
                    key={zone.id}
                    label={`📍 ${zone.name}`}
                    selected={isSelected}
                    onPress={() => handleSimulateLocation(zone)}
                  />
                );
              })}
              <Chip
                label="🚫 Keluar Zona (Exit)"
                selected={simulationEnabled && selectedZoneId === null}
                onPress={handleSimulateOutside}
              />
            </View>
          </Card>
        </View>

        {/* ========================================================= */}
        {/* BATTERY OPTIMIZATION & TRACKING SETTINGS                 */}
        {/* ========================================================= */}
        <View style={styles.sectionWrapper}>
          <SectionHeader title="Optimasi Daya Baterai (Tracking Profiles)" />
          <Text style={styles.sectionSubtitle}>
            Kelola efisiensi daya dengan konfigurasi interval dan filter jarak
          </Text>

          <Card style={styles.batteryCard}>
            <View style={styles.trackingToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.trackingTitle}>Pelacakan Posisi Berkelanjutan</Text>
                <Text style={styles.trackingSubtitle}>
                  {trackingEnabled
                    ? 'Watcher aktif di latar depan (Foreground)'
                    : 'Watcher dimatikan untuk menghemat baterai'}
                </Text>
              </View>
              <Button
                label={trackingEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                size="sm"
                variant={trackingEnabled ? 'danger' : 'primary'}
                onPress={() => setTrackingEnabled(!trackingEnabled)}
              />
            </View>

            <View style={styles.profileSelectorWrapper}>
              <Text style={styles.profileLabel}>Pilih Profil Penggunaan Lokasi:</Text>
              <View style={styles.profilesGrid}>
                {(Object.keys(TRACKING_PROFILES) as TrackingProfileKey[]).map((key) => {
                  const p = TRACKING_PROFILES[key];
                  const isSelected = selectedProfileKey === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.profileOption, isSelected && styles.profileOptionSelected]}
                      onPress={() => setSelectedProfileKey(key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.profileOptionTitle,
                          isSelected && styles.profileOptionTitleSelected,
                        ]}
                      >
                        {p.label}
                      </Text>
                      <Text style={styles.profileOptionDesc}>{p.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tracking Efficiency Statistics */}
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Statistik Efisiensi Lokasi:</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Stat label="Fix Diterima (GPS)" value={String(trackingStats.received)} />
                </View>
                <View style={styles.statCol}>
                  <Stat
                    label="Fix Diproses (Lolos Filter)"
                    value={String(trackingStats.processed)}
                  />
                </View>
              </View>
              <Text style={styles.statsNote}>
                * Komputasi geofence hanya dijalankan saat pergerakan melampaui filter jarak,
                menghemat siklus CPU & daya baterai.
              </Text>
            </View>
          </Card>
        </View>

        {/* ========================================================= */}
        {/* GEOFENCE EVENT LOG (TASK 03 & AUDIT SPRINT)               */}
        {/* ========================================================= */}
        <View style={styles.sectionWrapper}>
          <View style={styles.logHeaderRow}>
            <View style={styles.logHeaderTitleGroup}>
              <History size={18} color={colors.text} />
              <Text style={styles.logSectionTitle}>Riwayat Event Geofencing</Text>
            </View>
            {events.length > 0 && (
              <TouchableOpacity onPress={clearEvents} activeOpacity={0.7}>
                <Text style={styles.clearLogText}>Bersihkan</Text>
              </TouchableOpacity>
            )}
          </View>

          {events.length === 0 ? (
            <Card style={styles.emptyLogCard}>
              <Text style={styles.emptyLogText}>
                Belum ada event masuk/keluar zona yang tercatat. Uji melalui tombol simulasi di atas.
              </Text>
            </Card>
          ) : (
            <Card style={styles.logCard}>
              {events.slice(0, 10).map((ev) => (
                <View key={ev.id} style={styles.logItem}>
                  <Badge
                    label={ev.type === 'enter' ? 'ENTER' : 'EXIT'}
                    variant={ev.type === 'enter' ? 'success' : 'warning'}
                  />
                  <View style={styles.logItemBody}>
                    <Text style={styles.logItemMessage}>{ev.message}</Text>
                    <Text style={styles.logItemTime}>
                      {new Date(ev.at).toLocaleTimeString('id-ID')}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Permission Explainer Sheet */}
      <Sheet
        visible={showPermissionSheet}
        onClose={() => setShowPermissionSheet(false)}
        title="Izin Akses Lokasi"
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetIconCircle}>
            <ShieldCheck size={36} color={colors.primary} />
          </View>
          <Text style={styles.sheetBodyText}>
            TrendPreneur menggunakan izin lokasi di latar depan (Foreground) untuk menampilkan
            rekomendasi peluang bisnis dan tren produk yang paling sesuai di sekitar area Anda.
          </Text>
          <Text style={styles.sheetSubText}>
            Kami menghormati privasi Anda: data lokasi Anda tidak dibagikan ke pihak ketiga dan tidak
            dilacak di latar belakang saat aplikasi ditutup.
          </Text>

          <Button
            label="Lanjutkan & Berikan Izin"
            onPress={handleRequestPermission}
            variant="primary"
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyBold,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  welcomeLocationCard: {
    alignItems: 'center',
    padding: spacing.xl,
    textAlign: 'center',
  },
  welcomeIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  locationCard: {
    gap: spacing.md,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationCardTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  addressContainer: {
    backgroundColor: colors.bg,
    padding: spacing.md,
    borderRadius: radius.small,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  addressLabel: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: colors.textMuted,
  },
  addressValue: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginTop: 2,
    lineHeight: 20,
  },
  geocodingLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  geocodingLoadingText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  coordsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  coordBox: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.sm,
    borderRadius: radius.small,
  },
  coordLabel: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
  },
  coordValue: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    marginTop: 2,
  },
  locationActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  accuracyInfoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accuracyInfoToggleText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: colors.textMuted,
  },
  accuracyInfoPanel: {
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.small,
    gap: 4,
  },
  accuracyInfoTitle: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyBold,
    color: colors.primaryDark,
    marginBottom: 2,
  },
  accuracyInfoItem: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.text,
    lineHeight: 18,
  },
  boldText: {
    fontFamily: typography.fontFamilyBold,
  },
  deniedCard: {
    padding: spacing.md,
  },
  sectionWrapper: {
    gap: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  activeGeofenceCard: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  activeGeofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activeGeofenceIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  activeGeofenceTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    marginTop: 2,
  },
  activeGeofenceRationale: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
    lineHeight: 20,
  },
  zoneStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 181, 166, 0.2)',
  },
  zoneRadiusText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.textMuted,
  },
  zoneProductsSection: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  zoneProductsHeader: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  noProductsText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  outsideGeofenceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  outsideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  outsideTitle: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  outsideSubtitle: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  simulationCard: {
    gap: spacing.md,
  },
  simulationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simulationDescription: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: colors.textMuted,
    flex: 1,
  },
  resetGpsText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyBold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  zoneChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  batteryCard: {
    gap: spacing.lg,
  },
  trackingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  trackingTitle: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  trackingSubtitle: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  profileSelectorWrapper: {
    gap: spacing.sm,
  },
  profileLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  profilesGrid: {
    gap: spacing.sm,
  },
  profileOption: {
    backgroundColor: colors.bg,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  profileOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  profileOptionTitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  profileOptionTitleSelected: {
    color: colors.primary,
  },
  profileOptionDesc: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  statsCard: {
    backgroundColor: colors.bg,
    padding: spacing.md,
    borderRadius: radius.card,
    gap: spacing.sm,
  },
  statsTitle: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCol: {
    flex: 1,
  },
  statsNote: {
    fontSize: 11,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    lineHeight: 14,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logSectionTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  clearLogText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.danger,
  },
  emptyLogCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyLogText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
  },
  logCard: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logItemBody: {
    flex: 1,
  },
  logItemMessage: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  logItemTime: {
    fontSize: 11,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    marginTop: 1,
  },
  sheetContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  sheetIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetBodyText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilyMedium,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  sheetSubText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
