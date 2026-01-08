/**
 * TimeBar - Modal 分子組件
 * Layer 4 (UI Layer) - 分子組件
 */

import { useEffect, type ReactNode } from 'react';
import { Button } from '../atoms';
import './Modal.css';

export interface ModalProps {
  /** 是否開啟 */
  isOpen: boolean;
  /** 關閉回調 */
  onClose: () => void;
  /** 標題 */
  title?: ReactNode;
  /** 內容 */
  children: ReactNode;
  /** 底部操作區 */
  footer?: ReactNode;
  /** 大小 */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** 點擊遮罩是否關閉 */
  closeOnOverlay?: boolean;
  /** 是否顯示關閉按鈕 */
  showCloseButton?: boolean;
}

/**
 * Modal 分子組件
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  showCloseButton = true,
}: ModalProps) {
  // ESC 鍵關閉
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 阻止背景滾動
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeOnOverlay ? onClose : undefined}>
      <div
        className={`modal modal--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className="modal__header">
            {title && <h2 className="modal__title">{title}</h2>}
            {showCloseButton && (
              <button
                type="button"
                className="modal__close"
                onClick={onClose}
                aria-label="關閉"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
