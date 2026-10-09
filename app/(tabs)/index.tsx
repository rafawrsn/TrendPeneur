import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, Sparkles, TrendingUp } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { getService } from '@/src/api';
import { useSessionStore } from '@/src/stores/session';
import { ProductCard } from '@/src/components/features/ProductCard';
import { Chip } from '@/src/components/ui/Chip';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { CATEGORIES, ALL_CATEGORY_SLUG } from '@/src/mock/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSessionStore((s) => s.user);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_SLUG);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trending', selectedCategory],
    queryFn: () => getService().getTrendingProducts(selectedCategory === ALL_CATEGORY_SLUG ? undefined : selectedCategory, 10),
    staleTime: 5 * 60 * 1000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Text style={styles.appName}>TrendPreneur</Text>
          {user ? (
            <Pressable onPress={() => router.push('/notifications')} accessibilityLabel="Notifikasi" accessibilityRole="button">
              <Bell size={22} color={colors.text} strokeWidth={2} />
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/auth/login')} accessibilityLabel="Masuk" accessibilityRole="button">
              <Text style={styles.loginText}>Masuk</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          accessibilityLabel="Cari produk" accessibilityRole="button"
        >
          <Search size={18} color={colors.textSubtle} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Cari produk, mis. kopi susu, thrift...</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesRow}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
      >
        <Chip
          label="Semua"
          selected={selectedCategory === ALL_CATEGORY_SLUG}
          onPress={() => setSelectedCategory(ALL_CATEGORY_SLUG)}
        />
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.slug}
            label={cat.name}
            selected={selectedCategory === cat.slug}
            onPress={() => setSelectedCategory(cat.slug)}
          />
        ))}
      </ScrollView>

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
        ListHeaderComponent={() => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sedang Naik</Text>
            {!user && (
              <Pressable
                style={styles.guestBanner}
                onPress={() => router.push('/auth/login')}
              >
                <Sparkles size={16} color={colors.primary} strokeWidth={2} />
                <Text style={styles.guestBannerText}>Buka AI Analyst untuk prediksi 5-10 tahun</Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada produk di kategori ini.</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
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
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  loginText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
  },
  categoriesRow: {
    flexGrow: 0,
    paddingVertical: spacing.md,
    maxHeight: 52,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  guestBannerText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: colors.primary,
    flexShrink: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 180,
    left: spacing.lg,
    right: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
  },
});
