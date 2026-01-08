/**
 * TimeBar - 慶祝效果組件
 * 克制消費時顯示的彩帶動畫
 */

import { useEffect, useState } from 'react';
import './Celebration.css';

export interface CelebrationProps {
  /** 是否顯示 */
  show: boolean;
  /** 關閉回調 */
  onClose: () => void;
  /** 省下的金額 */
  amount: number;
  /** 省下的時間 (天) */
  timeSavedDays: number;
  /** 選擇不記錄 */
  onSkip?: () => void;
  /** 選擇記為儲蓄 */
  onSave?: () => void;
}

/**
 * 生成隨機彩帶
 */
function generateConfetti(count: number) {
  const colors = ['#10b981', '#34d399', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
  const confetti = [];

  for (let i = 0; i < count; i++) {
    confetti.push({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
    });
  }

  return confetti;
}

/**
 * 慶祝效果組件
 */
export function Celebration({
  show,
  onClose,
  amount,
  timeSavedDays,
  onSkip,
  onSave,
}: CelebrationProps) {
  const [confetti, setConfetti] = useState<ReturnType<typeof generateConfetti>>([]);

  useEffect(() => {
    if (show) {
      setConfetti(generateConfetti(50));
    }
  }, [show]);

  if (!show) return null;

  const handleSave = () => {
    onSave?.();
    onClose();
  };

  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  return (
    <div className="celebration-overlay" onClick={handleSkip}>
      {/* 彩帶 */}
      <div className="celebration-confetti">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="celebration-confetti-piece"
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              backgroundColor: c.color,
              width: c.size,
              height: c.size * 0.4,
              transform: `rotate(${c.rotation}deg)`,
            }}
          />
        ))}
      </div>

      {/* 內容 */}
      <div className="celebration-content" onClick={(e) => e.stopPropagation()}>
        <div className="celebration-emoji">🎉</div>

        <h2 className="celebration-title">太棒了！</h2>

        <div className="celebration-stats">
          <div className="celebration-amount">
            省下 ${amount.toLocaleString()}
          </div>
          <div className="celebration-time">
            = {timeSavedDays.toFixed(1)} 天的自由
          </div>
        </div>

        <p className="celebration-message">
          退休後的你會感謝現在的決定 🙏
        </p>

        <div className="celebration-actions">
          <button className="celebration-btn celebration-btn--skip" onClick={handleSkip}>
            不記錄
          </button>
          <button className="celebration-btn celebration-btn--save" onClick={handleSave}>
            💰 記為儲蓄
          </button>
        </div>
      </div>
    </div>
  );
}

export default Celebration;
