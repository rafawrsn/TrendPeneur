import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/tokens';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ values, width = 80, height = 28, color }: SparklineProps) {
  const validValues = values?.filter((v) => typeof v === 'number' && Number.isFinite(v)) ?? [];
  if (validValues.length < 2) return null;

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max === min ? 1 : max - min;
  const xStep = width / Math.max(1, validValues.length - 1);

  const points = validValues.map((v, i) => ({
    x: i * xStep,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L ${width.toFixed(2)} ${height.toFixed(2)} L 0 ${height.toFixed(2)} Z`;

  const strokeColor = color ?? colors.chartLine;
  const gradId = `spark-${strokeColor.replace('#', '')}-${validValues.length}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#${gradId})`} />
      <Path d={linePath} stroke={strokeColor} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}
