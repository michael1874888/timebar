// src/layers/4-ui/design-system/tokens/typography.ts

/**
 * 字體 Design Tokens
 *
 * 包含字體大小、粗細和行高
 * 支持從小型提示文字到大型顯示數字的完整範圍
 */

export const TypographyTokens = {
  size: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px - 時間成本顯示用
  },

  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};
