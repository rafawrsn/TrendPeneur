import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, typography, radius, spacing } from '../../theme/tokens';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  neutral: { bg: colors.border, text: colors.textMuted },
  info: { bg: colors.primarySoft, text: colors.primary },
  success: { bg: '#E3F7EC', text: colors.success },
  warning: { bg: '#FDF3E0', text: colors.warning },
  danger: { bg: '#FBE5E5', text: colors.danger },
  accent: { bg: colors.accentSoft, text: colors.accent },
};

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const vc = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: vc.bg }, style]}>
      <Text style={[styles.label, { color: vc.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
  },
});
