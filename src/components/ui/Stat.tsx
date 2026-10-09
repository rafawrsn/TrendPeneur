import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';

interface StatProps {
  label: string;
  value: string | number;
  color?: string;
}

export function Stat({ label, value, color }: StatProps) {
  return (
    <React.Fragment>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color && { color }]}>{value}</Text>
    </React.Fragment>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.statRow}>{children}</Text>;
}

const styles = StyleSheet.create({
  statRow: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
  },
  value: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
});
