import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

interface ProgressStepsProps {
  steps: string[];
  currentIndex: number;
}

export function ProgressSteps({ steps, currentIndex }: ProgressStepsProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              styles.circle,
              i <= currentIndex && styles.circleActive,
              i < currentIndex && styles.circleDone,
            ]}
          >
            {i < currentIndex && <View style={styles.checkmark} />}
          </View>
          {i < steps.length - 1 && (
            <View style={styles.lineContainer}>
              <View style={[styles.line, i < currentIndex && styles.lineActive]} />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  circleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    width: 8,
    height: 4,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginBottom: 2,
  },
  lineContainer: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    borderRadius: 1,
    overflow: 'hidden',
  },
  line: {
    height: '100%',
    width: '0%',
  },
  lineActive: {
    width: '100%',
    backgroundColor: colors.primary,
  },
});
