/**
 * TimeBar Design System - Color Tokens
 * 語義化顏色系統，所有 UI 組件應透過這些 tokens 使用顏色
 */

export const ColorTokens = {
  // Semantic Colors (語義化顏色)
  semantic: {
    primary: {
      DEFAULT: '#10b981', // emerald-500
      hover: '#059669',   // emerald-600
      active: '#047857',  // emerald-700
      light: '#34d399',   // emerald-400
      lighter: '#a7f3d0', // emerald-200
    },
    secondary: {
      DEFAULT: '#3b82f6', // blue-500
      hover: '#2563eb',   // blue-600
      active: '#1d4ed8',  // blue-700
      light: '#60a5fa',   // blue-400
      lighter: '#bfdbfe', // blue-200
    },
    success: {
      DEFAULT: '#10b981', // emerald-500
      light: '#d1fae5',   // emerald-100
      dark: '#065f46',    // emerald-800
    },
    warning: {
      DEFAULT: '#f59e0b', // amber-500
      light: '#fef3c7',   // amber-100
      dark: '#92400e',    // amber-800
    },
    error: {
      DEFAULT: '#ef4444', // red-500
      light: '#fee2e2',   // red-100
      dark: '#991b1b',    // red-800
    },
  },

  // Neutral Colors (中性色)
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },

  // State Colors (GPS 狀態顏色)
  state: {
    ahead: {
      bar: '#10b981',     // emerald-500
      dot: '#34d399',     // emerald-400
      badge: '#10b981',
      background: '#d1fae5', // emerald-100
      icon: '🚀',
    },
    onTrack: {
      bar: '#3b82f6',     // blue-500
      dot: '#60a5fa',     // blue-400
      badge: '#3b82f6',
      background: '#dbeafe', // blue-100
      icon: '✅',
    },
    behind: {
      bar: '#f97316',     // orange-500
      dot: '#fb923c',     // orange-400
      badge: '#f97316',
      background: '#ffedd5', // orange-100
      icon: '⏰',
    },
  },

  // Component Colors (組件專用)
  components: {
    button: {
      primary: {
        background: 'semantic.primary.DEFAULT',
        backgroundHover: 'semantic.primary.hover',
        text: '#ffffff',
      },
      secondary: {
        background: 'neutral.200',
        backgroundHover: 'neutral.300',
        text: 'neutral.800',
      },
      ghost: {
        background: 'transparent',
        backgroundHover: 'neutral.100',
        text: 'neutral.700',
      },
      danger: {
        background: 'semantic.error.DEFAULT',
        backgroundHover: 'semantic.error.dark',
        text: '#ffffff',
      },
    },
    input: {
      background: '#ffffff',
      border: 'neutral.300',
      borderFocus: 'semantic.primary.DEFAULT',
      placeholder: 'neutral.400',
      text: 'neutral.900',
    },
    card: {
      background: '#ffffff',
      border: 'neutral.200',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    modal: {
      background: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    badge: {
      success: 'semantic.success.DEFAULT',
      warning: 'semantic.warning.DEFAULT',
      error: 'semantic.error.DEFAULT',
    },
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f4f4f5',
    dark: '#18181b',
  },

  // Text Colors
  text: {
    primary: '#18181b',    // neutral-900
    secondary: '#52525b',  // neutral-600
    tertiary: '#a1a1aa',   // neutral-400
    inverse: '#ffffff',
    link: '#3b82f6',       // blue-500
    success: '#059669',    // emerald-600
    warning: '#d97706',    // amber-600
    error: '#dc2626',      // red-600
  },
} as const;

export type ColorToken = typeof ColorTokens;
export type SemanticColor = keyof typeof ColorTokens.semantic;
export type NeutralColor = keyof typeof ColorTokens.neutral;
export type StateColor = keyof typeof ColorTokens.state;
