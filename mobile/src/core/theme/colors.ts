/**
 * Citizen Welfare Navigator Color Tokens
 * Aligned with the Stitch Design System specification.
 */

export const palette = {
  // Brand Primary & Emeralds
  emerald50: '#F0FDF4',
  emerald100: '#DCFCE7',
  emerald200: '#BBF7D0',
  emerald300: '#86EFAC',
  emerald500: '#22C55E',
  emerald600: '#16A34A',
  emerald700: '#15803D',
  emerald800: '#166534',
  emerald900: '#0E6245', // Primary Brand Color
  emerald950: '#004831',

  // Saffron & Warm Accents
  saffron50: '#FFFBEB',
  saffron100: '#FEF3C7',
  saffron500: '#F59E0B', // Marigold Accent
  saffron600: '#D97706',
  saffron800: '#92400E',

  // Chat Bubble Accents
  userBubbleBg: '#E6F4EA',
  userBubbleBorder: '#CBE9D3',

  // Slate Neutrals
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  slate950: '#020617',

  // Status Colors
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Foundation
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const colors = {
  light: {
    primary: palette.emerald900,
    primaryHover: palette.emerald950,
    primaryMuted: palette.emerald50,
    accent: palette.saffron500,
    background: palette.slate50,
    surface: palette.slate100,
    surfaceElevated: palette.white,
    border: palette.slate200,
    borderMuted: palette.slate100,
    text: palette.slate900,
    textMuted: palette.slate500,
    textSubtle: palette.slate400,
    userBubble: palette.userBubbleBg,
    userBubbleBorder: palette.userBubbleBorder,
    status: {
      success: palette.success,
      successBg: palette.successLight,
      warning: palette.warning,
      warningBg: palette.warningLight,
      error: palette.error,
      errorBg: palette.errorLight,
      info: palette.info,
      infoBg: palette.infoLight,
    },
  },
  dark: {
    primary: palette.emerald500,
    primaryHover: palette.emerald600,
    primaryMuted: palette.slate800,
    accent: palette.saffron500,
    background: palette.slate950,
    surface: palette.slate900,
    surfaceElevated: palette.slate800,
    border: palette.slate800,
    borderMuted: palette.slate700,
    text: palette.slate50,
    textMuted: palette.slate400,
    textSubtle: palette.slate500,
    userBubble: '#163828',
    userBubbleBorder: '#23593e',
    status: {
      success: palette.success,
      successBg: '#052e16',
      warning: palette.warning,
      warningBg: '#451a03',
      error: palette.error,
      errorBg: '#450a0a',
      info: palette.info,
      infoBg: '#082f49',
    },
  },
} as const;

export type ThemeColors = typeof colors.light;
