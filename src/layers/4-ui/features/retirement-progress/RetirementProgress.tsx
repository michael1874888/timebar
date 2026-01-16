/**
 * TimeBar - 退休進度條組件
 * Layer 4 (UI Layer) - 功能組件
 *
 * 替換原有的 Life Battery，以更直觀的進度條顯示退休目標追蹤
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ColorTokens } from '@ui/design-system/tokens';
import type { GPSStatus } from '@domain/types';
import { TimeCalculator } from '@domain/calculators';
import { Formatters } from '@/utils/financeCalc';
import './RetirementProgress.css';

export interface RetirementProgressProps {
  /** 目標退休年齡 */
  targetAge: number;
  /** 預估退休年齡 */
  estimatedAge: number;
  /** 當前年齡 (可選，用於進度計算) */
  currentAge?: number;
  /** 總節省時數 */
  totalSavedHours?: number;
  /** 總花費時數 */
  totalSpentHours?: number;
  /** 點擊時的回調 */
  onDetailClick?: () => void;
  /** 是否顯示詳情彈窗 */
  showDetail?: boolean;
  /** 關閉詳情的回調 */
  onCloseDetail?: () => void;
  /** 目標累積儲蓄金額 */
  targetAccumulatedSavings?: number;
  /** 實際累積儲蓄金額 */
  actualAccumulatedSavings?: number;
  /** 經過的月數 */
  monthsElapsed?: number;
  /** 偏差金額（正=超前，負=落後） */
  deviation?: number;
  /** 偏差天數（正=超前，負=落後）*/
  deviationDays?: number;
  /** 每月必須儲蓄金額 */
  requiredMonthlySavings?: number;
}

/**
 * 狀態配置
 */
const stateConfig = {
  ahead: {
    bar: ColorTokens.state.ahead.bar,
    dot: ColorTokens.state.ahead.dot,
    badge: 'bg-emerald-500',
    background: ColorTokens.state.ahead.background,
    icon: '🚀',
    label: '領先',
  },
  onTrack: {
    bar: ColorTokens.state.onTrack.bar,
    dot: ColorTokens.state.onTrack.dot,
    badge: 'bg-blue-500',
    background: ColorTokens.state.onTrack.background,
    icon: '✅',
    label: '進度正常',
  },
  behind: {
    bar: ColorTokens.state.behind.bar,
    dot: ColorTokens.state.behind.dot,
    badge: 'bg-orange-500',
    background: ColorTokens.state.behind.background,
    icon: '⏰',
    label: '落後',
  },
};

/**
 * 計算狀態
 */
function getStatus(targetAge: number, estimatedAge: number): GPSStatus {
  const diff = targetAge - estimatedAge;
  if (diff > 0.001) return 'ahead';
  if (diff < -0.001) return 'behind';
  return 'onTrack';
}

/**
 * 格式化年齡差距
 */
function formatAgeDiff(diff: number): { value: string; unit: string } {
  const absDiff = Math.abs(diff);
  const days = Math.round(absDiff * 365);

  if (days < 30) {
    return { value: days.toString(), unit: '天' };
  } else if (days < 365) {
    return { value: (absDiff * 12).toFixed(1), unit: '個月' };
  } else {
    return { value: absDiff.toFixed(1), unit: '年' };
  }
}

/**
 * 退休進度條組件
 */
