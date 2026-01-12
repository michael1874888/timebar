/**
 * TimeBar - 軌跡進度組件
 * Layer 4 (UI Layer) - 新的目標軌跡偏差視覺化
 *
 * 核心概念：
 * 顯示「本月儲蓄達成率」而非累積時間成本
 */

import { useMemo } from 'react';
import type { TrajectoryStatus, MonthlySavingsStatus } from '@domain/calculators';

export interface TrajectoryProgressProps {
  /** 軌跡狀態 */
  status: TrajectoryStatus;
  /** 本月儲蓄狀態 */
  monthlySavings: MonthlySavingsStatus;
  /** 目標退休年齡 */
  targetRetireAge: number;
  /** 預估退休年齡 */
  estimatedRetireAge: number;
  /** 與目標的差距（天）正數=延後 */
  daysDiff: number;
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
    return `${(amount / 10000).toFixed(1)}萬`;
  }
  return `$${Math.round(amount).toLocaleString()}`;
}

/**
 * 軌跡進度組件
 *
 * 顯示本月儲蓄目標達成率、可消費額度、退休影響
 */
export function TrajectoryProgress({
  status,
  monthlySavings,
  targetRetireAge,
  estimatedRetireAge,
  daysDiff,
  dailyBudget,
  remainingDays,
  onClick,
}: TrajectoryProgressProps) {
  // 進度百分比（限制在 0-150%）
  const progressPercent = useMemo(() => {
    return Math.min(150, Math.max(0, monthlySavings.progressPercent));
  }, [monthlySavings.progressPercent]);

  // 狀態配置
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'ahead':
        return {
          barColor: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
          textColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          icon: '🚀',
          label: '領先',
          message: `太棒了！你可以提早 ${Math.abs(daysDiff)} 天退休 🎉`,
        };
      case 'behind':
        return {
          barColor: 'bg-gradient-to-r from-orange-600 to-orange-400',
          textColor: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          icon: '⏰',
          label: '落後',
          message: `若持續此狀態，退休將延後約 ${Math.abs(daysDiff)} 天`,
        };
      default:
        return {
          barColor: 'bg-gradient-to-r from-blue-600 to-blue-400',
          textColor: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          icon: '✅',
          label: '準時達標',
          message: '完美！你正朝著目標穩定前進 👍',
        };
    }
  }, [status, daysDiff]);

  // 是否超過 100%（進度溢出）
  const isOverTarget = progressPercent > 100;

  return (
    <div
      className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="本月儲蓄進度"
    >
      {/* 標題與狀態 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-white font-bold text-base">本月儲蓄目標</span>
        </div>

        {/* 狀態徽章 */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-500 ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
        >
          <span className="text-lg">{statusConfig.icon}</span>
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* 進度條 */}
      <div className="relative mb-6">
        {/* 背景軌道 */}
        <div className="relative h-4 rounded-full overflow-hidden bg-gray-950/80 border border-gray-700">
          {/* 進度填充 */}
          <div
            className={`absolute h-full transition-all duration-700 ease-out ${statusConfig.barColor}`}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />

          {/* 溢出部分（超過 100%） */}
          {isOverTarget && (
            <div
              className="absolute h-full bg-emerald-300/50 transition-all duration-700"
              style={{
                left: '100%',
                width: `${progressPercent - 100}%`,
                transform: 'translateX(-100%)',
              }}
            />
          )}

          {/* 光澤效果 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        </div>

        {/* 百分比標籤 */}
        <div className="absolute right-0 top-5 text-sm font-bold">
          <span className={progressPercent >= 100 ? 'text-emerald-400' : 'text-orange-400'}>
            {progressPercent.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 數據卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* 目標儲蓄 */}
        <div className="bg-gray-900/50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">目標儲蓄</div>
          <div className="text-white font-bold text-lg tabular-nums">
            {formatCurrency(monthlySavings.requiredMonthlySavings)}
          </div>
        </div>

        {/* 實際儲蓄 */}
        <div className="bg-gray-900/50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">實際儲蓄</div>
          <div className={`font-bold text-lg tabular-nums ${
            monthlySavings.actualMonthlySavings >= monthlySavings.requiredMonthlySavings
              ? 'text-emerald-400'
              : 'text-white'
          }`}>
            {formatCurrency(monthlySavings.actualMonthlySavings)}
          </div>
        </div>

        {/* 差額 */}
        <div className="bg-gray-900/50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">差額</div>
          <div className={`font-bold text-lg tabular-nums ${
            monthlySavings.savingsGap <= 0 ? 'text-emerald-400' : 'text-orange-400'
          }`}>
            {monthlySavings.savingsGap <= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(monthlySavings.savingsGap))}
          </div>
        </div>
      </div>

      {/* 可消費資訊 */}
      <div className={`rounded-xl p-3 mb-4 border ${
        monthlySavings.remainingBudget >= 0
          ? 'bg-gray-800/50 border-gray-700/50'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">💳</span>
            <span className="text-sm text-gray-300">本月剩餘可消費</span>
          </div>
          <span className={`font-bold ${
            monthlySavings.remainingBudget >= 0 ? 'text-white' : 'text-red-400'
          }`}>
            {formatCurrency(monthlySavings.remainingBudget)}
          </span>
        </div>
        {remainingDays > 0 && dailyBudget > 0 && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            每天可花 {formatCurrency(dailyBudget)}（剩餘 {remainingDays} 天）
          </div>
        )}
      </div>

      {/* 退休影響提示 */}
      <div className={`rounded-xl p-3 ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
        <p className={`text-sm text-center ${statusConfig.textColor}`}>
          {statusConfig.message}
        </p>
      </div>
    </div>
  );
}

export default TrajectoryProgress;
