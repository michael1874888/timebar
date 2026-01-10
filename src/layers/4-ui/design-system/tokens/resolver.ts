// src/layers/4-ui/design-system/tokens/resolver.ts

import { ColorTokens } from './colors';
import { SpacingTokens } from './spacing';
import { TypographyTokens } from './typography';

type TokenPath = string; // 例如 'colors.state.ahead.main'

/**
 * 解析 token 路徑為實際值
 *
 * @param path - 點記法路徑，如 'colors.primary.DEFAULT'
 * @returns 解析後的值
 * @throws 如果路徑不存在
 *
 * @example
 * resolveToken('colors.primary.DEFAULT') // '#10b981'
 * resolveToken('spacing.md') // '1rem'
 * resolveToken('typography.size.5xl') // '3rem'
 */
export function resolveToken(path: TokenPath): string {
  const parts = path.split('.');
  let value: any = {
    colors: ColorTokens,
    spacing: SpacingTokens,
    typography: TypographyTokens
  };

  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      throw new Error(`Token not found: ${path}`);
    }
  }

  return value;
}

/**
 * 批量解析 tokens
 *
 * @param paths - Token 路徑陣列
 * @returns 解析後的值陣列
 *
 * @example
 * resolveTokens(['colors.primary.DEFAULT', 'spacing.md'])
 * // ['#10b981', '1rem']
 */
export function resolveTokens(paths: TokenPath[]): string[] {
  return paths.map(resolveToken);
}
