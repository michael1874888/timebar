/**
 * CategorySelectModal - 分類選擇彈窗
 * Phase 1 UI/UX: 改善記帳體驗
 *
 * 在用戶點擊「我買了」後彈出，讓用戶選擇消費分類
 */

import { CategorySystem } from '@/utils/categorySystem';
import { ColorTokens } from '@tokens';

interface CategorySelectModalProps {
  /** 是否顯示彈窗 */
  open: boolean;
  /** 關閉彈窗的回調 */
  onClose: () => void;
  /** 選擇分類的回調 */
  onSelect: (categoryId: string) => void;
}

export function CategorySelectModal({
  open,
  onClose,
  onSelect,
}: CategorySelectModalProps) {
  if (!open) return null;

  const categories = CategorySystem.getCategories();

  const handleCategoryClick = (categoryId: string) => {
    onSelect(categoryId);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] overflow-hidden shadow-2xl animate-slideUp">
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
      `}</style>
    </div>
  );
}
