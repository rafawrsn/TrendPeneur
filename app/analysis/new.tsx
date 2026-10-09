import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, ChevronRight, Wallet } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { useToast } from '@/src/components/ui/Toast';
import { useSessionStore } from '@/src/stores/session';
import { getService, ApiError, type Product } from '@/src/api';
import { getCapitalBandLabel } from '@/src/config/constants';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewAnalysisScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const user = useSessionStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(productId ?? null);
  const debouncedSearch = useDebounce(search, 250);

  const { data: results } = useQuery({
    queryKey: ['search-analysis', debouncedSearch],
    queryFn: () => getService().searchProducts(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  const { data: trending } = useQuery({
    queryKey: ['trending-analysis'],
    queryFn: () => getService().getTrendingProducts(undefined, 20),
    enabled: debouncedSearch.length < 2,
  });

  const handleStart = async () => {
    if (!selectedSlug) {
      toast.show('Pilih produk dulu.', 'error');
      return;
    }
    if (!user?.capitalBand) {
      toast.show('Isi modal dulu agar rekomendasi sesuai.', 'error');
      router.push('/profile/capital');
      return;
    }
    try {
      const result = await getService().createAnalysis(selectedSlug);
      router.replace(`/analysis/running/${result.id}`);
    } catch (e) {
      if (e instanceof ApiError) toast.show(e.indonesianMessage, 'error');
      else toast.show('Gagal memulai analisis.', 'error');
    }
  };

  const productList: Product[] = debouncedSearch.length >= 2 ? (results ?? []) : (trending?.map((t) => t.product) ?? []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Analisis Baru</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.capitalCard}>
          <View style={styles.capitalRow}>
            <Wallet size={18} color={colors.primary} strokeWidth={2} />
            <Text style={styles.capitalLabel}>Modal: </Text>
            <Text style={styles.capitalValue}>{getCapitalBandLabel(user?.capitalBand)}</Text>
          </View>
          <Pressable onPress={() => router.push('/profile/capital')}>
            <Text style={styles.editText}>Ubah</Text>
          </Pressable>
        </Card>

        <Input
          label="Cari Produk"
          value={search}
          onChangeText={setSearch}
          placeholder="Cari produk..."
          accessibilityLabel="Cari produk"
        />

        <Text style={styles.listTitle}>
          {debouncedSearch.length >= 2 ? 'Hasil Pencarian' : 'Produk Populer'}
        </Text>

        {productList.map((p) => (
          <Pressable
            key={p.slug}
            style={[styles.productItem, selectedSlug === p.slug && styles.productItemSelected]}
            onPress={() => setSelectedSlug(p.slug)}
            accessibilityLabel={p.name}
            accessibilityRole="radio"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{p.name}</Text>
              <Badge label={p.category} variant="neutral" style={{ marginTop: 4 }} />
            </View>
            <ChevronRight size={18} color={selectedSlug === p.slug ? colors.primary : colors.textSubtle} strokeWidth={2} />
          </Pressable>
        ))}

        <View style={{ height: spacing.lg }} />
        <Button label="Mulai Analisis" onPress={handleStart} fullWidth disabled={!selectedSlug} />
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
  capitalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  capitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  capitalLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  capitalValue: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  editText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
  },
  listTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  productItem: {
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
  productItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  productName: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
});
