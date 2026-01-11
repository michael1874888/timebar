/**
 * UnlockNotification Component
 *
 * 功能解鎖慶祝通知
 * 當用戶達成解鎖條件時顯示慶祝動畫
 */

import { useEffect } from 'react';

interface UnlockNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: string;
}

export function UnlockNotification({
  isOpen,
  onClose,
  title,
  description,
  icon,
}: UnlockNotificationProps) {
  // 自動關閉
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-emerald-900/90 to-teal-900/90 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 animate-scale-up">
        {/* 頂部圖標 */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-7xl animate-bounce-slow">
          {icon}
        </div>

        <div className="text-center pt-6">
          {/* 主標題 */}
          <h2 className="text-3xl font-black text-white mb-4">{title}</h2>

          {/* 描述 */}
          <div className="bg-emerald-500/20 rounded-2xl p-4 mb-4">
            <p className="text-emerald-100 text-base leading-relaxed">
              {description}
            </p>
          </div>

          {/* 提示 */}
          <div className="text-emerald-300/60 text-sm">
            點擊任意處關閉
          </div>
        </div>

        {/* 裝飾元素 */}
        <div className="absolute top-4 right-4 text-2xl opacity-30 animate-spin-slow">
          ✨
        </div>
        <div className="absolute bottom-4 left-4 text-2xl opacity-30 animate-spin-slow" style={{ animationDelay: '1s' }}>
          ✨
        </div>
      </div>
    </div>
  );
}
