import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Lock, Clock, ChevronRight, History } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '@/src/theme/tokens';
import { useSessionStore } from '@/src/stores/session';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getService } from '@/src/api';

export default function AnalystTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSessionStore((s) => s.user);

  const { data: quota } = useQuery({
    queryKey: ['ai-quota'],
    queryFn: () => getService().getAiQuota(),
    enabled: !!user?.isPremium,
  });

  const { data: analyses } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => getService().getAnalyses(),
    enabled: !!user?.isPremium,
  });

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.guestContent}>
          <View style={styles.iconCircle}>
            <Sparkles size={48} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.guestTitle}>AI Analyst</Text>
          <Text style={styles.guestDesc}>
            Dapatkan prediksi ketahanan produk 5-10 tahun ke depan, sesuai dengan modalmu. Masuk untuk melanjutkan.
          </Text>
          <View style={styles.guestButtons}>
            <Button label="Masuk" onPress={() => router.push('/auth/login')} fullWidth />
            <View style={{ height: spacing.sm }} />
            <Button label="Daftar" onPress={() => router.push('/auth/register')} variant="secondary" fullWidth />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!user.isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.guestContent}>
          <View style={styles.iconCircle}>
            <Lock size={48} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.guestTitle}>Buka AI Analyst</Text>
          <Text style={styles.guestDesc}>
            AI Analyst memberikan analisis ketahanan produk 5-10 tahun, kesesuaian modal, risiko, dan peluang. Upgrade ke Premium untuk mengakses.
          </Text>
          <View style={styles.guestButtons}>
            <Button label="Upgrade ke Premium" onPress={() => router.push('/premium/paywall')} fullWidth />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.premiumContent}>
        <Text style={styles.pageTitle}>AI Analyst</Text>

        <Card style={styles.quotaCard}>
          <View style={styles.quotaRow}>
            <Clock size={18} color={colors.primary} strokeWidth={2} />
            <Text style={styles.quotaLabel}>Sisa analisis hari ini</Text>
            <Text style={styles.quotaValue}>{quota?.remaining ?? '-'}</Text>
          </View>
        </Card>

        <Pressable
          style={styles.newAnalysisCard}
          onPress={() => router.push('/analysis/new')}
          accessibilityLabel="Mulai analisis baru" accessibilityRole="button"
        >
          <View style={styles.newAnalysisLeft}>
            <Sparkles size={24} color={colors.primary} strokeWidth={2} />
            <View>
              <Text style={styles.newAnalysisTitle}>Analisis Produk Baru</Text>
              <Text style={styles.newAnalysisDesc}>Pilih produk untuk dianalisis</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSubtle} strokeWidth={2} />
        </Pressable>

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Analisis Terakhir</Text>
          <Pressable onPress={() => router.push('/analysis/history')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <History size={16} color={colors.primary} strokeWidth={2} />
              <Text style={styles.seeAllText}>Riwayat</Text>
            </View>
          </Pressable>
        </View>

        {analyses && analyses.length > 0 ? (
          analyses.slice(0, 5).map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/analysis/${a.id}`)}
              style={styles.analysisItem}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.analysisProduct}>{a.productName}</Text>
                <Text style={styles.analysisDate}>Modal: {a.capitalLabel}</Text>
              </View>
              {a.result && (
                <Badge
                  label={String(a.result.resilienceScore)}
                  variant={a.result.resilienceScore >= 60 ? 'success' : a.result.resilienceScore >= 40 ? 'warning' : 'danger'}
                />
              )}
            </Pressable>
          ))
        ) : (
          <Card>
            <Text style={styles.emptyText}>Belum ada analisis. Mulai analisis produk pertamamu!</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  guestContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  guestTitle: {
    fontSize: typography.sizes.display,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  guestDesc: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  guestButtons: { width: '100%', maxWidth: 300 },
  premiumContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  pageTitle: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  quotaCard: {
    marginBottom: spacing.md,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quotaLabel: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    flex: 1,
  },
  quotaValue: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilyBold,
    color: colors.primary,
  },
  newAnalysisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.xl,
    ...shadows.small,
  },
  newAnalysisLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  newAnalysisTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  newAnalysisDesc: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  seeAllText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilyMedium,
    color: colors.primary,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  analysisProduct: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  analysisDate: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
