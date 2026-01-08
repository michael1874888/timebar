/**
 * TimeBar Design System - Token Resolver
 * 用於解析語義化 token 引用，例如 'semantic.primary.DEFAULT' -> '#10b981'
 */

import { ColorTokens } from './colors';
import { TypographyTokens } from './typography';
import { SpacingTokens } from './spacing';
import { AnimationTokens } from './animations';

// 所有 tokens 的聯合
const allTokens = {
  colors: ColorTokens,
  typography: TypographyTokens,
  spacing: SpacingTokens,
  animations: AnimationTokens,
};

/**
 * 透過路徑解析 token 值
 * @example resolveToken('colors.semantic.primary.DEFAULT') -> '#10b981'
 * @example resolveToken('spacing.spacing.4') -> '1rem'
 */
export function resolveToken(path: string): string {
  const parts = path.split('.');
  let current: unknown = allTokens;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      console.warn(`Token not found: ${path}`);
      return path; // 返回原始路徑作為 fallback
    }
  }

  // 如果值是另一個 token 引用 (e.g., 'semantic.primary.DEFAULT')
  if (typeof current === 'string' && current.includes('.')) {
    // 檢測是否為嵌套 token 引用
    const maybeNestedToken = `colors.${current}`;
    const nestedParts = maybeNestedToken.split('.');
    let nested: unknown = allTokens;
    let isValidReference = true;

    for (const part of nestedParts) {
      if (nested && typeof nested === 'object' && part in nested) {
        nested = (nested as Record<string, unknown>)[part];
      } else {
        isValidReference = false;
        break;
      }
    }

    if (isValidReference && typeof nested === 'string') {
      return nested;
    }
  }

  if (typeof current === 'string') {
    return current;
  }

  console.warn(`Token value is not a string: ${path}`);
  return String(current);
}

/**
 * 解析顏色 token
 * @example resolveColor('semantic.primary.DEFAULT') -> '#10b981'
 */
export function resolveColor(path: string): string {
  return resolveToken(`colors.${path}`);
}

/**
 * 解析間距 token
 * @example resolveSpacing('spacing.4') -> '1rem'
 */
export function resolveSpacing(path: string): string {
  return resolveToken(`spacing.${path}`);
}

/**
 * 解析字體 token
 * @example resolveTypography('fontSize.xl') -> '1.25rem'
 */
export function resolveTypography(path: string): string {
  return resolveToken(`typography.${path}`);
}

/**
 * 解析動畫 token
 * @example resolveAnimation('duration.normal') -> '300ms'
 */
export function resolveAnimation(path: string): string {
  return resolveToken(`animations.${path}`);
}

/**
 * 獲取 GPS 狀態的視覺配置
 */
export function getStateConfig(status: 'ahead' | 'onTrack' | 'behind') {
  return ColorTokens.state[status];
}

/**
 * 生成 CSS 變數映射
 * 用於 Tailwind 或原生 CSS 變數
 */
export function generateCSSVariables(): Record<string, string> {
  const variables: Record<string, string> = {};

  // 生成顏色變數
  function flattenObject(obj: object, prefix: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const varName = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value as object, varName);
      } else if (typeof value === 'string') {
        variables[`--${varName}`] = value;
      }
    }
  }

  flattenObject(ColorTokens, 'color');
  flattenObject(SpacingTokens.spacing, 'spacing');
  flattenObject(TypographyTokens.fontSize, 'font-size');
  flattenObject(AnimationTokens.duration, 'duration');

  return variables;
}

export { ColorTokens, TypographyTokens, SpacingTokens, AnimationTokens };
