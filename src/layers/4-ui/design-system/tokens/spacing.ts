/**
 * TimeBar Design System - Spacing Tokens
 * 間距系統定義
 */

export const SpacingTokens = {
  // Base Scale (4px 為基礎單位)
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
  },

  // Gap (間隙)
  gap: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
  },

  // Padding (內距)
  padding: {
    button: {
      sm: '0.5rem 1rem',      // 8px 16px
      md: '0.75rem 1.25rem',  // 12px 20px
      lg: '1rem 1.5rem',      // 16px 24px
    },
    input: {
      sm: '0.5rem 0.75rem',   // 8px 12px
      md: '0.75rem 1rem',     // 12px 16px
      lg: '1rem 1.25rem',     // 16px 20px
    },
    card: {
      sm: '1rem',             // 16px
      md: '1.5rem',           // 24px
      lg: '2rem',             // 32px
    },
    modal: '1.5rem',          // 24px
    section: '1.5rem',        // 24px
    page: '1rem',             // 16px (mobile)
    pageDesktop: '2rem',      // 32px
  },

  // Margin (外距)
  margin: {
    section: '2rem',          // 32px between sections
    element: '1rem',          // 16px between elements
    inline: '0.5rem',         // 8px for inline elements
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Container Sizes
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    // 專案專用
    app: '600px',     // App 最大寬度 (平板/桌面)
    modal: '400px',   // Modal 寬度
  },

  // Height Values
  height: {
    header: '3.5rem',         // 56px
    bottomNav: '4rem',        // 64px
    input: {
      sm: '2rem',             // 32px
      md: '2.5rem',           // 40px
      lg: '3rem',             // 48px
    },
    button: {
      sm: '2rem',             // 32px
      md: '2.5rem',           // 40px
      lg: '3rem',             // 48px
    },
    progressBar: '0.5rem',    // 8px
    quickActionButton: '4rem', // 64px
  },
} as const;

export type SpacingToken = typeof SpacingTokens;
