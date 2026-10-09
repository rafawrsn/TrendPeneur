import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, X, Clock, Plus } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useUiStore } from '@/src/stores/ui';
import { getService } from '@/src/api';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Sheet } from '@/src/components/ui/Sheet';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { CATEGORIES } from '@/src/mock/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Product } from '@/src/api/types';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [showSuggestSheet, setShowSuggestSheet] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const { recentSearches, addRecentSearch, clearRecentSearches } = useUiStore();

  const { data: suggestions } = useQuery({
    queryKey: ['suggest', debouncedQuery],
    queryFn: () => getService().suggestProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => getService().searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const showRecent = query.length < 2;

  const handleSelectProduct = (slug: string) => {
    if (query.trim()) addRecentSearch(query.trim());
    router.push(`/product/${slug}`);
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestName.trim()) return;
    try {
      await getService().submitProductSuggestion(suggestName.trim());
      toast.show('Terima kasih! Usulan produk kami terima.', 'success');
      setShowSuggestSheet(false);
      setSuggestName('');
    } catch {
      toast.show('Gagal mengirim usulan. Coba lagi.', 'error');
    }
  };

  const catName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

  const renderItem = ({ item }: { item: Product }) => (
    <Pressable
      style={styles.resultItem}
      onPress={() => handleSelectProduct(item.slug)}
      accessibilityLabel={item.name}
      accessibilityRole="button"
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Badge label={catName(item.category)} variant="neutral" style={{ marginTop: 4 }} />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={colors.textSubtle} strokeWidth={2} />
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Cari produk..."
            accessibilityLabel="Kolom pencarian"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Hapus" accessibilityRole="button">
              <X size={18} color={colors.textSubtle} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showRecent ? (
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 ? (
            <>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Pencarian Terakhir</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Hapus</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((s, i) => (
                <Pressable
                  key={i}
                  style={styles.recentItem}
                  onPress={() => setQuery(s)}
                >
                  <Clock size={16} color={colors.textSubtle} strokeWidth={2} />
                  <Text style={styles.recentText}>{s}</Text>
                </Pressable>
              ))}
            </>
          ) : (
            <Text style={styles.hintText}>Ketik minimal 2 huruf untuk mencari produk.</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.slug}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
          ListEmptyComponent={
            !isLoading && debouncedQuery.length >= 2 ? (
              <EmptyState
                title={`Belum ada data untuk '${debouncedQuery}'`}
                message="Coba kata kunci lain atau usulkan produk baru."
                actionLabel="Usulkan produk"
                onAction={() => setShowSuggestSheet(true)}
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {suggestions && suggestions.length > 0 && debouncedQuery.length >= 2 && results && results.length === 0 && !isLoading && (
        <View style={styles.autocompleteContainer}>
          <Text style={styles.autocompleteTitle}>Saran Produk</Text>
          {suggestions.map((s) => (
            <Pressable
              key={s.slug}
              style={styles.autocompleteItem}
              onPress={() => handleSelectProduct(s.slug)}
            >
              <Search size={14} color={colors.textSubtle} strokeWidth={2} />
              <Text style={styles.autocompleteText}>{s.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Sheet visible={showSuggestSheet} onClose={() => setShowSuggestSheet(false)} title="Usulkan Produk">
        <Text style={styles.sheetDesc}>Produk yang kamu usulkan akan kami tinjau untuk ditambahkan ke database.</Text>
        <Input
          label="Nama Produk"
          value={suggestName}
          onChangeText={setSuggestName}
          placeholder="mis. Es krim mochi"
        />
        <Button label="Kirim Usulan" onPress={handleSubmitSuggestion} fullWidth />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  recentContainer: {
    padding: spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  clearText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: colors.primary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
  },
  hintText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  resultItem: {
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
  resultName: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  autocompleteContainer: {
    position: 'absolute',
    top: 70,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    zIndex: 10,
  },
  autocompleteTitle: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  autocompleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  autocompleteText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
  },
  sheetDesc: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
