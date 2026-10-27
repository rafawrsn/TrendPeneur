import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Image as ImageIcon, X, Upload } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { useToast } from '@/src/components/ui/Toast';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { getService, ApiError } from '@/src/api';
import { PROOF_MAX_BYTES, ALLOWED_PROOF_TYPES } from '@/src/config/plan';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UploadProofScreen() {
  const router = useRouter();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  useRequireAuth({ returnTo: `/premium/upload-proof?paymentId=${paymentId ?? ''}` });
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState('');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.show('Izin galeri diperlukan. Buka pengaturan untuk mengaktifkan.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      validateAndSet(result.assets[0]);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.show('Izin kamera diperlukan. Buka pengaturan untuk mengaktifkan.', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      validateAndSet(result.assets[0]);
    }
  };

  const validateAndSet = async (asset: ImagePicker.ImagePickerAsset) => {
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_PROOF_TYPES.includes(ext as any)) {
      toast.show('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.', 'error');
      return;
    }

    let size = asset.fileSize ?? 0;
    if (size === 0 && asset.uri.startsWith('file://')) {
      try {
        const info = await FileSystem.getInfoAsync(asset.uri);
        if (info.exists) size = info.size;
      } catch {
        // ignore
      }
    }

    if (size > PROOF_MAX_BYTES) {
      toast.show('Ukuran file terlalu besar (maks 5 MB).', 'error');
      return;
    }

    setImageUri(asset.uri);
    setFileName(asset.fileName ?? `proof.${ext}`);
    setFileSize(size);
    setFileType(`image/${ext}`);
  };

  const handleUpload = async () => {
    if (!imageUri) {
      toast.show('Pilih bukti pembayaran dulu.', 'error');
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 20, 80));
      }, 300);

      await getService().uploadProof({
        paymentId,
        fileUri: imageUri,
        fileName,
        fileSize,
        fileType,
        note: note.trim() || undefined,
      });

      clearInterval(interval);
      setProgress(100);
      toast.show('Bukti pembayaran diunggah. Menunggu verifikasi.', 'success');
      router.replace('/premium/status');
    } catch (e) {
      setProgress(0);
      if (e instanceof ApiError) toast.show(e.indonesianMessage, 'error');
      else toast.show('Gagal mengunggah. Coba lagi.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Unggah Bukti</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.desc}>Unggah screenshot bukti pembayaran QRIS kamu. File harus JPG, PNG, atau WEBP (maks 5 MB).</Text>

        {imageUri ? (
          <Card style={styles.previewCard}>
            <View style={styles.previewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <Pressable
                style={styles.removeButton}
                onPress={() => { setImageUri(null); setFileName(''); }}
                accessibilityLabel="Hapus gambar"
                accessibilityRole="button"
              >
                <X size={18} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            </View>
            <Text style={styles.fileName}>{fileName}</Text>
            <Button label="Ganti Gambar" onPress={() => setImageUri(null)} variant="secondary" size="sm" fullWidth />
          </Card>
        ) : (
          <View style={styles.pickButtons}>
            <Pressable style={styles.pickButton} onPress={pickFromGallery} accessibilityLabel="Pilih dari galeri" accessibilityRole="button">
              <ImageIcon size={28} color={colors.primary} strokeWidth={2} />
              <Text style={styles.pickLabel}>Galeri</Text>
            </Pressable>
            <Pressable style={styles.pickButton} onPress={pickFromCamera} accessibilityLabel="Ambil foto" accessibilityRole="button">
              <Camera size={28} color={colors.primary} strokeWidth={2} />
              <Text style={styles.pickLabel}>Kamera</Text>
            </Pressable>
          </View>
        )}

        <Input
          label="Catatan (opsional)"
          value={note}
          onChangeText={setNote}
          placeholder="Catatan untuk admin..."
          multiline
          maxLength={300}
          accessibilityLabel="Catatan"
        />

        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Mengunggah... {progress}%</Text>
          </View>
        )}

        <Button
          label="Unggah Bukti"
          onPress={handleUpload}
          loading={uploading}
          disabled={!imageUri}
          fullWidth
          icon={<Upload size={18} color="#FFFFFF" strokeWidth={2} />}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  desc: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  pickButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pickButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  previewCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  previewWrapper: {
    position: 'relative',
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.card,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
