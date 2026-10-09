import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { colors, typography, spacing } from '../../theme/tokens';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon ?? <SearchX size={48} color={colors.textSubtle} />}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionWrapper: {
    marginTop: spacing.lg,
  },
});
