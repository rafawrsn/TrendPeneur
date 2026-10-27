import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Lock, TrendingUp, TrendingDown, Minus, Info, Share } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { getService } from '@/src/api';
import { TREND_RANGES, TREND_RANGE_LABELS, type TrendRange } from '@/src/config/plan';
import { TrendLineChart } from '@/src/components/charts/TrendLineChart';
import { Chip } from '@/src/components/ui/Chip';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Sheet } from '@/src/components/ui/Sheet';
import { useSessionStore } from '@/src/stores/session';
import { CATEGORIES } from '@/src/mock/categories';
import { formatPeriod, formatDateId } from '@/src/utils/format';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share as RNShare } from 'react-native';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const user = useSessionStore((s) => s.user);
  const [range, setRange] = useState<TrendRange>('3y');
  const [showHelpSheet, setShowHelpSheet] = useState(false);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getService().getProduct(slug),
  });

  const { data: trend, isLoading: trendLoading, isError, refetch } = useQuery({
    queryKey: ['trend', slug, range],
    queryFn: () => getService().getTrend(slug, range),
  });

  const handleAiCta = () => {
    if (!user) {
      router.push(`/auth/login?returnTo=/product/${slug}`);
    } else if (!user.isPremium) {
      router.push('/premium/paywall');
    } else {
      router.push(`/analysis/new?productId=${slug}`);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await RNShare.share({
        message: `TrendPreneur - ${product.name}: ${trend?.summary.direction === 'naik' ? 'Tren naik' : trend?.summary.direction === 'turun' ? 'Tren turun' : 'Tren stabil'} (skor ${trend?.summary.peak.value} di puncak). Lihat di TrendPreneur.`,
      });
    } catch {
      // ignore
    }
  };

  const catName = product ? CATEGORIES.find((c) => c.slug === product.category)?.name : '';
  const dirConfig = {
    naik: { icon: TrendingUp, color: colors.success, label: 'Naik' },
    turun: { icon: TrendingDown, color: colors.danger, label: 'Turun' },
    stabil: { icon: Minus, color: colors.textMuted, label: 'Stabil' },
  };

  if (productLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Kembali">
            <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton width="70%" height={24} />
          <Skeleton width="100%" height={240} />
        </View>
      </View>
    );
  }

  if (!product) return null;

  const summary = trend?.summary;
  const dir = summary ? dirConfig[summary.direction] : null;
  const DirIcon = dir?.icon;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Pressable onPress={handleShare} accessibilityLabel="Bagikan" accessibilityRole="button">
          <Share size={20} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.titleSection}>
          <Text style={styles.productName}>{product.name}</Text>
          <Badge label={catName ?? product.category} variant="info" style={{ marginTop: spacing.xs }} />
          {product.partial && (
            <View style={styles.partialNotice}>
              <Info size={14} color={colors.warning} strokeWidth={2} />
              <Text style={styles.partialText}>Sebagian data tidak tersedia</Text>
            </View>
          )}
        </View>

        <View style={styles.rangeRow}>
          {TREND_RANGES.map((r) => (
            <Chip
              key={r}
              label={TREND_RANGE_LABELS[r]}
              selected={range === r}
              onPress={() => setRange(r)}
            />
          ))}
        </View>

        <Pressable style={styles.helpLink} onPress={() => setShowHelpSheet(true)}>
          <Info size={14} color={colors.primary} strokeWidth={2} />
          <Text style={styles.helpText}>Cara membaca grafik</Text>
        </Pressable>
        

        <View style={styles.chartContainer}>
          {trendLoading ? (
            <Skeleton width="100%" height={240} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : trend ? (
            <TrendLineChart points={trend.points} height={240} />
          ) : null}
        </View>

        {summary && dir && DirIcon && (
          <Card style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Ringkasan Tren</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Arah Tren</Text>
              <View style={styles.dirBadge}>
                <DirIcon size={16} color={dir.color} strokeWidth={2} />
                <Text style={[styles.dirText, { color: dir.color }]}>{dir.label}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Puncak</Text>
              <Text style={styles.summaryValue}>{summary.peak.value} ({formatPeriod(summary.peak.period)})</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Terendah</Text>
              <Text style={styles.summaryValue}>{summary.low.value} ({formatPeriod(summary.low.period)})</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Musiman</Text>
              <Text style={styles.summaryValue}>{summary.seasonal ? 'Ya' : 'Tidak'}</Text>
            </View>
          </Card>
        )}

        {trend && (
          <View style={styles.sourcesContainer}>
            <Text style={styles.sourcesTitle}>Sumber Data</Text>
            <View style={styles.sourcesChips}>
              {trend.sources.map((s) => (
                <Badge key={s.code} label={s.name} variant="neutral" />
              ))}
            </View>
            <Text style={styles.updatedText}>Diperbarui: {formatDateId(trend.dataUpdatedAt)}</Text>
          </View>
        )}

        <Card style={styles.aiCtaCard}>
          <View style={styles.aiCtaLeft}>
            <Lock size={24} color={colors.primary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiCtaTitle}>AI Analyst — Tahan 5-10 tahun?</Text>
              <Text style={styles.aiCtaDesc}>
                {user?.isPremium ? 'Analisis ketahanan produk ini' : 'Buka Premium untuk analisis ketahanan jangka panjang'}
              </Text>
            </View>
          </View>
          <Button
            label={user?.isPremium ? 'Analisis' : 'Buka'}
            onPress={handleAiCta}
            size="sm"
          />
        </Card>
      </ScrollView>

      <Sheet visible={showHelpSheet} onClose={() => setShowHelpSheet(false)} title="Cara Membaca Grafik">
        <View style={{ gap: spacing.md }}>
          <Text style={styles.helpBody}>
            Grafik menunjukkan tingkat tren produk pada skala 0-100, yang dinormalisasi dari berbagai sumber data (Google Trends, marketplace, media sosial, berita).
          </Text>
          <Text style={styles.helpBody}>
            Nilai 100 berarti tren pada puncaknya, dan 0 berarti sangat rendah. Garis menghubungkan titik data bulanan.
          </Text>
          <Text style={styles.helpBody}>
            Sentuh grafik untuk melihat nilai pada bulan tertentu. Gunakan pilihan rentang (1 th, 3 th, 5 th, Maks) untuk melihat periode berbeda.
          </Text>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleSection: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  productName: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  partialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: '#FDF3E0',
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  partialText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.warning,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexWrap: 'wrap',
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: colors.primary,
  },
  chartContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dirText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
  },
  sourcesContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sourcesTitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sourcesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  updatedText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    marginTop: spacing.sm,
  },
  aiCtaCard: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderColor: colors.primary,
  },
  aiCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  aiCtaTitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  aiCtaDesc: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: 2,
  },
  helpBody: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
