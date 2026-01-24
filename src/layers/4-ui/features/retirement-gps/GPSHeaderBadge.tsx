/**
 * TimeBar - GPS Header Badge (狀態膠囊)
 * Layer 4 (UI Layer) - 功能組件
 *
 * 在 Header 中央顯示退休進度狀態
 * 點擊可展開詳細 Modal
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GPSStatus } from '@domain/types';
import './GPSHeaderBadge.css';

export interface GPSHeaderBadgeProps {
  /** 目標退休年齡 */
  targetAge: number;
  /** 預估退休年齡 */
  estimatedAge: number;
  /** GPS 狀態 */
  status: GPSStatus;
}

/**
 * 狀態配置
 */
const statusConfig = {
  ahead: {
    bgColor: '#10b981',
    textColor: '#ffffff',
    icon: '🚀',
  },
  onTrack: {
    bgColor: '#3b82f6',
    textColor: '#ffffff',
    icon: '✅',
  },
  behind: {
    bgColor: '#f97316',
    textColor: '#ffffff',
    icon: '⏰',
  },
};

/**
 * 格式化年齡差距
 */
function formatAgeDiff(diff: number): string {
  const absDiff = Math.abs(diff);
  const days = Math.round(absDiff * 365);

  if (days < 30) {
    return `${days}天`;
  } else if (days < 365) {
    return `${(absDiff * 12).toFixed(0)}個月`;
  } else {
    return `${absDiff.toFixed(1)}年`;
  }
}

/**
 * GPS Header Badge 組件
 */
export function GPSHeaderBadge({
  targetAge,
  estimatedAge,
  status,
}: GPSHeaderBadgeProps) {
  const [showDetail, setShowDetail] = useState(false);

  const config = statusConfig[status];
  const ageDiff = Math.abs(targetAge - estimatedAge);
  const diffText = formatAgeDiff(ageDiff);
  
  // 使用傳入的 status 統一決定顯示邏輯，避免不一致
  const isOnTrack = status === 'onTrack';
  const isAhead = status === 'ahead';

  return (
    <>
      <button
        className="gps-badge"
        style={{ backgroundColor: config.bgColor, color: config.textColor }}
        onClick={() => setShowDetail(true)}
        aria-label="查看退休進度詳情"
      >
        <span className="gps-badge__icon">{config.icon}</span>
        <span className="gps-badge__text">
          {isOnTrack ? '' : isAhead ? '+' : '-'}
          {diffText}
        </span>
      </button>

      {/* 詳情彈窗 */}
      {showDetail &&
        createPortal(
          <div
            className="gps-badge__modal-overlay"
            onClick={() => setShowDetail(false)}
          >
            <div
              className="gps-badge__modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="gps-badge__modal-header">
                <h3>🎯 退休 GPS 詳情</h3>
                <button
                  className="gps-badge__modal-close"
                  onClick={() => setShowDetail(false)}
                >
                  ✕
                </button>
              </div>
              <div className="gps-badge__modal-content">
                {/* 主要數據 */}
                <div className="gps-badge__modal-hero">
                  <span className="gps-badge__modal-icon">{config.icon}</span>
                  <span
                    className="gps-badge__modal-value"
                    style={{ color: config.bgColor }}
                  >
                    {isOnTrack ? '準時達標' : isAhead ? `提早 ${diffText}` : `延後 ${diffText}`}
                  </span>
                </div>

                {/* 詳細資訊 */}
                <div className="gps-badge__modal-details">
                  <div className="gps-badge__modal-row">
                    <span>🎯 目標退休年齡</span>
                    <span className="gps-badge__modal-row-value">{targetAge} 歲</span>
                  </div>
                  <div className="gps-badge__modal-row">
                    <span>📍 預估退休年齡</span>
                    <span
                      className="gps-badge__modal-row-value"
                      style={{ color: config.bgColor }}
                    >
                      {estimatedAge.toFixed(1)} 歲
                    </span>
                  </div>
                </div>

                {/* 說明 */}
                <div
                  className="gps-badge__modal-note"
                  style={{ backgroundColor: `${config.bgColor}15` }}
                >
                  <p>
                    {status === 'ahead'
                      ? '🎉 你的儲蓄進度很棒！繼續保持就能提早達成財務自由。'
                      : status === 'behind'
                      ? '💪 稍微落後，但還有機會追上！試著減少非必要支出或增加儲蓄。'
                      : '👍 你的進度剛好符合目標，保持現狀即可。'}
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default GPSHeaderBadge;
