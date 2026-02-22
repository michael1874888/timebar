/**
 * CategorySelectModal - 分類選擇彈窗
 * Phase 1 UI/UX: 改善記帳體驗
 *
 * 在用戶點擊「我買了」後彈出，讓用戶選擇消費分類
 * 選擇分類後進入確認畫面，可選填備註
 */

import { useState, useRef, useEffect } from 'react';
import { CategorySystem } from '@/utils/categorySystem';


interface CategorySelectModalProps {
  /** 是否顯示彈窗 */
  open: boolean;
  /** 關閉彈窗的回調 */
  onClose: () => void;
  /** 選擇分類的回調（含備註） */
  onSelect: (categoryId: string, note: string) => void;
  /** 待記錄金額，用於確認畫面顯示 */
  amount?: number;
}

export function CategorySelectModal({
  open,
  onClose,
  onSelect,
  amount,
}: CategorySelectModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const noteInputRef = useRef<HTMLInputElement>(null);

  // 重置狀態（彈窗關閉時）
  useEffect(() => {
    if (!open) {
      setSelectedCategory(null);
      setNote('');
    }
  }, [open]);

  // 選完分類後 auto-focus 備註欄
  useEffect(() => {
    if (selectedCategory && noteInputRef.current) {
      // 延遲 focus，等動畫完成
      const timer = setTimeout(() => noteInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedCategory]);

  if (!open) return null;

  const categories = CategorySystem.getCategories();
  const selected = categories.find((c) => c.id === selectedCategory);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleConfirm = () => {
    if (!selectedCategory) return;
    onSelect(selectedCategory, note.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setNote('');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatAmount = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] overflow-hidden shadow-2xl animate-slideUp">

        {/* === 第一步：選擇分類 === */}
        {!selectedCategory && (
          <>
            {/* 標題 */}
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-50">選擇消費分類</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-200 transition-colors p-2 -m-2"
                  aria-label="關閉"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 分類列表 */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-700/50 hover:bg-gray-700 active:scale-95 transition-all border-2 border-transparent hover:border-gray-600"
                    style={{
                      borderColor: `${category.color}20`,
                    }}
                  >
                    <span className="text-4xl mb-2">{category.icon}</span>
                    <span className="text-sm font-medium text-gray-200">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 取消按鈕 */}
            <div className="px-4 py-3 border-t border-gray-700">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition-colors"
              >
                取消
              </button>
            </div>
          </>
        )}

        {/* === 第二步：確認 + 備註 === */}
        {selectedCategory && selected && (
          <>
            {/* 標題 */}
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="text-gray-400 hover:text-gray-200 transition-colors p-1 -ml-1"
                    aria-label="返回"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-lg font-semibold text-gray-50">記錄消費</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-200 transition-colors p-2 -m-2"
                  aria-label="關閉"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 確認內容 */}
            <div className="p-5 animate-fadeIn">
              {/* 已選分類 Chip */}
              <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-2xl bg-gray-700/50 border border-gray-600/50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selected.icon}</span>
                  <span className="text-base font-medium text-gray-100">{selected.name}</span>
                </div>
                {amount !== undefined && (
                  <span className="text-lg font-bold text-orange-400">{formatAmount(amount)}</span>
                )}
              </div>

              {/* 備註輸入 */}
              <div className="mb-5">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">📝</span>
                  <input
                    ref={noteInputRef}
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="新增備註（選填）..."
                    maxLength={50}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                  />
                </div>
                {note.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1.5 text-right">{note.length}/50</p>
                )}
              </div>

              {/* 儲存按鈕 */}
              <button
                onClick={handleConfirm}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-base transition-all shadow-lg shadow-emerald-600/20"
              >
                ✅ 儲存記錄
              </button>
            </div>
          </>
        )}
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
