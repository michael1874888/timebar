/**
 * Collapsible - 可折疊區塊組件
 * Phase 3: 設定頁扁平化
 *
 * 用於設定頁的分區折疊功能，讓用戶可以收起不常用的設定
 */

import { ReactNode, useState } from 'react';

export interface CollapsibleProps {
  /** 標題 */
  title: string;
  /** 標題圖標（可選） */
  icon?: string;
  /** 內容 */
  children: ReactNode;
  /** 默認是否展開 */
  defaultOpen?: boolean;
  /** 自定義樣式類名 */
  className?: string;
}

export function Collapsible({
  title,
  icon,
  children,
  defaultOpen = true,
  className = '',
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div className={`bg-gray-800/50 rounded-3xl overflow-hidden mb-6 ${className}`}>
      {/* 標題欄 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <h2 className="text-white font-bold text-left">{title}</h2>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 內容區域 */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
