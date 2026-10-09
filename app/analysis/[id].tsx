import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Share as RNShare } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Share2, Star, TrendingUp, TrendingDown, Minus, Check, AlertTriangle, Lightbulb, DollarSign } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { getService } from '@/src/api';
import { ScoreGauge } from '@/src/components/charts/ScoreGauge';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { formatDateId, formatRupiah } from '@/src/utils/format';
import { getCapitalBandLabel } from '@/src/config/constants';
import { useToast } from '@/src/components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const labelMap: Record<string, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  sangat_tinggi: 'Sangat Tinggi',
};

const confidenceMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  tinggi: { label: 'Kepercayaan Tinggi', variant: 'success' },
  sedang: { label: 'Kepercayaan Sedang', variant: 'warning' },
  rendah: { label: 'Kepercayaan Rendah', variant: 'danger' },
};

const directionIcon = { naik: TrendingUp, stabil: Minus, turun: TrendingDown };
const directionColor = { naik: colors.success, stabil: colors.textMuted, turun: colors.danger };
const directionLabel = { naik: 'Naik', stabil: 'Stabil', turun: 'Turun' };

export default function AnalysisResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: analysis, isLoading, isError, refetch } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => getService().getAnalysis(id),
  });

  const [rating, setRating] = useState(analysis?.rating ?? 0);
  const [comment, setComment] = useState(analysis?.ratingComment ?? '');
  const [savingRating, setSavingRating] = useState(false);

  const handleShare = async () => {
    if (!analysis?.result) return;
    try {
      await RNShare.share({
        message: `TrendPreneur - ${analysis.productName}: Skor ketahanan ${analysis.result.resilienceScore} (${labelMap[analysis.result.resilienceLabel]}). ${analysis.result.oneLineSummary}`,
      });
    } catch {
      // ignore
    }
  };

  const handleSaveRating = async () => {
    if (rating === 0) {
      toast.show('Pilih rating bintang dulu.', 'error');
      return;
    }
    setSavingRating(true);
    try {
      await getService().rateAnalysis(id, { rating, comment: comment.trim() || undefined });
      toast.show('Rating tersimpan.', 'success');
      queryClient.invalidateQueries({ queryKey: ['analysis', id] });
    } catch {
      toast.show('Gagal menyimpan rating.', 'error');
    } finally {
      setSavingRating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Hapus Analisis', 'Yakin ingin menghapus analisis ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await getService().deleteAnalysis(id);
            toast.show('Analisis dihapus.', 'info');
            router.replace('/analysis/history');
          } catch {
            toast.show('Gagal menghapus.', 'error');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft size={22} color={colors.text} strokeWidth={2} /></Pressable>
        </View>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="100%" height={160} />
          <Skeleton width="100%" height={120} />
        </View>
      </View>
    );
  }

  if (isError || !analysis) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft size={22} color={colors.text} strokeWidth={2} /></Pressable>
        </View>
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  if (analysis.status !== 'COMPLETED' || !analysis.result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft size={22} color={colors.text} strokeWidth={2} /></Pressable>
        </View>
        <ErrorState message="Analisis ini belum selesai atau gagal." />
      </View>
    );
  }

  const r = analysis.result;
  const conf = confidenceMap[r.confidence] ?? confidenceMap.sedang;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Pressable onPress={handleShare} accessibilityLabel="Bagikan" accessibilityRole="button">
          <Share2 size={20} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.resultHeader}>
          <Text style={styles.productName}>{analysis.productName}</Text>
          <Text style={styles.analysisDate}>Dianalisis: {formatDateId(analysis.createdAt)}</Text>
          <Text style={styles.capitalUsed}>Modal: {analysis.capitalLabel}</Text>
        </View>

        {analysis.servedFromCache && (
          <Badge label="Dari cache" variant="accent" style={{ marginBottom: spacing.md }} />
        )}

        {/* Score Gauge */}
        <Card style={styles.scoreCard}>
          <ScoreGauge score={r.resilienceScore} size={180} label={labelMap[r.resilienceLabel]} />
          <Badge label={conf.label} variant={conf.variant} style={{ marginTop: spacing.sm }} />
          <Text style={styles.scoreNote}>Skor ini adalah estimasi.</Text>
        </Card>

        {/* One-line summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryText}>{r.oneLineSummary}</Text>
        </Card>

        {/* Outlook timeline */}
        <Text style={styles.sectionTitle}>Proyeksi 5-10 Tahun</Text>
        <View style={styles.outlookContainer}>
          {r.outlook.map((o) => {
            const DirIcon = directionIcon[o.direction];
            return (
              <Card key={o.horizonYears} style={styles.outlookCard}>
                <View style={styles.outlookHeader}>
                  <Text style={styles.outlookHorizon}>{o.horizonYears} tahun</Text>
                  <View style={styles.outlookDirRow}>
                    <DirIcon size={16} color={directionColor[o.direction]} strokeWidth={2} />
                    <Text style={[styles.outlookDir, { color: directionColor[o.direction] }]}>{directionLabel[o.direction]}</Text>
                  </View>
                </View>
                <Text style={styles.outlookRationale}>{o.rationale}</Text>
              </Card>
            );
          })}
        </View>

        {/* Drivers & Risks */}
        <View style={styles.driversRisksRow}>
          <Card style={styles.driversCard}>
            <View style={styles.drHeader}>
              <TrendingUp size={18} color={colors.success} strokeWidth={2} />
              <Text style={[styles.drTitle, { color: colors.success }]}>Pendorong</Text>
            </View>
            {r.drivers.map((d, i) => (
              <View key={i} style={styles.drItem}>
                <View style={styles.drBulletSuccess}><Check size={12} color={colors.success} strokeWidth={2} /></View>
                <Text style={styles.drText}>{d}</Text>
              </View>
            ))}
          </Card>
          <Card style={styles.risksCard}>
            <View style={styles.drHeader}>
              <AlertTriangle size={18} color={colors.danger} strokeWidth={2} />
              <Text style={[styles.drTitle, { color: colors.danger }]}>Risiko</Text>
            </View>
            {r.risks.map((risk, i) => (
              <View key={i} style={styles.drItem}>
                <View style={styles.drBulletDanger}><AlertTriangle size={12} color={colors.danger} strokeWidth={2} /></View>
                <Text style={styles.drText}>{risk}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Capital fit */}
        <Text style={styles.sectionTitle}>Kesesuaian Modal</Text>
        <Card>
          <View style={styles.capFitHeader}>
            <DollarSign size={18} color={colors.primary} strokeWidth={2} />
            <Badge
              label={r.capitalFit.level === 'sesuai' ? 'Sesuai' : r.capitalFit.level === 'perlu_penyesuaian' ? 'Perlu Penyesuaian' : 'Kurang Sesuai'}
              variant={r.capitalFit.level === 'sesuai' ? 'success' : r.capitalFit.level === 'perlu_penyesuaian' ? 'warning' : 'danger'}
            />
          </View>
          <Text style={styles.capFitRange}>
            Estimasi modal awal: {formatRupiah(r.capitalFit.estimatedStartCapitalIdr.min)} - {formatRupiah(r.capitalFit.estimatedStartCapitalIdr.max)}
          </Text>
          <Text style={styles.capFitAssumptionsTitle}>Asumsi:</Text>
          {r.capitalFit.assumptions.map((a, i) => (
            <Text key={i} style={styles.assumptionItem}>- {a}</Text>
          ))}
        </Card>

        {/* Starter steps */}
        <Text style={styles.sectionTitle}>Langkah Awal</Text>
        <Card>
          {r.starterSteps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Card>

        {/* Sources */}
        <Text style={styles.sectionTitle}>Sumber Data</Text>
        <View style={styles.sourcesChips}>
          <Badge label="Google Trends" variant="neutral" />
          <Badge label="Marketplace" variant="neutral" />
          <Badge label="Media Sosial" variant="neutral" />
          <Badge label="Berita & Laporan" variant="neutral" />
        </View>

        {r.dataLimitations.length > 0 && (
          <Card style={styles.limitationsCard}>
            <Text style={styles.limitationsTitle}>Keterbatasan Data</Text>
            {r.dataLimitations.map((l, i) => (
              <Text key={i} style={styles.limitationItem}>- {l}</Text>
            ))}
          </Card>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <AlertTriangle size={16} color={colors.warning} strokeWidth={2} />
          <Text style={styles.disclaimerText}>
            Analisis ini adalah estimasi berbasis data dan AI, bukan jaminan hasil usaha. Gunakan sebagai salah satu bahan pertimbangan.
          </Text>
        </View>

        {/* Rating */}
        <Text style={styles.sectionTitle}>Beri Rating</Text>
        <Card>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} onPress={() => setRating(s)} accessibilityLabel={`${s} bintang`} accessibilityRole="button">
                <Star size={28} color={s <= rating ? colors.warning : colors.border} strokeWidth={2} fill={s <= rating ? colors.warning : 'transparent'} />
              </Pressable>
            ))}
          </View>
          <Input
            label="Komentar (opsional)"
            value={comment}
            onChangeText={setComment}
            placeholder="Bagikan pengalamanmu..."
            multiline
            maxLength={500}
            accessibilityLabel="Komentar rating"
          />
          <Button label="Simpan Rating" onPress={handleSaveRating} loading={savingRating} fullWidth size="sm" />
        </Card>

        <View style={{ height: spacing.md }} />
        <Button label="Hapus Analisis" onPress={handleDelete} variant="ghost" fullWidth />
      </ScrollView>
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  resultHeader: { marginBottom: spacing.lg },
  productName: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  analysisDate: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  capitalUsed: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  scoreCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreNote: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    marginTop: spacing.xs,
  },
  summaryCard: {
    marginBottom: spacing.lg,
  },
  summaryText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily,
    color: colors.text,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  outlookContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  outlookCard: {},
  outlookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  outlookHorizon: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  outlookDirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  outlookDir: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
  },
  outlookRationale: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    lineHeight: 18,
  },
  driversRisksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  driversCard: { flex: 1 },
  risksCard: { flex: 1 },
  drHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  drTitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
  },
  drItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  drBulletSuccess: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E3F7EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  drBulletDanger: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FBE5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  drText: {
    flex: 1,
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.text,
    lineHeight: 18,
  },
  capFitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  capFitRange: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  capFitAssumptionsTitle: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  assumptionItem: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    lineHeight: 18,
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
  sourcesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  limitationsCard: {
    backgroundColor: '#FDF3E0',
    borderColor: colors.warning,
    marginBottom: spacing.lg,
  },
  limitationsTitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  limitationItem: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.text,
    lineHeight: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    lineHeight: 18,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
});
