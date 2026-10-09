import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme/tokens';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export function ScoreGauge({ score, size = 160, label }: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Semi-circle from 180° to 360° (left to right, top half)
  const startAngle = 180;
  const endAngle = 360;
  const angleRange = endAngle - startAngle;
  const scoreAngle = startAngle + (clampedScore / 100) * angleRange;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const scoreEnd = polarToCartesian(scoreAngle);

  // Background arc (semi-circle)
  const bgPath = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;

  // Score arc
  const scorePath = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${scoreEnd.x.toFixed(2)} ${scoreEnd.y.toFixed(2)}`;

  // Determine color based on score
  let scoreColor: string = colors.danger;
  if (clampedScore >= 80) scoreColor = colors.success;
  else if (clampedScore >= 60) scoreColor = colors.primary;
  else if (clampedScore >= 40) scoreColor = colors.warning;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size / 2 + 20}>
        <Defs>
          <LinearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={scoreColor} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={scoreColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Background */}
        <Path d={bgPath} stroke={colors.border} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        {/* Score */}
        <Path d={scorePath} stroke="url(#scoreGrad)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        {/* Score text */}
        <SvgText
          x={cx}
          y={cy - 10}
          fontSize={32}
          fontWeight="700"
          fill={colors.text}
          textAnchor="middle"
          fontFamily={typography.fontFamilyBold}
        >
          {clampedScore}
        </SvgText>
      </Svg>
      {label && <Text style={[styles.label, { color: scoreColor }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    marginTop: spacing.xs,
  },
});
