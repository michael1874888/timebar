/**
 * CategorySettingsPage - 分類管理頁面
 * v2.1: 管理自定義分類、隱藏/顯示預設分類
 */

import { useState } from 'react';
import { Category } from '@/types';
import { CategorySystem, DEFAULT_CATEGORIES } from '@/utils/categorySystem';

interface CategorySettingsPageProps {
  onClose: () => void;
}

export function CategorySettingsPage({ onClose }: CategorySettingsPageProps) {
  const [customCategories, setCustomCategories] = useState<Category[]>(
    () => CategorySystem.getCustomCategories()
  );
  const [hiddenIds, setHiddenIds] = useState<string[]>(
    () => CategorySystem.getHiddenCategoryIds()
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // 切換分類顯示/隱藏
  const handleToggleVisibility = (id: string) => {
    const newHiddenIds = hiddenIds.includes(id)
      ? hiddenIds.filter(hid => hid !== id)
      : [...hiddenIds, id];
    setHiddenIds(newHiddenIds);
    CategorySystem.toggleCategoryVisibility(id);
  };

  // 刪除自定義分類
  const handleDeleteCustom = (id: string) => {
    CategorySystem.removeCustomCategory(id);
    setCustomCategories(CategorySystem.getCustomCategories());
  };

  // 儲存自定義分類
  const handleSaveCategory = (category: Category) => {
    if (category.type === 'custom') {
      // 更新或新增自定義分類
      const customs = CategorySystem.getCustomCategories();
      const index = customs.findIndex(c => c.id === category.id);
      if (index >= 0) {
        customs[index] = category;
      } else {
        customs.push(category);
      }
      // 儲存並更新狀態
      localStorage.setItem('timebar_custom_categories', JSON.stringify(customs));
      setCustomCategories(customs);
    }
    setEditingCategory(null);
    setIsAdding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur sticky top-0 z-10 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">分類管理</h1>
        </div>
      </div>

      <div className="px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          {/* 預設分類 */}
          <div className="mb-6">
            <h2 className="text-gray-400 text-sm mb-3">預設分類</h2>
            <div className="bg-gray-800/40 rounded-2xl overflow-hidden">
              {DEFAULT_CATEGORIES.map((cat, i) => {
                const isHidden = hiddenIds.includes(cat.id);
                return (
                  <div 
                    key={cat.id}
                    className={`flex items-center gap-4 p-4 ${i > 0 ? 'border-t border-gray-700/50' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isHidden ? 'bg-gray-700/30 opacity-50' : 'bg-gray-700/50'}`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isHidden ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {cat.name}
                      </div>
                      <div className="text-gray-500 text-sm">{cat.id}</div>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        isHidden
                          ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }`}
                    >
                      {isHidden ? '顯示' : '隱藏'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 自定義分類 */}
          <div className="mb-6">
            <h2 className="text-gray-400 text-sm mb-3">
              自定義分類 ({customCategories.length})
            </h2>
            {customCategories.length === 0 ? (
              <div className="bg-gray-800/40 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-gray-500 text-sm">尚無自定義分類</div>
              </div>
            ) : (
              <div className="bg-gray-800/40 rounded-2xl overflow-hidden">
                {customCategories.map((cat, i) => (
                  <div 
                    key={cat.id}
                    className={`flex items-center gap-4 p-4 ${i > 0 ? 'border-t border-gray-700/50' : ''}`}
                  >
                    <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center text-2xl">
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{cat.name}</div>
                      <div className="text-gray-500 text-sm">{cat.id}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-600 flex items-center justify-center"
                      >
                        <span className="text-sm">✏️</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCustom(cat.id)}
                        className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-red-500/30 flex items-center justify-center"
                      >
                        <span className="text-sm">🗑️</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 新增按鈕 */}
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingCategory({
                id: `custom_${Date.now()}`,
                name: '',
                icon: '📦',
                color: '#6b7280',
                type: 'custom',
                sortOrder: 100 + customCategories.length
              });
            }}
            className="w-full py-4 rounded-2xl bg-cyan-500/20 border-2 border-dashed border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-all"
          >
            ➕ 新增自定義分類
          </button>

          {/* 提示 */}
          <div className="text-center text-gray-500 text-xs mt-6">
            隱藏的分類不會出現在記帳選擇器中
          </div>
        </div>
      </div>

      {/* 編輯 Modal */}
      {editingCategory && (
        <CategoryEditor
          category={editingCategory}
          onSave={handleSaveCategory}
          onCancel={() => {
            setEditingCategory(null);
            setIsAdding(false);
          }}
          isNew={isAdding}
        />
      )}
    </div>
  );
}

// 分類編輯器
interface CategoryEditorProps {
  category: Category;
  onSave: (category: Category) => void;
  onCancel: () => void;
  isNew: boolean;
}

const EMOJI_OPTIONS = ['🍽️', '🚗', '🎮', '🏠', '💊', '📚', '📱', '📦', '🎁', '💰', '🛒', '✈️', '🎬', '⚽', '🐱', '🌟'];

function CategoryEditor({ category, onSave, onCancel, isNew }: CategoryEditorProps) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('請輸入分類名稱');
      return;
    }
    onSave({
      ...category,
      name: name.trim(),
      icon
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md animate-scale-up">
        <h2 className="text-xl font-bold text-white mb-6">
          {isNew ? '➕ 新增分類' : '✏️ 編輯分類'}
        </h2>

        {/* 名稱 */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">分類名稱 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：寵物"
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* 圖示選擇 */}
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">選擇圖示</label>
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                  icon === emoji
                    ? 'bg-cyan-500 ring-2 ring-cyan-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-cyan-500 text-gray-900 font-bold hover:bg-cyan-400"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}
