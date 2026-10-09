import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, radius: r = radius.small, style }: SkeletonProps) {
  return (
    <View
      style={[{ width, height, backgroundColor: colors.border, borderRadius: r, overflow: 'hidden' }, style]}
    >
      <AnimatedShimmer />
    </View>
  );
}

function AnimatedShimmer() {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} />;
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={16} />
      <View style={{ height: spacing.sm }} />
      <Skeleton width="40%" height={12} />
      <View style={{ height: spacing.md }} />
      <Skeleton width="100%" height={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
});
