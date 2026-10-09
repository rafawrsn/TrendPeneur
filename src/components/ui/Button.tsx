import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, radius, spacing, shadows } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  icon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: spacing.sm }}>{icon}</View>}
          <Text style={[styles.label, sizeStyles.text, { color: variantStyles.textColor }]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function getVariantStyles(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return { container: { backgroundColor: colors.primary }, textColor: '#FFFFFF' };
    case 'secondary':
      return { container: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }, textColor: colors.primary };
    case 'ghost':
      return { container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }, textColor: colors.text };
    case 'danger':
      return { container: { backgroundColor: colors.danger }, textColor: '#FFFFFF' };
  }
}

function getSizeStyles(size: 'sm' | 'md' | 'lg') {
  switch (size) {
    case 'sm':
      return {
        container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
        text: { fontSize: typography.sizes.caption, fontFamily: typography.fontFamilySemiBold },
      };
    case 'lg':
      return {
        container: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
        text: { fontSize: typography.sizes.h3, fontFamily: typography.fontFamilySemiBold },
      };
    default:
      return {
        container: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
        text: { fontSize: typography.sizes.body, fontFamily: typography.fontFamilySemiBold },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
    minHeight: 44,
  } as ViewStyle,
  fullWidth: {
    width: '100%',
  } as ViewStyle,
  label: {
    textAlign: 'center',
  } as TextStyle,
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
});
