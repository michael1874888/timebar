/**
 * DailyBudgetWidget - 今日額度進度條
 * v2.1: 顯示當日花費相對於每日可花費額度的進度
 */

import { useMemo } from 'react';
import { Record as RecordType, UserData } from '@/types';
import { Formatters } from '@/utils/financeCalc';
import { SettingsSystem } from '@/utils/settingsSystem';

const { formatCurrency } = Formatters;

interface DailyBudgetWidgetProps {
  records: RecordType[];
  userData: UserData;
  onOpenSettings?: () => void;
}

// 計算今日日期字串 (YYYY-MM-DD)
const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export function DailyBudgetWidget({ records, userData, onOpenSettings }: DailyBudgetWidgetProps) {
  // 取得每日預算設定（預設：月薪的 30%）
  const dailyBudget = useMemo(() => {
    const settings = SettingsSystem.getSetting('budgetSettings', { method: 'auto' });
    if (settings.method === 'custom' && settings.customDailyBudget && settings.customDailyBudget > 0) {
      return settings.customDailyBudget;
    }
    // 預設：(月薪 * 0.3) / 30 = 每日可花費
    return Math.round((userData.salary * 0.3) / 30);
  }, [userData.salary]);

  // 計算今日花費
  const todayString = getTodayString();
  const todaySpent = useMemo(() => {
    return records
      .filter(r => r.type === 'spend' && r.date === todayString && r.guiltFree !== true)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records, todayString]);

  // 計算進度百分比
  const progressPercent = useMemo(() => {
    if (dailyBudget <= 0) return 0;
    return Math.min((todaySpent / dailyBudget) * 100, 150); // 最多顯示 150%
  }, [todaySpent, dailyBudget]);

  // 剩餘額度
  const remaining = dailyBudget - todaySpent;
  const isOverBudget = remaining < 0;

  // 進度條顏色
  const getProgressColor = () => {
    if (progressPercent >= 100) return 'from-red-500 to-red-400';
    if (progressPercent >= 80) return 'from-orange-500 to-amber-400';
    if (progressPercent >= 50) return 'from-yellow-500 to-lime-400';
    return 'from-emerald-500 to-teal-400';
  };

  // 狀態訊息
  const getStatusMessage = () => {
    if (progressPercent >= 100) return '😰 超支警告！';
    if (progressPercent >= 80) return '😅 快到極限了';
    if (progressPercent >= 50) return '💪 穩健使用中';
    if (progressPercent > 0) return '✨ 保持得很好';
    return '🎉 今天還沒花錢';
  };

  return (
    <div 
      className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-4 border border-gray-700/50 cursor-pointer hover:border-gray-600/50 transition-all"
      onClick={onOpenSettings}
      role="button"
      aria-label="每日預算設定"
    >
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="text-gray-300 font-medium text-sm">今日額度</span>
        </div>
        <span className="text-xs text-gray-500">{getStatusMessage()}</span>
      </div>

      {/* 進度條 */}
      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
        {/* 超支指示器 */}
        {progressPercent > 100 && (
          <div
            className="absolute top-0 h-full bg-red-500/50 animate-pulse"
            style={{ left: '100%', width: `${progressPercent - 100}%`, maxWidth: '50%' }}
          />
        )}
        {/* 100% 標線 */}
        <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-500" />
      </div>

      {/* 數字顯示 */}
      <div className="flex justify-between items-end">
        <div>
          <span className={`font-bold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
            {formatCurrency(todaySpent)}
          </span>
          <span className="text-gray-500 text-sm"> / {formatCurrency(dailyBudget)}</span>
        </div>
        <div className={`text-sm font-medium ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
          {isOverBudget ? `超支 ${formatCurrency(Math.abs(remaining))}` : `剩餘 ${formatCurrency(remaining)}`}
        </div>
      </div>

      {/* 提示 */}
      <div className="text-gray-600 text-xs mt-2 text-center">
        點按調整每日額度設定
      </div>
    </div>
  );
}

// 每日預算設定工具函數
export const DailyBudgetUtils = {
  getDailyBudget(): number {
    const saved = Storage.load(DAILY_BUDGET_KEY) as number | null;
    return saved && saved > 0 ? saved : 0;
  },
  
  setDailyBudget(amount: number): void {
    Storage.save(DAILY_BUDGET_KEY, amount);
  },
  
  getDefaultBudget(salary: number): number {
    return Math.round((salary * 0.3) / 30);
  }
};
