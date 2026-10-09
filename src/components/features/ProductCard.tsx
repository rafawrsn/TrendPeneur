import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { colors, typography, radius, spacing, shadows } from '../../theme/tokens';
import { Sparkline } from '../charts/Sparkline';
import { Badge } from '../ui/Badge';
import { formatDateId } from '../../utils/format';
import type { TrendingProduct } from '../../api/types';
import { CATEGORIES } from '../../mock/categories';

interface ProductCardProps {
  item: TrendingProduct;
  onPress: () => void;
}

export function ProductCard({ item, onPress }: ProductCardProps) {
  const catName = CATEGORIES.find((c) => c.slug === item.product.category)?.name ?? item.product.category;
  const dirConfig = {
    naik: { icon: TrendingUp, color: colors.success, label: 'Naik' },
    turun: { icon: TrendingDown, color: colors.danger, label: 'Turun' },
    stabil: { icon: Minus, color: colors.textMuted, label: 'Stabil' },
  };
  const dir = dirConfig[item.direction];
  const DirIcon = dir.icon;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      <View style={styles.leftContent}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
          <View style={styles.dirBadge}>
            <DirIcon size={14} color={dir.color} />
            <Text style={[styles.dirText, { color: dir.color }]}>{dir.label}</Text>
          </View>
        </View>
        <Badge label={catName} variant="neutral" style={styles.categoryBadge} />
        <Text style={styles.updated}>Diperbarui: {formatDateId(item.dataUpdatedAt)}</Text>
      </View>
      <View style={styles.rightContent}>
        <Sparkline values={item.sparkline} width={70} height={32} color={dir.color} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  leftContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dirText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
  },
  categoryBadge: {
    marginTop: spacing.xs,
  },
  updated: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    marginTop: spacing.sm,
  },
});
