/**
 * Modal - 統一的彈窗組件
 * Phase 2: 導航簡化
 *
 * 用於取代子頁面導航，所有設定相關功能改用 Modal 顯示
 */

import { ReactNode, useEffect } from 'react';

export interface ModalProps {
  /** 是否顯示彈窗 */
  open: boolean;
  /** 關閉彈窗的回調 */
  onClose: () => void;
  /** 彈窗標題（可選） */
  title?: string;
  /** 彈窗內容 */
  children: ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 位置 */
  position?: 'center' | 'bottom';
  /** 是否顯示關閉按鈕 */
  showClose?: boolean;
  /** 點擊 backdrop 是否關閉 */
  closeOnBackdrop?: boolean;
  /** 自定義樣式類名 */
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  position = 'center',
  showClose = true,
  closeOnBackdrop = true,
  className = '',
}: ModalProps) {
  // ESC 鍵關閉
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // 防止背景滾動
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const positionClasses =
    position === 'bottom'
      ? 'items-end sm:items-center'
      : 'items-center';

  const containerClasses =
    position === 'bottom'
      ? 'rounded-t-3xl sm:rounded-3xl w-full'
      : 'rounded-3xl w-full';

  const animationClasses =
    position === 'bottom'
      ? 'animate-slideUp'
      : 'animate-scale-up';

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex ${positionClasses} justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm`}
        onClick={handleBackdropClick}
      >
        <div
          className={`${containerClasses} ${sizeClasses[size]} max-h-[90vh] bg-gray-800 shadow-2xl overflow-hidden ${animationClasses} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 標題欄 */}
          {(title || showClose) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur">
              {title && (
                <h3 className="text-lg font-semibold text-gray-50">{title}</h3>
              )}
              {!title && showClose && <div />}
              {showClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-200 transition-colors p-2 -m-2 rounded-lg hover:bg-gray-700/50"
                  aria-label="關閉"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* 內容區域 */}
          <div className="overflow-y-auto max-h-[calc(90vh-64px)]">
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes scale-up {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-up {
          animation: scale-up 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
