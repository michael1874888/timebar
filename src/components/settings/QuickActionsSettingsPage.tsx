/**
 * QuickActionsSettingsPage - 快速記帳設定頁面
 * v2.1: 管理快速記帳按鈕（新增/編輯/刪除/排序）
 */

import { useState, useMemo } from 'react';
import { QuickActionsUtils, QuickAction } from '../dashboard/QuickActionsBar';
import { CategorySystem } from '@/utils/categorySystem';

interface QuickActionsSettingsPageProps {
  onBack: () => void;
}

// 常用 emoji 列表
const EMOJI_OPTIONS = ['☕', '🍱', '🚇', '🍩', '🍕', '🎬', '💊', '🛒', '🍺', '🎮', '📚', '💇', '🐱', '🏋️', '☁️'];

export function QuickActionsSettingsPage({ onBack }: QuickActionsSettingsPageProps) {
  const [quickActions, setQuickActions] = useState<QuickAction[]>(() => QuickActionsUtils.getQuickActions());
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 取得可用分類
  const categories = useMemo(() => {
    return CategorySystem.getCategories();
  }, []);

  // 儲存並刷新
  const saveAndRefresh = (actions: QuickAction[]) => {
    QuickActionsUtils.saveQuickActions(actions);
    setQuickActions(actions);
  };

  // 刪除快速按鈕
  const handleDelete = (id: string) => {
    const updated = quickActions.filter(a => a.id !== id);
    saveAndRefresh(updated);
  };

  // 開始編輯
  const handleEdit = (action: QuickAction) => {
    setEditingAction({ ...action });
    setIsCreating(false);
  };

  // 開始新增
  const handleCreate = () => {
    setEditingAction({
      id: Date.now().toString(),
      name: '',
      icon: '☕',
      amount: 100,
      categoryId: 'food',
      isRecurring: false
    });
    setIsCreating(true);
  };

  // 儲存編輯/新增
  const handleSave = () => {
    if (!editingAction || !editingAction.name.trim()) return;
    
    if (isCreating) {
      saveAndRefresh([...quickActions, editingAction]);
    } else {
      const updated = quickActions.map(a => a.id === editingAction.id ? editingAction : a);
      saveAndRefresh(updated);
    }
    setEditingAction(null);
    setIsCreating(false);
  };

  // 重置為預設
  const handleReset = () => {
    QuickActionsUtils.resetToDefault();
    setQuickActions(QuickActionsUtils.getQuickActions());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">快速記帳設定</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
        {/* 說明 */}
        <div className="bg-gray-800/50 rounded-xl p-4 text-gray-400 text-sm">
          ⚡ 自訂你常用的消費項目，一鍵快速記帳！
        </div>

        {/* 快速按鈕列表 */}
        <div className="space-y-3">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <div className="text-white font-medium">{action.name}</div>
                  <div className="text-orange-400 text-sm">${action.amount}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(action)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(action.id)}
                  className="p-2 text-gray-400 hover:text-red-400"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 新增按鈕 */}
        <button
          onClick={handleCreate}
          className="w-full py-4 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          + 新增快速按鈕
        </button>

        {/* 重置為預設 */}
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-xl bg-gray-700/50 text-gray-500 hover:text-gray-300 text-sm"
        >
          🔄 重置為預設
        </button>
      </div>

      {/* 編輯/新增 Modal */}
      {editingAction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              {isCreating ? '新增快速按鈕' : '編輯快速按鈕'}
            </h2>

            {/* 圖示選擇 */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">圖示</label>
              <div className="grid grid-cols-5 gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setEditingAction({ ...editingAction, icon: emoji })}
                    className={`text-2xl p-2 rounded-lg ${
                      editingAction.icon === emoji 
                        ? 'bg-orange-500/30 ring-2 ring-orange-500' 
                        : 'bg-gray-700/50 hover:bg-gray-600/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 名稱 */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">名稱</label>
              <input
                type="text"
                value={editingAction.name}
                onChange={(e) => setEditingAction({ ...editingAction, name: e.target.value })}
                placeholder="例：早餐"
                className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* 預設金額 */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">預設金額</label>
              <input
                type="number"
                value={editingAction.amount}
                onChange={(e) => setEditingAction({ ...editingAction, amount: Number(e.target.value) })}
                className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* 分類 */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-2 block">分類</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setEditingAction({ ...editingAction, categoryId: cat.id })}
                    className={`flex flex-col items-center p-2 rounded-lg text-xs ${
                      editingAction.categoryId === cat.id
                        ? 'bg-orange-500/30 ring-2 ring-orange-500'
                        : 'bg-gray-700/50 hover:bg-gray-600/50'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-gray-300 truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 按鈕 */}
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingAction(null); setIsCreating(false); }}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editingAction.name.trim()}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-gray-900 font-bold hover:bg-orange-400 disabled:opacity-30"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
