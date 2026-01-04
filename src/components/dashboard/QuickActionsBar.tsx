/**
 * QuickActionsBar - 快速記帳按鈕列
 * v2.1: 提供一鍵快速記錄常用消費
 */

import { useState, useMemo } from 'react';
import { Storage } from '@/utils/storage';
import { CategorySystem } from '@/utils/categorySystem';
import { Formatters } from '@/utils/financeCalc';
import { GoogleSheetsAPI } from '@/services/googleSheets';

const { formatCurrency } = Formatters;

interface QuickAction {
  id: string;
  name: string;
  icon: string;
  amount: number;
  categoryId: string;
  isRecurring: boolean;
}

interface QuickActionsBarProps {
  onQuickAdd: (action: QuickAction) => void;
  onOpenSettings?: () => void;
}

// 預設快速操作
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'coffee', name: '咖啡', icon: '☕', amount: 150, categoryId: 'food', isRecurring: false },
  { id: 'lunch', name: '午餐', icon: '🍱', amount: 120, categoryId: 'food', isRecurring: false },
  { id: 'transport', name: '交通', icon: '🚇', amount: 35, categoryId: 'transport', isRecurring: false },
  { id: 'snack', name: '點心', icon: '🍩', amount: 80, categoryId: 'food', isRecurring: false },
];

const QUICK_ACTIONS_KEY = 'timebar_quick_actions';

export function QuickActionsBar({ onQuickAdd, onOpenSettings }: QuickActionsBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<QuickAction | null>(null);
  const [adjustedAmount, setAdjustedAmount] = useState<number>(0);

  // 取得快速操作列表
  const quickActions = useMemo(() => {
    const saved = Storage.load(QUICK_ACTIONS_KEY) as QuickAction[] | null;
    return saved && saved.length > 0 ? saved : DEFAULT_QUICK_ACTIONS;
  }, []);

  // 處理快速記帳
  const handleQuickAction = (action: QuickAction) => {
    setConfirmingAction(action);
    setAdjustedAmount(action.amount);  // 初始化為預設金額
  };

  // 確認記帳
  const confirmAction = () => {
    if (confirmingAction) {
      // 使用微調後的金額
      onQuickAdd({ ...confirmingAction, amount: adjustedAmount });
      setConfirmingAction(null);
    }
  };

  // 計算時薪資訊
  const getCategoryDisplay = (categoryId: string) => {
    return CategorySystem.getCategoryDisplay(categoryId);
  };

  return (
    <div className="relative">
      {/* 主按鈕列 */}
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-4 border border-gray-700/50">
        {/* 標題列 */}
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-gray-300 font-medium text-sm">快速記帳</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings();
                }}
                className="text-gray-500 hover:text-gray-400 p-1"
              >
                ⚙️
              </button>
            )}
            <span className={`text-gray-500 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>

        {/* 按鈕網格 - 第一行完整顯示，展開時顯示更多 */}
        <div className={`grid grid-cols-4 gap-2 overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-96' : 'max-h-24'
        }`}>
          {quickActions.slice(0, isExpanded ? quickActions.length : 4).map((action) => {
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex flex-col items-center p-2 rounded-xl bg-gray-700/30 hover:bg-gray-600/50 transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {action.icon}
                </span>
                <span className="text-xs text-gray-400 mt-1 truncate max-w-full">
                  {action.name}
                </span>
                <span className="text-xs text-orange-400 font-medium">
                  ${action.amount}
                </span>
              </button>
            );
          })}
        </div>

        {/* 展開提示 */}
        {quickActions.length > 4 && !isExpanded && (
          <div className="text-center text-gray-600 text-xs mt-2">
            點擊展開更多
          </div>
        )}
      </div>

      {/* 確認 Modal - 含金額微調 */}
      {confirmingAction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm animate-scale-up">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">{confirmingAction.icon}</div>
              <h2 className="text-xl font-bold text-white mb-2">
                記錄 {confirmingAction.name}？
              </h2>
              <div className="text-3xl font-black text-orange-400">
                {formatCurrency(adjustedAmount)}
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-2">
                <span>{getCategoryDisplay(confirmingAction.categoryId).icon}</span>
                <span>{getCategoryDisplay(confirmingAction.categoryId).name}</span>
              </div>
            </div>

            {/* 金額微調滑桿 */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>${Math.max(10, Math.floor(confirmingAction.amount * 0.5))}</span>
                <span className="text-gray-400">微調金額</span>
                <span>${Math.floor(confirmingAction.amount * 2)}</span>
              </div>
              <input
                type="range"
                min={Math.max(10, Math.floor(confirmingAction.amount * 0.5))}
                max={Math.floor(confirmingAction.amount * 2)}
                step={confirmingAction.amount >= 100 ? 10 : 5}
                value={adjustedAmount}
                onChange={(e) => setAdjustedAmount(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              {/* 快速調整按鈕 */}
              <div className="flex justify-center gap-2 mt-3">
                {[0.5, 0.75, 1, 1.25, 1.5].map(multiplier => {
                  const value = Math.round(confirmingAction.amount * multiplier);
                  return (
                    <button
                      key={multiplier}
                      onClick={() => setAdjustedAmount(value)}
                      className={`px-2 py-1 rounded text-xs ${
                        adjustedAmount === value
                          ? 'bg-orange-500 text-gray-900'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {multiplier === 1 ? '預設' : `${multiplier}x`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingAction(null)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-gray-900 font-bold hover:bg-orange-400"
              >
                ✓ 確認記帳
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 快速操作工具函數
export const QuickActionsUtils = {
  getQuickActions(): QuickAction[] {
    const saved = Storage.load(QUICK_ACTIONS_KEY) as QuickAction[] | null;
    return saved && saved.length > 0 ? saved : DEFAULT_QUICK_ACTIONS;
  },

  saveQuickActions(actions: QuickAction[]): void {
    Storage.save(QUICK_ACTIONS_KEY, actions);
    // 同步到雲端
    GoogleSheetsAPI.saveQuickActions(actions).catch(err => {
      console.error('Failed to sync quick actions to cloud:', err);
    });
  },

  addQuickAction(action: QuickAction): void {
    const actions = this.getQuickActions();
    actions.push(action);
    this.saveQuickActions(actions);
  },

  removeQuickAction(id: string): void {
    const actions = this.getQuickActions().filter(a => a.id !== id);
    this.saveQuickActions(actions);
  },

  updateQuickAction(updated: QuickAction): void {
    const actions = this.getQuickActions().map(a =>
      a.id === updated.id ? updated : a
    );
    this.saveQuickActions(actions);
  },

  resetToDefault(): void {
    Storage.save(QUICK_ACTIONS_KEY, DEFAULT_QUICK_ACTIONS);
    // 同步到雲端
    GoogleSheetsAPI.saveQuickActions(DEFAULT_QUICK_ACTIONS).catch(err => {
      console.error('Failed to sync quick actions to cloud:', err);
    });
  },

  // 從雲端同步快速按鈕
  async syncFromCloud(): Promise<boolean> {
    try {
      const result = await GoogleSheetsAPI.getQuickActions();
      if (result.success && result.data && result.data.length > 0) {
        Storage.save(QUICK_ACTIONS_KEY, result.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to sync quick actions from cloud:', err);
      return false;
    }
  }
};

export type { QuickAction };
