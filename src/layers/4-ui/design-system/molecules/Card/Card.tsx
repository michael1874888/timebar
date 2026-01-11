/**
 * TimeBar - Card 分子組件
 * Layer 4 (UI Layer) - 分子組件
 */

import type { ReactNode, HTMLAttributes } from 'react';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 標題 */
  title?: ReactNode;
  /** 副標題 */
  subtitle?: ReactNode;
  /** 右側操作區 */
  action?: ReactNode;
  /** 內容區 padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 是否可點擊 */
  clickable?: boolean;
  /** 變體 */
  variant?: 'default' | 'outlined' | 'elevated';
}

/**
 * Card 分子組件
 */
export function Card({
  title,
  subtitle,
  action,
  padding = 'md',
  clickable = false,
  variant = 'default',
  children,
  className = '',
  ...props
}: CardProps) {
  const classNames = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    clickable && 'card--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hasHeader = title || subtitle || action;

  return (
    <div className={classNames} {...props}>
      {hasHeader && (
        <div className="card__header">
          <div className="card__header-content">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card__action">{action}</div>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </div>
  );
}

export default Card;
