/**
 * TimeBar - Badge 原子組件
 * Layer 4 (UI Layer) - 原子組件
 */

import type { ReactNode } from 'react';
import './Badge.css';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** 內容 */
  children: ReactNode;
  /** 變體 */
  variant?: BadgeVariant;
  /** 大小 */
  size?: BadgeSize;
  /** 左側圖標 */
  icon?: ReactNode;
  /** 是否可移除 */
  removable?: boolean;
  /** 移除回調 */
  onRemove?: () => void;
  /** 額外 className */
  className?: string;
}

/**
 * Badge 原子組件
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  removable = false,
  onRemove,
  className = '',
}: BadgeProps) {
  const classNames = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames}>
      {icon && <span className="badge__icon">{icon}</span>}
      <span className="badge__content">{children}</span>
      {removable && (
        <button
          type="button"
          className="badge__remove"
          onClick={onRemove}
          aria-label="移除"
        >
          ×
        </button>
      )}
    </span>
  );
}

export default Badge;
