/**
 * TimeBar Design System - Typography Tokens
 * 字體系統定義
 */

export const TypographyTokens = {
  // Font Families
  fontFamily: {
    sans: '"Inter", "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },

  // Font Sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px - 用於時間成本顯示
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text Styles (預組合樣式)
  textStyles: {
    // 標題樣式
    heading: {
      h1: {
        fontSize: '2.25rem',    // 36px
        fontWeight: '700',
        lineHeight: '1.25',
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: '1.875rem',   // 30px
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: '1.5rem',     // 24px
        fontWeight: '600',
        lineHeight: '1.375',
      },
      h4: {
        fontSize: '1.25rem',    // 20px
        fontWeight: '600',
        lineHeight: '1.5',
      },
      h5: {
        fontSize: '1.125rem',   // 18px
        fontWeight: '500',
        lineHeight: '1.5',
      },
      h6: {
        fontSize: '1rem',       // 16px
        fontWeight: '500',
        lineHeight: '1.5',
      },
    },
    // 內文樣式
    body: {
      large: {
        fontSize: '1.125rem',   // 18px
        fontWeight: '400',
        lineHeight: '1.625',
      },
      default: {
        fontSize: '1rem',       // 16px
        fontWeight: '400',
        lineHeight: '1.5',
      },
      small: {
        fontSize: '0.875rem',   // 14px
        fontWeight: '400',
        lineHeight: '1.5',
      },
    },
    // 特殊樣式
    display: {
      // 用於時間成本的超大顯示
      timeCost: {
        fontSize: '3rem',       // 48px
        fontWeight: '800',
        lineHeight: '1',
        letterSpacing: '-0.05em',
      },
      // 用於進度數字
      progress: {
        fontSize: '2.25rem',    // 36px
        fontWeight: '700',
        lineHeight: '1.25',
      },
    },
    // 輔助文字
    caption: {
      fontSize: '0.75rem',      // 12px
      fontWeight: '400',
      lineHeight: '1.5',
    },
    label: {
      fontSize: '0.875rem',     // 14px
      fontWeight: '500',
      lineHeight: '1.5',
      letterSpacing: '0.025em',
    },
  },
} as const;

export type TypographyToken = typeof TypographyTokens;
