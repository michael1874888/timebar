/**
 * TimeBar - 退休進度條組件
 * Layer 4 (UI Layer) - 功能組件
 *
 * 替換原有的 Life Battery，以更直觀的進度條顯示退休目標追蹤
 */

import { useState } from 'react';
import { ColorTokens } from '@ui/design-system/tokens';
import type { GPSStatus } from '@domain/types';
import { TimeCalculator } from '@domain/calculators';
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
}: RetirementProgressProps) {
  const [isHovered, setIsHovered] = useState(false);

  const status = getStatus(targetAge, estimatedAge);
  const config = stateConfig[status];
  const ageDiff = targetAge - estimatedAge;
  const formattedDiff = formatAgeDiff(ageDiff);

  // 計算進度條位置
  const targetPosition = 60; // 目標在 60% 位置
  const diffYears = estimatedAge - targetAge;
  const estimatedPosition = Math.max(10, Math.min(90, targetPosition - diffYears * 5));

  // 計算天數
  const savedDays = Math.round(totalSavedHours / 8);
  const spentDays = Math.round(totalSpentHours / 8);
  const netDays = savedDays - spentDays;

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
      </div>

      {/* 詳情彈窗 */}
      {showDetail && (
        <div className="retirement-progress__detail-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="retirement-progress__detail">
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
                <h4>累積影響</h4>
                <div className="retirement-progress__detail-row">
                  <span>• 總共省下</span>
                  <span className="retirement-progress__detail-value text-emerald-500">
                    {savedDays} 天 ✅
                  </span>
                </div>
                <div className="retirement-progress__detail-row">
                  <span>• 總共花掉</span>
                  <span className="retirement-progress__detail-value text-orange-500">
                    {spentDays} 天 ⚠️
                  </span>
                </div>
                <div className="retirement-progress__detail-row retirement-progress__detail-row--highlight">
                  <span>• 淨值</span>
                  <span className={`retirement-progress__detail-value ${netDays >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {netDays >= 0 ? '+' : ''}{netDays} 天 {netDays >= 0 ? '🎉' : '⏰'}
                  </span>
                </div>
              </div>

              <div className="retirement-progress__detail-summary">
                {status === 'ahead' && (
                  <p>🎉 這表示你可以提早 {formattedDiff.value} {formattedDiff.unit}退休！</p>
                )}
                {status === 'behind' && (
                  <p>⏰ 目前落後 {formattedDiff.value} {formattedDiff.unit}，繼續努力！</p>
                )}
                {status === 'onTrack' && (
                  <p>✅ 進度正常，繼續保持！</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RetirementProgress;
