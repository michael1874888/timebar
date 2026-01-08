/**
 * TimeBar - Design System 入口
 * Layer 4 (UI Layer)
 *
 * 統一導出所有 Design Tokens 和組件
 */

// Design Tokens
export { ColorTokens, colorToken } from './tokens/colors';
export { TypographyTokens, typographyToken } from './tokens/typography';
export { SpacingTokens, spacingToken } from './tokens/spacing';
export { AnimationTokens, animationToken } from './tokens/animations';
export { resolveToken, getColorToken, getTypographyToken, getSpacingToken, getAnimationToken, generateCSSVariables } from './tokens';

// Atoms (基礎組件)
export { Button } from './atoms/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './atoms/Button';

export { Badge } from './atoms/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './atoms/Badge';

export { Input } from './atoms/Input';
export type { InputProps, InputSize } from './atoms/Input';

// Molecules (分子組件)
export { Card } from './molecules/Card';
export type { CardProps } from './molecules/Card';

export { Modal } from './molecules/Modal';
export type { ModalProps } from './molecules/Modal';
