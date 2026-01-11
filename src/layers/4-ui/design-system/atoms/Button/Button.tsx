/**
 * TimeBar - Button 原子組件
 * Layer 4 (UI Layer) - 原子組件
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按鈕變體 */
  variant?: ButtonVariant;
  /** 按鈕大小 */
  size?: ButtonSize;
  /** 是否全寬 */
  fullWidth?: boolean;
  /** 是否載入中 */
  loading?: boolean;
  /** 左側圖標 */
  leftIcon?: ReactNode;
  /** 右側圖標 */
  rightIcon?: ReactNode;
}

/**
 * Button 原子組件
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const classNames = [
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      fullWidth && 'btn--full-width',
      loading && 'btn--loading',
      disabled && 'btn--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="btn__spinner" />}
        {!loading && leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
        <span className="btn__content">{children}</span>
        {!loading && rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
