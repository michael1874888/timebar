/**
 * TimeBar - 月度預算卡片組件
 * Layer 4 (UI Layer)
 *
 * 顯示本月可消費額度、已花費、剩餘金額
 */

import type { MonthlySavingsStatus } from '@domain/calculators';

export interface MonthlyBudgetCardProps {
  /** 本月儲蓄狀態 */
  monthlySavings: MonthlySavingsStatus;
  /** 每日可消費額度 */
  dailyBudget: number;
  /** 本月剩餘天數 */
  remainingDays: number;
  /** 點擊回調 */
  onClick?: () => void;
}

/**
 * 格式化金額
 */
function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    return `$${(amount / 10000).toFixed(1)}萬`;
  }
  return `$${Math.round(amount).toLocaleString()}`;
}

/**
 * 月度預算卡片
 *
 * 顯示本月可消費額度、已花費、剩餘金額
 */
export function MonthlyBudgetCard({
  monthlySavings,
  dailyBudget,
  remainingDays,
  onClick,
}: MonthlyBudgetCardProps) {
  const { monthlyBudget, totalSpent, remainingBudget } = monthlySavings;
  const isOverBudget = remainingBudget < 0;

  return (
    <div
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 shadow-xl transition-all duration-300 cursor-pointer hover:shadow-2xl"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="本月消費預算"
    >
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💳</span>
        <span className="text-white font-bold text-base">本月可消費</span>
      </div>

      {/* 三欄數據 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* 可消費 */}
        <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1">可消費</div>
          <div className="text-white font-bold text-lg tabular-nums">
            {formatCurrency(monthlyBudget)}
          </div>
        </div>

        {/* 已花費 */}
        <div className={`rounded-xl p-3 text-center border ${
          isOverBudget 
            ? 'bg-orange-500/10 border-orange-500/30' 
            : 'bg-gray-900/50 border-gray-700/30'
        }`}>
          <div className="text-xs text-gray-400 mb-1">已花費</div>
          <div className={`font-bold text-lg tabular-nums ${
            isOverBudget ? 'text-orange-400' : 'text-white'
          }`}>
            {formatCurrency(totalSpent)}
          </div>
        </div>

        {/* 剩餘 */}
        <div className={`rounded-xl p-3 text-center border ${
          isOverBudget 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="text-xs text-gray-400 mb-1">剩餘</div>
          <div className={`font-bold text-lg tabular-nums ${
            isOverBudget ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {formatCurrency(remainingBudget)}
          </div>
        </div>
      </div>

      {/* 每日預算提示 */}
      {remainingDays > 0 && (
        <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="text-sm text-gray-300">每天可花</span>
            </div>
            <div className="text-right">
              <span className={`font-bold text-lg ${
                dailyBudget > 0 ? 'text-white' : 'text-red-400'
              }`}>
                {dailyBudget > 0 ? formatCurrency(dailyBudget) : '$0'}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                （剩餘 {remainingDays} 天）
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 超支警告 */}
      {isOverBudget && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-sm text-red-400 text-center">
            ⚠️ 本月已超支 {formatCurrency(Math.abs(remainingBudget))}
          </p>
        </div>
      )}
    </div>
  );
}

export default MonthlyBudgetCard;
