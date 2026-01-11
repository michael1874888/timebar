/**
 * TimeBar - Input 原子組件
 * Layer 4 (UI Layer) - 原子組件
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import './Input.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 大小 */
  size?: InputSize;
  /** 左側裝飾 */
  leftAddon?: ReactNode;
  /** 右側裝飾 */
  rightAddon?: ReactNode;
  /** 錯誤訊息 */
  error?: string;
  /** 是否全寬 */
  fullWidth?: boolean;
  /** 標籤 */
  label?: string;
  /** 輔助文字 */
  helperText?: string;
}

/**
 * Input 原子組件
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      leftAddon,
      rightAddon,
      error,
      fullWidth = false,
      label,
      helperText,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperClasses = [
      'input-wrapper',
      fullWidth && 'input-wrapper--full-width',
    ]
      .filter(Boolean)
      .join(' ');

    const containerClasses = [
      'input-container',
      `input-container--${size}`,
      error && 'input-container--error',
      props.disabled && 'input-container--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className={containerClasses}>
          {leftAddon && <span className="input-addon input-addon--left">{leftAddon}</span>}
          <input
            ref={ref}
            id={inputId}
            className="input-field"
            {...props}
          />
          {rightAddon && <span className="input-addon input-addon--right">{rightAddon}</span>}
        </div>
        {(error || helperText) && (
          <span className={`input-helper ${error ? 'input-helper--error' : ''}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
