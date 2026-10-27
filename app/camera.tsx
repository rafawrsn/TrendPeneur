import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CameraView,
  CameraType,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera';
import {
  ArrowLeft,
  RefreshCw,
  Zap,
  ZapOff,
  Camera as CameraIcon,
  Check,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  // [REQUIREMENT: SENSOR KAMERA - Ref untuk memanggil fungsi hardware kamera]
  const cameraRef = useRef<CameraView>(null);

  // [REQUIREMENT: SENSOR KAMERA - Manajemen Izin Akses Sensor Kamera]
  const [permission, requestPermission] = useCameraPermissions();

  // [REQUIREMENT: useState] - Mengelola orientasi sensor kamera (Kamera Depan vs Kamera Belakang)
  const [facing, setFacing] = useState<CameraType>('back');

  // [REQUIREMENT: useState] - Mengelola mode lampu kilat (Flash / Torch)
  const [flash, setFlash] = useState<FlashMode>('off');

  // [REQUIREMENT: useState] - Status kesiapan sensor kamera
  const [isCameraReady, setIsCameraReady] = useState(false);

  // [REQUIREMENT: useState] - Status proses pengambilan foto
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  // [REQUIREMENT: useState] - Hasil foto yang berhasil ditangkap oleh sensor kamera
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  // Fungsi toggle pergantian sensor kamera (Depan <-> Belakang)
  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Fungsi toggle mode flash
  const toggleFlash = () => {
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  // Fungsi mengambil gambar dari sensor kamera
  const handleTakePhoto = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto) {
      return;
    }

    try {
      setIsTakingPhoto(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
        toast.show('Foto berhasil diambil dari sensor kamera!', 'success');
      }
    } catch {
      toast.show('Gagal mengambil foto. Silakan coba lagi.', 'error');
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // Fungsi konfirmasi hasil foto
  const handleUsePhoto = () => {
    toast.show('Foto berhasil disimpan / digunakan!', 'success');
    router.back();
  };

  // Fungsi foto ulang
  const handleRetake = () => {
    setCapturedPhotoUri(null);
  };

  // 1. Loading state izin kamera
  if (!permission) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Memeriksa sensor kamera...</Text>
      </View>
    );
  }

  // 2. Jika izin kamera belum diberikan
  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <AlertCircle size={48} color={colors.warning} strokeWidth={2} />
          </View>
          <Text style={styles.permissionTitle}>Izin Sensor Kamera</Text>
          <Text style={styles.permissionDesc}>
            Aplikasi membutuhkan izin untuk mengakses sensor kamera perangkat agar Anda dapat mengambil foto secara langsung.
          </Text>
          <View style={styles.permissionButtons}>
            <Button
              label="Berikan Izin Kamera"
              onPress={requestPermission}
              fullWidth
              icon={<CameraIcon size={18} color="#FFFFFF" strokeWidth={2} />}
            />
            <View style={{ height: spacing.sm }} />
            <Button
              label="Kembali"
              variant="secondary"
              onPress={() => router.back()}
              fullWidth
            />
          </View>
        </View>
      </View>
    );
  }

  // 3. Tampilan Preview Hasil Foto
  if (capturedPhotoUri) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} resizeMode="cover" />

        {/* Header Preview */}
        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <Pressable
            style={styles.circleButton}
            onPress={handleRetake}
            accessibilityLabel="Tutup preview"
            accessibilityRole="button"
          >
            <X size={22} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Preview Foto</Text>
          </View>
        </View>

        {/* Kontrol Aksi Preview */}
        <View style={[styles.previewActionContainer, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Pressable
            style={[styles.previewActionButton, styles.retakeButton]}
            onPress={handleRetake}
            accessibilityLabel="Ambil ulang"
            accessibilityRole="button"
          >
            <RefreshCw size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.previewActionText}>Ambil Ulang</Text>
          </Pressable>

          <Pressable
            style={[styles.previewActionButton, styles.confirmButton]}
            onPress={handleUsePhoto}
            accessibilityLabel="Gunakan foto"
            accessibilityRole="button"
          >
            <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.previewActionText}>Gunakan Foto</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // 4. Tampilan Utama Viewfinder Sensor Kamera
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Sensor Kamera Langsung */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flash}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Frame Fokus Estetika (Viewfinder Guidelines) */}
      <View style={styles.viewfinderContainer} pointerEvents="none">
        <View style={styles.viewfinderBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* Bar Atas: Tombol Kembali, Indikator Facing & Flash */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <Pressable
          style={styles.circleButton}
          onPress={() => router.back()}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </Pressable>

        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            Sensor: {facing === 'back' ? 'Belakang' : 'Depan'}
          </Text>
        </View>

        <Pressable
          style={styles.circleButton}
          onPress={toggleFlash}
          accessibilityLabel="Toggle flash"
          accessibilityRole="button"
        >
          {flash === 'off' ? (
            <ZapOff size={20} color="#FFFFFF" strokeWidth={2} />
          ) : (
            <Zap size={20} color="#FBBF24" strokeWidth={2} />
          )}
        </Pressable>
      </View>

      {/* Bar Bawah: Shutter Button & Flip Camera */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.bottomBarSide}>
          <Text style={styles.flashStatusText}>
            Flash: {flash.toUpperCase()}
          </Text>
        </View>

        {/* Shutter Button */}
        <Pressable
          style={[styles.shutterOuter, isTakingPhoto && styles.shutterDisabled]}
          onPress={handleTakePhoto}
          disabled={!isCameraReady || isTakingPhoto}
          accessibilityLabel="Ambil foto"
          accessibilityRole="button"
        >
          {isTakingPhoto ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>

        {/* Flip Camera Button */}
        <View style={styles.bottomBarSide}>
          <Pressable
            style={styles.circleButton}
            onPress={toggleCameraFacing}
            accessibilityLabel="Ganti sensor kamera depan atau belakang"
            accessibilityRole="button"
          >
            <RefreshCw size={22} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilyMedium,
    color: colors.textMuted,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: radius.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  permissionButtons: {
    width: '100%',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
  },
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderBox: {
    width: 260,
    height: 320,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  bottomBarSide: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashStatusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  previewActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: spacing.lg,
  },
  previewActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  previewActionText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilySemiBold,
  },
});
