export const colors = {
  primary: '#0B63CE',
  primaryDark: '#084C9E',
  primarySoft: '#E6F0FD',
  accent: '#0FB5A6',
  accentSoft: '#E3F8F5',
  bg: '#F6F8FB',
  surface: '#FFFFFF',
  border: '#E3E8EF',
  text: '#0F1B2D',
  textMuted: '#5B6B80',
  textSubtle: '#8A97A8',
  success: '#12A150',
  warning: '#E8A317',
  danger: '#D93F3F',
  info: '#0B63CE',
  chartLine: '#0B63CE',
  chartSecondary: '#0FB5A6',
  chartAreaStart: '#0B63CE',
  chartAreaEnd: 'rgba(11, 99, 206, 0)',
} as const;

export const typography = {
  fontFamily: 'PlusJakartaSans',
  fontFamilyMedium: 'PlusJakartaSans-Medium',
  fontFamilySemiBold: 'PlusJakartaSans-SemiBold',
  fontFamilyBold: 'PlusJakartaSans-Bold',
  sizes: {
    display: 28,
    h1: 22,
    h2: 18,
    h3: 16,
    body: 15,
    bodySmall: 14,
    caption: 12,
  },
  lineHeights: {
    heading: 1.2,
    body: 1.5,
  },
} as const;

export const radius = {
  card: 12,
  pill: 999,
  input: 10,
  small: 8,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const shadows = {
  small: {
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export type ColorKey = keyof typeof colors;
