/**
 * TimeBar - 儲蓄進度卡片
 * Layer 4 (UI Layer) - 功能組件
 * 
 * 顯示「實際累積儲蓄」vs「目標累積儲蓄」的進度
 * 專注於「金錢」視角的儲蓄追蹤
 */

import { useState } from 'react';
import { Formatters } from '@/utils/financeCalc';
import './SavingsProgressCard.css';

export interface SavingsProgressCardProps {
  /** 目標累積儲蓄金額 */
  targetAccumulatedSavings: number;
  /** 實際累積儲蓄金額 */
  actualAccumulatedSavings: number;
  /** 偏差金額（正=超前，負=落後） */
  deviation: number;
  /** 經過的月數 */
  monthsElapsed: number;
  /** 經過的完整週數 */
  weeksElapsed: number;
  /** 每月儲蓄目標 */
  monthlySavings: number;
  /** 每月必須儲蓄金額 */
  requiredMonthlySavings?: number;
  /** 未分配資金 */
  unallocatedFunds?: number;
  /** 轉存儲蓄的回調 */
  onConvertToSavings?: (amount: number) => void;
}

/**
 * 根據偏差判斷狀態
 */
function getStatus(deviation: number): 'ahead' | 'onTrack' | 'behind' {
  if (deviation > 100) return 'ahead';
  if (deviation < -100) return 'behind';
  return 'onTrack';
}

/**
 * 狀態配置
 */
const statusConfig = {
  ahead: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    progressBg: '#10b981',
    icon: '✨',
    message: '你已經存夠這階段需要的金額！',
  },
  onTrack: {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    progressBg: '#3b82f6',
    icon: '👍',
    message: '保持當前儲蓄速度即可達標。',
  },
  behind: {
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
    progressBg: '#f97316',
    icon: '💪',
    message: '需要加快儲蓄速度以達成目標。',
  },
};

/**
 * 儲蓄進度卡片組件
 */
