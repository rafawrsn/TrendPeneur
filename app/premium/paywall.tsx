import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Lock, Sparkles } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScoreGauge } from '@/src/components/charts/ScoreGauge';
import { PLAN } from '@/src/config/plan';
import { formatRupiah } from '@/src/utils/format';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore } from '@/src/stores/session';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSessionStore((s) => s.user);

  const benefits = [
    'Prediksi ketahanan 5-10 tahun',
    'Sesuai dengan modalmu',
    'Risiko & peluang di setiap produk',
    'Riwayat analisis tersimpan',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Premium</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Buka AI Analyst</Text>
        <Text style={styles.subtitle}>
          Dapatkan analisis ketahanan produk 5-10 tahun ke depan, sesuai modalmu.
        </Text>

        {/* Blurred preview */}
        <View style={styles.previewContainer}>
          <Card style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewProduct}>Kopi susu literan</Text>
              <Text style={styles.previewDate}>Analisis contoh</Text>
            </View>
            <ScoreGauge score={78} size={140} label="Tinggi" />
            <Text style={styles.previewSummary}>Produk dengan pertumbuhan konsisten dan ketahanan baik untuk jangka panjang.</Text>
            <View style={styles.blurredSection}>
              <View style={styles.blurBar} />
              <View style={styles.blurBar} />
              <View style={styles.blurBar} />
              <View style={[styles.blurBar, { width: '60%' }]} />
            </View>
            <View style={styles.lockOverlay}>
              <Lock size={28} color={colors.primary} strokeWidth={2} />
              <Text style={styles.lockText}>Premium</Text>
            </View>
          </Card>
        </View>

        <Card style={styles.benefitsCard}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={styles.checkCircle}>
                <Check size={16} color={colors.success} strokeWidth={2} />
              </View>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.priceCard}>
          <Text style={styles.priceLabel}>{PLAN.name}</Text>
          <Text style={styles.priceValue}>{formatRupiah(PLAN.priceIdr)}<Text style={styles.priceDuration}>/bulan</Text></Text>
          <Text style={styles.priceNote}>Pembayaran diverifikasi manual oleh tim kami. Estimasi proses 1x24 jam kerja.</Text>
        </Card>

        <Text style={styles.disclaimer}>
          Prediksi adalah estimasi berbasis data dan AI, bukan jaminan hasil usaha.{' '}
          <Text style={styles.linkText} onPress={() => router.push('/legal/disclaimer')}>Selengkapnya</Text>
        </Text>

        <Button
          label={`Upgrade ke Premium - ${formatRupiah(PLAN.priceIdr)}`}
          onPress={() => router.push('/premium/payment')}
          fullWidth
          icon={<Sparkles size={18} color="#FFFFFF" strokeWidth={2} />}
        />
        <View style={{ height: spacing.sm }} />
        <Pressable onPress={() => router.push('/legal/syarat')}>
          <Text style={styles.termsText}>Syarat & Ketentuan berlaku</Text>
        </Pressable>
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
  title: {
    fontSize: typography.sizes.display,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  previewCard: {
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  previewProduct: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  previewDate: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
  },
  previewSummary: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  blurredSection: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  blurBar: {
    height: 14,
    backgroundColor: colors.border,
    borderRadius: radius.small,
    width: '100%',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: spacing.md,
  },
  lockText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  benefitsCard: {
    marginBottom: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F7EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
  },
  priceCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  priceLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: typography.sizes.display,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  priceDuration: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  priceNote: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  disclaimer: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    fontFamily: typography.fontFamilySemiBold,
  },
  termsText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});
