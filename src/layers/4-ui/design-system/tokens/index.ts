// src/layers/4-ui/design-system/tokens/index.ts

/**
 * Design Tokens 統一導出
 *
 * 提供兩種使用方式：
 * 1. 直接引用 tokens: import { ColorTokens } from '@tokens'
 * 2. 使用 resolver: import { resolveToken } from '@tokens'
 */

export { ColorTokens } from './colors';
export { SpacingTokens } from './spacing';
export { TypographyTokens } from './typography';
export { resolveToken, resolveTokens } from './resolver';

import { ColorTokens } from './colors';
import { SpacingTokens } from './spacing';
import { TypographyTokens } from './typography';

/**
 * 便捷的組合導出
 *
 * @example
 * import { Tokens } from '@tokens';
 * const color = Tokens.colors.primary.DEFAULT;
 */
export const Tokens = {
  colors: ColorTokens,
  spacing: SpacingTokens,
  typography: TypographyTokens,
};