export function SavingsProgressCard({
  targetAccumulatedSavings,
  actualAccumulatedSavings,
  deviation,
  monthsElapsed,
  weeksElapsed,
  monthlySavings,
  requiredMonthlySavings,
  unallocatedFunds,
  onConvertToSavings,
}: SavingsProgressCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  
  const status = getStatus(deviation);
  const config = statusConfig[status];

  // 計算進度百分比
  const progressPercentage = targetAccumulatedSavings > 0
    ? Math.min(100, Math.max(0, (actualAccumulatedSavings / targetAccumulatedSavings) * 100))
    : actualAccumulatedSavings > 0 ? 100 : 0;

  // 如果追蹤期太短，顯示提示
  const isTooEarly = monthsElapsed < 0.5 && !import.meta.env.DEV;

  if (isTooEarly) {
    return (
      <div className="savings-card savings-card--early">
        <div className="savings-card__header">
          <span className="savings-card__title">💰 累積儲蓄進度</span>
        </div>
        <div className="savings-card__early-message">
          <span className="savings-card__early-icon">📊</span>
          <div>
            <p className="savings-card__early-title">開始追蹤退休目標...</p>
            <p className="savings-card__early-subtitle">持續記錄 2 週後，這裡會顯示累積儲蓄進度</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="savings-card"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      {/* Header */}
      <div className="savings-card__header">
        <span className="savings-card__title">💰 累積儲蓄進度</span>
        {monthsElapsed < 0.5 && import.meta.env.DEV && (
          <span className="savings-card__dev-badge">DEV</span>
        )}
      </div>

      {/* 進度條 */}
      <div className="savings-card__progress-wrapper">
        <div className="savings-card__progress-track">
          <div
            className="savings-card__progress-fill"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: config.progressBg,
            }}
          >
            {progressPercentage > 15 && (
              <span className="savings-card__progress-text">
                {Math.round(progressPercentage)}%
              </span>
            )}
          </div>
        </div>
        <div className="savings-card__progress-labels">
          <span>目標: {(targetAccumulatedSavings / 10000).toFixed(1)}萬</span>
          <span style={{ color: config.color, fontWeight: 500 }}>
            實際: {(actualAccumulatedSavings / 10000).toFixed(1)}萬
          </span>
        </div>
      </div>

      {/* 狀態提示 */}
      <div
        className="savings-card__status"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <span className="savings-card__status-icon">{config.icon}</span>
        <span className="savings-card__status-text" style={{ color: config.color }}>
          {config.message}
        </span>
      </div>

      {/* 展開/收起詳情 */}
      <button
        className="savings-card__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '收起 ▲' : '查看詳情 ▼'}
      </button>

      {/* 詳情區塊 */}
      {isExpanded && (
        <div className="savings-card__details">
          <div className="savings-card__detail-header">
            📊 累積進度（使用 {Math.round(monthsElapsed * 10) / 10} 個月）
          </div>
          
          <ul className="savings-card__detail-list">
            <li className="savings-card__detail-row">
              <span className="savings-card__detail-label">
                • 目標儲蓄：
                <button
                  className="savings-card__info-btn"
                  onClick={() => setShowFormula(!showFormula)}
                  aria-label="查看計算公式"
                >
                  ℹ️
                </button>
              </span>
              <span className="savings-card__detail-value">
                {Formatters.formatCurrency(targetAccumulatedSavings)} 元
              </span>
            </li>
            {/* 公式說明 Tooltip */}
            {showFormula && (
              <li className="savings-card__formula-tip">
                <div className="savings-card__formula-content">
                  <strong>📝 計算方式</strong>
                  <p>(每月儲蓄目標 ÷ 4) × (第幾週 + 1)</p>
                  <p className="savings-card__formula-calc">
                    ({Formatters.formatCurrency(monthlySavings)} ÷ 4) × ({weeksElapsed} + 1) = {Formatters.formatCurrency(targetAccumulatedSavings)} 元
                  </p>
                  <p className="savings-card__formula-note">
                    ※ 第 0 週起即有目標，每週更新一次
                  </p>
                </div>
              </li>
            )}
            <li>
              <span>• 實際儲蓄：</span>
              <span
                className="savings-card__detail-value"
                style={{ color: status === 'behind' ? '#f97316' : '#10b981' }}
              >
                {Formatters.formatCurrency(actualAccumulatedSavings)} 元
                {status === 'ahead' && ' ✓'}
              </span>
            </li>
            <li>
              <span>• 差距：</span>
              <span
                className="savings-card__detail-value"
                style={{ color: deviation >= 0 ? '#10b981' : '#f97316' }}
              >
                {deviation >= 0 ? '+' : ''}
                {Formatters.formatCurrency(Math.abs(deviation))} 元
              </span>
            </li>
          </ul>

          {requiredMonthlySavings !== undefined && (
            <div className="savings-card__monthly-target">
              <span className="savings-card__monthly-label">💡 每月目標儲蓄：</span>
              <span className="savings-card__monthly-value">
                {Formatters.formatCurrency(requiredMonthlySavings)} 元
              </span>
            </div>
          )}
        </div>
      )}

      {/* 未分配資金整合區塊 */}
      {unallocatedFunds !== undefined && unallocatedFunds > 0 && (
        <div className="savings-card__unallocated">
          <div className="savings-card__unallocated-info">
            <span className="savings-card__unallocated-icon">💰</span>
            <div className="savings-card__unallocated-text">
              <span className="savings-card__unallocated-label">未分配資金</span>
              <span className="savings-card__unallocated-amount">
                {Formatters.formatCurrency(unallocatedFunds)} 元
              </span>
            </div>
          </div>
          {onConvertToSavings && (
            <button
              className="savings-card__unallocated-btn"
              onClick={() => onConvertToSavings(unallocatedFunds)}
            >
              ⭐ 轉存退休基金
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SavingsProgressCard;
