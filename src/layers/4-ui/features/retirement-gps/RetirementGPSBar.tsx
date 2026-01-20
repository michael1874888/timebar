/**
 * TimeBar - 退休 GPS 狀態列（精簡版）
 * Layer 4 (UI Layer) - 功能組件
 *
 * 在頁面頂部顯示退休進度的精簡狀態
 * 點擊可展開查看詳細資訊
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GPSStatus } from '@domain/types';
import './RetirementGPSBar.css';

export interface RetirementGPSBarProps {
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
    bgColor: '#ecfdf5', // emerald-50
    textColor: '#059669', // emerald-600
    icon: '🚀',
    label: '領先',
  },
  onTrack: {
    bgColor: '#eff6ff', // blue-50
    textColor: '#2563eb', // blue-600
    icon: '✅',
    label: '準時',
  },
  behind: {
    bgColor: '#fff7ed', // orange-50
    textColor: '#ea580c', // orange-600
    icon: '⏰',
    label: '落後',
  },
};

/**
 * 格式化年齡差距
 */
function formatAgeDiff(diff: number): string {
  const absDiff = Math.abs(diff);
  const days = Math.round(absDiff * 365);

  if (days < 30) {
    return `${days} 天`;
  } else if (days < 365) {
    return `${(absDiff * 12).toFixed(1)} 個月`;
  } else {
    return `${absDiff.toFixed(1)} 年`;
  }
}

/**
 * 退休 GPS 狀態列組件
 */
export function RetirementGPSBar({
  targetAge,
  estimatedAge,
  status,
}: RetirementGPSBarProps) {
  const [showDetail, setShowDetail] = useState(false);

  const config = statusConfig[status];
  const ageDiff = targetAge - estimatedAge;
  const isAhead = ageDiff > 0.001;
  const diffText = formatAgeDiff(ageDiff);

  return (
    <>
      <div
        className="gps-bar"
        style={{ backgroundColor: config.bgColor }}
        onClick={() => setShowDetail(true)}
        role="button"
        tabIndex={0}
        aria-label="點擊查看退休進度詳情"
      >
        {/* 左側：狀態 */}
        <div className="gps-bar__status">
          <span className="gps-bar__icon">{config.icon}</span>
          <span
            className="gps-bar__text"
            style={{ color: config.textColor }}
          >
            {isAhead ? '提早 ' : status === 'onTrack' ? '' : '延後 '}
            <strong>{diffText}</strong>
          </span>
        </div>

        {/* 右側：預估年齡 + 展開圖標 */}
        <div className="gps-bar__info">
          <span className="gps-bar__age">
            預估 {estimatedAge.toFixed(1)} 歲退休
          </span>
          <span className="gps-bar__chevron">›</span>
        </div>
      </div>

      {/* 詳情彈窗 */}
      {showDetail &&
        createPortal(
          <div
            className="gps-bar__modal-overlay"
            onClick={() => setShowDetail(false)}
          >
            <div
              className="gps-bar__modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="gps-bar__modal-header">
                <h3>🎯 退休 GPS 詳情</h3>
                <button
                  className="gps-bar__modal-close"
                  onClick={() => setShowDetail(false)}
                >
                  ✕
                </button>
              </div>
              <div className="gps-bar__modal-content">
                {/* 主要數據 */}
                <div className="gps-bar__modal-hero">
                  <span className="gps-bar__modal-icon">{config.icon}</span>
                  <span
                    className="gps-bar__modal-value"
                    style={{ color: config.textColor }}
                  >
                    {isAhead ? '提早 ' : status === 'onTrack' ? '' : '延後 '}
                    {diffText}
                  </span>
                </div>

                {/* 詳細資訊 */}
                <div className="gps-bar__modal-details">
                  <div className="gps-bar__modal-row">
                    <span>🎯 目標退休年齡</span>
                    <span className="gps-bar__modal-row-value">{targetAge} 歲</span>
                  </div>
                  <div className="gps-bar__modal-row">
                    <span>📍 預估退休年齡</span>
                    <span
                      className="gps-bar__modal-row-value"
                      style={{ color: config.textColor }}
                    >
                      {estimatedAge.toFixed(1)} 歲
                    </span>
                  </div>
                </div>

                {/* 說明 */}
                <div
                  className="gps-bar__modal-note"
                  style={{ backgroundColor: config.bgColor }}
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

export default RetirementGPSBar;
