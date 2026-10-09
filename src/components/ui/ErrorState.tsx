import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing } from '../../theme/tokens';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Terjadi kesalahan. Coba lagi.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <AlertCircle size={48} color={colors.danger} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <View style={styles.retryWrapper}>
          <Button label="Coba lagi" onPress={onRetry} variant="secondary" size="sm" />
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
  message: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryWrapper: {
    marginTop: spacing.lg,
  },
});
