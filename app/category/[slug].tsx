import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { useQuery } from '@tanstack/react-query';
import { getService } from '@/src/api';
import { ProductCard } from '@/src/components/features/ProductCard';
import { CATEGORIES } from '@/src/mock/categories';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CategoryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trending', slug],
    queryFn: () => getService().getTrendingProducts(slug, 50),
  });

  const catName = CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{catName}</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.product.slug}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => router.push(`/product/${item.product.slug}`)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <EmptyState title="Belum ada produk" message="Tidak ada produk di kategori ini saat ini." />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      )}

      {isError && !isLoading && (
        <View style={styles.loadingOverlay}>
          <ErrorState onRetry={() => refetch()} />
        </View>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: spacing.lg,
    right: spacing.lg,
  },
});