export function RetirementProgress({
  targetAge,
  estimatedAge,
  currentAge,
  totalSavedHours = 0,
  totalSpentHours = 0,
  onDetailClick,
  showDetail = false,
  onCloseDetail,
  targetAccumulatedSavings,
  actualAccumulatedSavings,
  monthsElapsed,
  deviation,
  deviationDays,
  requiredMonthlySavings,
}: RetirementProgressProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const status = getStatus(targetAge, estimatedAge);
  const config = stateConfig[status];
  const ageDiff = targetAge - estimatedAge;
  const formattedDiff = formatAgeDiff(ageDiff);

  // 計算進度條位置
  const targetPosition = 60; // 目標在 60% 位置
  const diffYears = estimatedAge - targetAge;
  const estimatedPosition = Math.max(10, Math.min(90, targetPosition - diffYears * 5));

  // 軌跡偏差天數（正=超前，負=落後）
  const netDays = deviationDays ?? 0;

  // 計算進度百分比（用於累積儲蓄進度條）
  const progressPercentage = targetAccumulatedSavings && actualAccumulatedSavings
    ? Math.min(100, Math.max(0, (actualAccumulatedSavings / targetAccumulatedSavings) * 100))
    : 0;

  return (
    <div
      className="retirement-progress"
      style={{ backgroundColor: config.background }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onDetailClick}
      role="button"
      tabIndex={0}
      aria-label="退休進度追蹤"
    >
      {/* 標題 */}
      <div className="retirement-progress__header">
        <span className="retirement-progress__title">🎯 退休目標進度</span>
        {isHovered && (
          <span className="retirement-progress__hint">點擊查看詳情</span>
        )}
      </div>

      {/* 進度條 */}
      <div className="retirement-progress__bar-container">
        {/* 目標標籤 - 上方 */}
        <div className="retirement-progress__labels-top">
          <div
            className="retirement-progress__label-item"
            style={{ left: `${targetPosition}%` }}
          >
            <span className="retirement-progress__label-text retirement-progress__label-text--target">
              🎯 目標 {targetAge} 歲
            </span>
            <div className="retirement-progress__label-line" />
          </div>
        </div>

        {/* 進度條本體 */}
        <div className="retirement-progress__bar">
          {/* 背景軌道 */}
          <div className="retirement-progress__track" />

          {/* 填充部分 */}
          <div
            className="retirement-progress__fill"
            style={{
              width: `${Math.min(estimatedPosition, targetPosition)}%`,
              backgroundColor: config.bar,
            }}
          />

          {/* 目標位置標記 */}
          <div
            className="retirement-progress__marker retirement-progress__marker--target"
            style={{ left: `${targetPosition}%` }}
          />

          {/* 預估位置標記 */}
          <div
            className="retirement-progress__marker retirement-progress__marker--estimated"
            style={{
              left: `${estimatedPosition}%`,
              backgroundColor: config.dot,
            }}
          />
        </div>

        {/* 預估標籤 - 下方 */}
        <div className="retirement-progress__labels-bottom">
          <div
            className="retirement-progress__label-item"
            style={{ left: `${estimatedPosition}%` }}
          >
            <div className="retirement-progress__label-line retirement-progress__label-line--bottom" />
            <span
              className="retirement-progress__label-text retirement-progress__label-text--estimated"
              style={{ color: config.bar }}
            >
              預估 {estimatedAge.toFixed(1)} 歲
            </span>
          </div>
        </div>
      </div>

      {/* 狀態徽章 */}
      <div className="retirement-progress__badge-container">
        <span
          className={`retirement-progress__badge ${config.badge}`}
          style={{ backgroundColor: config.bar }}
        >
          {config.icon} {config.label} {formattedDiff.value} {formattedDiff.unit}
        </span>
        <span className="text-sm text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">
          點擊查看詳情 →
        </span>
      </div>

      {/* 累積儲蓄進度條 - 追蹤期過短時顯示提示 */}
      {monthsElapsed !== undefined && monthsElapsed < 0.5 ? (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            📊 開始追蹤退休目標...
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            持續記錄 2 週後，這裡會顯示累積儲蓄進度
          </p>
        </div>
      ) : targetAccumulatedSavings && actualAccumulatedSavings && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            📊 累積儲蓄進度
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full flex items-center justify-end pr-3 text-sm font-medium text-white transition-all duration-500 ${
                status === 'ahead'
                  ? 'bg-emerald-500'
                  : status === 'behind'
                  ? 'bg-orange-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage > 10 && `${Math.round(progressPercentage)}%`}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>目標: {(targetAccumulatedSavings / 10000).toFixed(1)}萬</span>
            <span>實際: {(actualAccumulatedSavings / 10000).toFixed(1)}萬</span>
          </div>
        </div>
      )}

      {/* 展開/收起詳情 - 只在追蹤期足夠時顯示 */}
      {monthsElapsed !== undefined && monthsElapsed >= 0.5 && targetAccumulatedSavings && actualAccumulatedSavings && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            {isExpanded ? '收起 ▲' : '查看詳情 ▼'}
          </button>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  📊 累積進度（使用 {Math.round(monthsElapsed * 10) / 10} 個月）
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">• 目標儲蓄：</span>
                    <span className="font-medium">
                      {Formatters.formatCurrency(targetAccumulatedSavings)} 元
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">• 實際儲蓄：</span>
                    <span
                      className={`font-medium ${
                        status === 'ahead'
                          ? 'text-emerald-500'
                          : status === 'behind'
                          ? 'text-orange-500'
                          : ''
                      }`}
                    >
                      {Formatters.formatCurrency(actualAccumulatedSavings)} 元{' '}
                      {status === 'ahead' && '✓'}
                    </span>
                  </li>
                  {deviation !== undefined && (
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">• 差距：</span>
                      <span
                        className={`font-medium ${
                          deviation > 0 ? 'text-emerald-500' : 'text-orange-500'
                        }`}
                      >
                        {deviation > 0 ? '+' : ''}
                        {Formatters.formatCurrency(Math.abs(deviation))} 元
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {requiredMonthlySavings !== undefined && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    💰 每月必須儲蓄：
                  </p>
                  <p className="text-base font-semibold">
                    {Formatters.formatCurrency(requiredMonthlySavings)} 元
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡{' '}
                  {status === 'ahead'
                    ? '你已經存夠這階段需要的金額！'
                    : status === 'behind'
                    ? '需要加快儲蓄速度以達成目標。'
                    : '保持當前儲蓄速度即可達標。'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 詳情彈窗 - 使用 Portal 渲染到 body 層級 */}
      {showDetail && createPortal( // 3. 使用 Portal 渲染彈窗
        <div
          className="retirement-progress__detail-overlay"
          onClick={onCloseDetail} // 2. 修正彈窗點擊事件邏輯
        >
          <div
            className="retirement-progress__detail"
            onClick={(e) => e.stopPropagation()} // 2. 修正彈窗點擊事件邏輯
          >
            <div className="retirement-progress__detail-header">
              <h3>退休 GPS 分析</h3>
              <button
                className="retirement-progress__detail-close"
                onClick={onCloseDetail}
                aria-label="關閉"
              >
                ✕
              </button>
            </div>

            <div className="retirement-progress__detail-content">
              <div className="retirement-progress__detail-row">
                <span>目標退休年齡</span>
                <span className="retirement-progress__detail-value">{targetAge} 歲</span>
              </div>
              <div className="retirement-progress__detail-row">
                <span>目前預估</span>
                <span className="retirement-progress__detail-value">{estimatedAge.toFixed(1)} 歲</span>
              </div>

              <div className="retirement-progress__detail-divider" />

              <div className="retirement-progress__detail-section">
                <h4>軌跡偏差</h4>
                {targetAccumulatedSavings !== undefined && actualAccumulatedSavings !== undefined && (
                  <>
                    <div className="retirement-progress__detail-row">
                      <span>• 目標儲蓄</span>
                      <span className="retirement-progress__detail-value">
                        {Formatters.formatCurrency(targetAccumulatedSavings)} 元
                      </span>
                    </div>
                    <div className="retirement-progress__detail-row">
                      <span>• 實際儲蓄</span>
                      <span className={`retirement-progress__detail-value ${netDays >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {Formatters.formatCurrency(actualAccumulatedSavings)} 元 {netDays >= 0 ? '✅' : '⚠️'}
                      </span>
                    </div>
                  </>
                )}
                <div className="retirement-progress__detail-row retirement-progress__detail-row--highlight">
                  <span>• 等效時間</span>
                  <span className={`retirement-progress__detail-value ${netDays >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {netDays >= 0 ? '+' : ''}{Math.round(netDays)} 天 {netDays >= 0 ? '🎉' : '⏰'}
                  </span>
                </div>
              </div>

              <div className="retirement-progress__detail-summary">
                {netDays > 8 && (
                  <p>🎉 你已超前 {Math.abs(Math.round(netDays))} 天，可以提早退休！</p>
                )}
                {netDays < -8 && (
                  <p>⏰ 目前落後 {Math.abs(Math.round(netDays))} 天，繼續努力！</p>
                )}
                {netDays >= -8 && netDays <= 8 && (
                  <p>✅ 進度正常，繼續保持！</p>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default RetirementProgress;
