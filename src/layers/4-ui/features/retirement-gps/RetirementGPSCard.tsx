/**
 * TimeBar - 退休 GPS 卡片
 * Layer 4 (UI Layer) - 功能組件
 * 
 * 顯示「預估退休年齡」vs「目標退休年齡」的偏差
 * 專注於「時間成本」視角的退休追蹤
 */

import type { GPSStatus } from '@domain/types';
import './RetirementGPSCard.css';

export interface RetirementGPSCardProps {
  /** 目標退休年齡 */
  targetAge: number;
  /** 預估退休年齡 */
  estimatedAge: number;
  /** GPS 狀態 */
  status: GPSStatus;
  /** 點擊時的回調 */
  onClick?: () => void;
}

/**
 * 狀態配置
 */
const statusConfig = {
  ahead: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    icon: '🚀',
    label: '領先目標',
  },
  onTrack: {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    icon: '✅',
    label: '準時達標',
  },
  behind: {
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
    icon: '⏰',
    label: '需要加速',
  },
};

/**
 * 格式化年齡差距為可讀字串
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
 * 退休 GPS 卡片組件
 */
export function RetirementGPSCard({
  targetAge,
  estimatedAge,
  status,
  onClick,
}: RetirementGPSCardProps) {
  const config = statusConfig[status];
  const ageDiff = targetAge - estimatedAge;
  const formattedDiff = formatAgeDiff(ageDiff);
  const isAhead = ageDiff > 0.001;

  // 計算進度條位置
  const targetPosition = 60;
  const diffYears = estimatedAge - targetAge;
  const estimatedPosition = Math.max(10, Math.min(90, targetPosition - diffYears * 5));

  return (
    <div
      className="gps-card"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {/* Header */}
      <div className="gps-card__header">
        <span className="gps-card__title">🎯 退休 GPS</span>
        <span className="gps-card__hint">預估退休時間</span>
      </div>

      {/* 主要指標 */}
      <div className="gps-card__main-metric">
        <span className="gps-card__icon">{config.icon}</span>
        <span
          className="gps-card__value"
          style={{ color: config.color }}
        >
          {isAhead ? '提早 ' : status === 'onTrack' ? '' : '延後 '}
          {formattedDiff.value} {formattedDiff.unit}
        </span>
      </div>

      {/* 進度條視覺化 */}
      <div className="gps-card__progress-container">
        {/* 目標標籤 */}
        <div className="gps-card__labels">
          <div
            className="gps-card__label gps-card__label--target"
            style={{ left: `${targetPosition}%` }}
          >
            <span className="gps-card__label-text">🎯 {targetAge}歲</span>
            <div className="gps-card__label-line" />
          </div>
        </div>

        {/* 進度條 */}
        <div className="gps-card__track">
          <div
            className="gps-card__fill"
            style={{
              width: `${Math.min(estimatedPosition, targetPosition)}%`,
              backgroundColor: config.color,
            }}
          />
          {/* 目標點 */}
          <div
            className="gps-card__marker gps-card__marker--target"
            style={{ left: `${targetPosition}%` }}
          />
          {/* 預估點 */}
          <div
            className="gps-card__marker gps-card__marker--estimated"
            style={{
              left: `${estimatedPosition}%`,
              backgroundColor: config.color,
            }}
          />
        </div>

        {/* 預估標籤 */}
        <div className="gps-card__labels gps-card__labels--bottom">
          <div
            className="gps-card__label"
            style={{ left: `${estimatedPosition}%` }}
          >
            <div className="gps-card__label-line" />
            <span
              className="gps-card__label-text"
              style={{ color: config.color }}
            >
              📍 {estimatedAge.toFixed(1)}歲
            </span>
          </div>
        </div>
      </div>

      {/* 狀態說明 */}
      <div
        className="gps-card__status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </div>
    </div>
  );
}

export default RetirementGPSCard;
