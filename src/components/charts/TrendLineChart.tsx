import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Line, Text as SvgText, Circle } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme/tokens';
import type { TrendPoint } from '../../api/types';
import { formatPeriod } from '../../utils/format';

interface TrendLineChartProps {
  points: TrendPoint[];
  height?: number;
}

const PADDING = { top: 20, right: 16, bottom: 32, left: 36 };

export function TrendLineChart({ points, height = 240 }: TrendLineChartProps) {
  const [touchX, setTouchX] = useState<number | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32; // account for horizontal margin
  const chartHeight = height;
  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = chartHeight - PADDING.top - PADDING.bottom;

  if (points.length === 0) {
    return <View style={[styles.container, { height }]}><Text style={styles.empty}>Tidak ada data</Text></View>;
  }

  const values = points.map((p) => p.value);
  const minVal = 0;
  const maxVal = 100;
  const xStep = innerWidth / Math.max(1, points.length - 1);

  const xFor = (i: number) => PADDING.left + i * xStep;
  const yFor = (v: number) => PADDING.top + innerHeight - ((v - minVal) / (maxVal - minVal)) * innerHeight;

  // Build line path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(p.value).toFixed(2)}`)
    .join(' ');

  // Build area path
  const areaPath = `${linePath} L ${xFor(points.length - 1).toFixed(2)} ${(PADDING.top + innerHeight).toFixed(2)} L ${xFor(0).toFixed(2)} ${(PADDING.top + innerHeight).toFixed(2)} Z`;

  // Y-axis grid lines
  const yGridValues = [0, 25, 50, 75, 100];

  // X-axis labels (show ~5-6 labels evenly)
  const labelStep = Math.max(1, Math.floor(points.length / 6));
  const xLabels = points.filter((_, i) => i % labelStep === 0 || i === points.length - 1);

  // Find touched point
  let touchedPoint: { point: TrendPoint; index: number; x: number; y: number } | null = null;
  if (touchX !== null) {
    const relX = touchX - PADDING.left;
    const idx = Math.round(relX / xStep);
    const clampedIdx = Math.max(0, Math.min(points.length - 1, idx));
    const p = points[clampedIdx];
    touchedPoint = { point: p, index: clampedIdx, x: xFor(clampedIdx), y: yFor(p.value) };
  }

  // Accessibility summary
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const peak = points.reduce((max, p) => (p.value > max.value ? p : max), points[0]);
  const low = points.reduce((min, p) => (p.value < min.value ? p : min), points[0]);
  const accSummary = `Grafik tren ${points.length} bulan. Rata-rata ${avg.toFixed(0)}, puncak ${peak.value} pada ${formatPeriod(peak.period)}, terendah ${low.value} pada ${formatPeriod(low.period)}.`;

  return (
    <View style={styles.container}>
      <Svg
        width={chartWidth}
        height={chartHeight}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => setTouchX(e.nativeEvent.locationX)}
        onResponderMove={(e) => setTouchX(e.nativeEvent.locationX)}
        onResponderRelease={() => setTouchX(null)}
        accessibilityLabel={accSummary}
        accessibilityRole="image"
      >
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.chartAreaStart} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={colors.chartAreaStart} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Y-axis grid */}
        {yGridValues.map((v) => (
          <React.Fragment key={v}>
            <Line
              x1={PADDING.left}
              y1={yFor(v)}
              x2={PADDING.left + innerWidth}
              y2={yFor(v)}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray={v === 0 ? '0' : '4,4'}
            />
            <SvgText
              x={PADDING.left - 8}
              y={yFor(v) + 4}
              fontSize={10}
              fill={colors.textSubtle}
              fontFamily={typography.fontFamily}
              textAnchor="end"
            >
              {v}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Area */}
        <Path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <Path d={linePath} stroke={colors.chartLine} strokeWidth={2} fill="none" />

        {/* X-axis labels */}
        {xLabels.map((p, i) => {
          const realIdx = points.indexOf(p);
          return (
            <SvgText
              key={i}
              x={xFor(realIdx)}
              y={chartHeight - 10}
              fontSize={10}
              fill={colors.textSubtle}
              fontFamily={typography.fontFamily}
              textAnchor="middle"
            >
              {formatPeriod(p.period)}
            </SvgText>
          );
        })}

        {/* Touch indicator */}
        {touchedPoint && (
          <React.Fragment>
            <Line
              x1={touchedPoint.x}
              y1={PADDING.top}
              x2={touchedPoint.x}
              y2={PADDING.top + innerHeight}
              stroke={colors.primary}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <Circle
              cx={touchedPoint.x}
              cy={touchedPoint.y}
              r={5}
              fill={colors.surface}
              stroke={colors.primary}
              strokeWidth={2}
            />
          </React.Fragment>
        )}
      </Svg>

      {touchedPoint && (
        <View
          style={[
            styles.tooltip,
            {
              left: Math.min(Math.max(touchedPoint.x - 50, 4), chartWidth - 104),
              top: Math.max(touchedPoint.y - 50, 4),
            },
          ]}
        >
          <Text style={styles.tooltipPeriod}>{formatPeriod(touchedPoint.point.period)}</Text>
          <Text style={styles.tooltipValue}>Nilai: {touchedPoint.point.value}</Text>
        </View>
      )}

      <Text style={styles.accSummary}>{accSummary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  empty: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    zIndex: 10,
  },
  tooltipPeriod: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: '#FFFFFF',
  },
  tooltipValue: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  accSummary: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});
