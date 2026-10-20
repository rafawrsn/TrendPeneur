import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, ChevronRight, Clock } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getService } from '@/src/api';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useToast } from '@/src/components/ui/Toast';
import { useSessionStore } from '@/src/stores/session';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { formatDateId } from '@/src/utils/format';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnalysisHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  useRequireAuth({ returnTo: '/analysis/history' });
  const queryClient = useQueryClient();
  const user = useSessionStore((s) => s.user);

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => getService().getAnalyses(),
  });

  const isPremiumExpired = user?.isPremium === false && user !== null;

  const handleDelete = (id: string) => {
    Alert.alert('Hapus Analisis', 'Yakin ingin menghapus?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await getService().deleteAnalysis(id);
            toast.show('Analisis dihapus.', 'info');
            queryClient.invalidateQueries({ queryKey: ['analyses'] });
          } catch {
            toast.show('Gagal menghapus.', 'error');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Riwayat Analisis</Text>
      </View>

      {isPremiumExpired && (
        <View style={styles.expiredBanner}>
          <Text style={styles.expiredText}>Premium kamu telah berakhir.</Text>
          <Button label="Perpanjang" onPress={() => router.push('/premium/paywall')} size="sm" />
        </View>
      )}

      <FlatList
        data={analyses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.historyItem}>
            <Pressable
              style={styles.historyLeft}
              onPress={() => router.push(`/analysis/${item.id}`)}
              accessibilityLabel={item.productName}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.analysisDate}>{formatDateId(item.createdAt)}</Text>
                <Text style={styles.capitalText}>Modal: {item.capitalLabel}</Text>
              </View>
              {item.result && (
                <Badge
                  label={String(item.result.resilienceScore)}
                  variant={item.result.resilienceScore >= 60 ? 'success' : item.result.resilienceScore >= 40 ? 'warning' : 'danger'}
                />
              )}
              <ChevronRight size={18} color={colors.textSubtle} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
              accessibilityLabel="Hapus"
              accessibilityRole="button"
            >
              <Trash2 size={16} color={colors.danger} strokeWidth={2} />
            </Pressable>
          </Card>
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Belum ada analisis"
              message="Mulai analisis produk pertamamu dari AI Analyst."
              actionLabel="Mulai Analisis"
              onAction={() => router.push('/analysis/new')}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
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
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  expiredText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
    flex: 1,
  },
  historyItem: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  productName: {
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
  capitalText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
  },
  deleteButton: {
    padding: spacing.sm,
  },
});
