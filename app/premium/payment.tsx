import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Copy, Download, QrCode } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useToast } from '@/src/components/ui/Toast';
import { useSessionStore } from '@/src/stores/session';
import { getService, ApiError } from '@/src/api';
import { PLAN } from '@/src/config/plan';
import { formatRupiah, formatCountdown } from '@/src/utils/format';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const user = useSessionStore((s) => s.user);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    (async () => {
      try {
        let active = await getService().getActivePayment();
        if (!active) {
          active = await getService().createPayment({ planCode: PLAN.code });
        }
        setPayment(active);
      } catch (e) {
        if (e instanceof ApiError) toast.show(e.indonesianMessage, 'error');
        else toast.show('Gagal memuat pembayaran.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!payment || payment.status !== 'PENDING_PAYMENT') return;
    const interval = setInterval(() => {
      const ms = new Date(payment.expiresAt).getTime() - Date.now();
      setCountdown(formatCountdown(ms));
      if (ms <= 0) {
        clearInterval(interval);
        setPayment((p: any) => p ? { ...p, status: 'EXPIRED' } : p);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [payment]);

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    toast.show(`${label} disalin.`, 'success');
  };

  const handleCancel = () => {
    Alert.alert('Batalkan Permintaan', 'Yakin ingin membatalkan?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Batalkan',
        style: 'destructive',
        onPress: async () => {
          try {
            await getService().cancelPayment(payment.id);
            toast.show('Permintaan dibatalkan.', 'info');
            router.replace('/premium/status');
          } catch (e) {
            if (e instanceof ApiError) toast.show(e.indonesianMessage, 'error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft size={22} color={colors.text} strokeWidth={2} /></Pressable>
          <Text style={styles.headerTitle}>Pembayaran</Text>
        </View>
        <View style={{ padding: spacing.lg }}>
          <Text style={styles.loadingText}>Memuat...</Text>
        </View>
      </View>
    );
  }

  if (!payment) return null;

  const expired = payment.status === 'EXPIRED';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Pembayaran QRIS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {expired && (
          <Card style={styles.expiredCard}>
            <Text style={styles.expiredText}>Permintaan pembayaran telah kedaluwarsa. Buat permintaan baru.</Text>
            <Button label="Buat Permintaan Baru" onPress={() => router.replace('/premium/paywall')} variant="secondary" fullWidth />
          </Card>
        )}

        {!expired && (
          <>
            <Card style={styles.countdownCard}>
              <Text style={styles.countdownLabel}>Selesaikan pembayaran dalam</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
            </Card>

            <Card style={styles.qrisCard}>
              <View style={styles.qrisPlaceholder}>
                <QrCode size={120} color={colors.text} strokeWidth={1.5} />
                <Text style={styles.qrisLabel}>QRIS CONTOH</Text>
                <Text style={styles.qrisSubLabel}>Ganti dengan QRIS asli di server</Text>
              </View>
              <Button
                label="Simpan QRIS"
                onPress={() => toast.show('QRIS disimpan (demo).', 'success')}
                variant="secondary"
                size="sm"
                icon={<Download size={16} color={colors.primary} strokeWidth={2} />}
              />
            </Card>

            <Card style={styles.amountCard}>
              <Text style={styles.amountLabel}>Jumlah yang harus dibayar</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountValue}>
                  {formatRupiah(payment.amountTotal - payment.uniqueCode)}
                  <Text style={styles.amountUnique}>{payment.uniqueCode.toString().padStart(3, '0')}</Text>
                </Text>
                <Pressable onPress={() => copyToClipboard(String(payment.amountTotal), 'Total')} accessibilityLabel="Salin total" accessibilityRole="button">
                  <Copy size={18} color={colors.primary} strokeWidth={2} />
                </Pressable>
              </View>
              <View style={styles.codeRow}>
                <Text style={styles.codeLabel}>Kode unik: </Text>
                <Text style={styles.codeValue}>{payment.uniqueCode}</Text>
                <Pressable onPress={() => copyToClipboard(String(payment.uniqueCode), 'Kode unik')} accessibilityLabel="Salin kode unik" accessibilityRole="button">
                  <Copy size={14} color={colors.primary} strokeWidth={2} />
                </Pressable>
              </View>
              <Text style={styles.amountHint}>3 digit terakhir adalah kode unik kamu. Bayar tepat sesuai nominal.</Text>
            </Card>

            <Card style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>Langkah Pembayaran</Text>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                <Text style={styles.stepText}>Pindai kode QRIS di atas menggunakan aplikasi e-wallet atau m-banking</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                <Text style={styles.stepText}>Bayar tepat sesuai nominal termasuk kode unik</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                <Text style={styles.stepText}>Unggah bukti pembayaran setelah bayar berhasil</Text>
              </View>
            </Card>

            <Button
              label="Saya sudah bayar -> Unggah bukti"
              onPress={() => router.push(`/premium/upload-proof?paymentId=${payment.id}`)}
              fullWidth
            />
            <View style={{ height: spacing.sm }} />
            <Button label="Batalkan permintaan" onPress={handleCancel} variant="ghost" fullWidth />
          </>
        )}
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
  loadingText: {
    fontSize: typography.sizes.body,
    color: colors.textMuted,
  },
  countdownCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  countdownLabel: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  countdownValue: {
    fontSize: typography.sizes.display,
    fontFamily: typography.fontFamilyBold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  qrisCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  qrisPlaceholder: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  qrisLabel: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  qrisSubLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
  },
  amountCard: {
    marginBottom: spacing.lg,
  },
  amountLabel: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  amountValue: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  amountUnique: {
    color: colors.accent,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  codeLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  codeValue: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.accent,
  },
  amountHint: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    marginTop: spacing.sm,
  },
  stepsCard: {
    marginBottom: spacing.lg,
  },
  stepsTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
    lineHeight: 20,
  },
  expiredCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  expiredText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.danger,
  },
});
