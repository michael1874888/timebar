import { useEffect } from 'react';
import { Formatters } from '@/utils/financeCalc';
import { getMotivationalQuote } from '@/utils/helpers';
import { Milestone } from '@/types';

const { formatCurrencyFull } = Formatters;

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAmount: number;
  savedHours: number;
  newMilestone?: Milestone;
  // v2.0: 可選的儲蓄確認
  showSaveOption?: boolean;
  onConfirmSave?: () => void;
}

export function CelebrationModal({
  isOpen,
  onClose,
  savedAmount,
  savedHours,
  newMilestone,
  showSaveOption = false,
  onConfirmSave
}: CelebrationModalProps) {
  // 自動關閉（如果有 showSaveOption 則不自動關閉）
  useEffect(() => {
    if (isOpen && !showSaveOption) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, showSaveOption]);

  if (!isOpen) return null;

  // 格式化時間
  const formatSavedTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} 分鐘`;
    }
    if (hours < 8) {
      return `${Math.round(hours * 10) / 10} 小時`;
    }
    const days = hours / 8;
    if (days < 7) {
      return `${Math.round(days * 10) / 10} 天`;
    }
    if (days < 30) {
      return `${Math.round(days / 7 * 10) / 10} 週`;
    }
    return `${Math.round(days / 30 * 10) / 10} 個月`;
  };

  const handleConfirmSave = () => {
    onConfirmSave?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-emerald-900/90 to-teal-900/90 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 animate-scale-up">
        {/* 頂部裝飾 */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl animate-bounce-slow">
          🎉
        </div>

        <div className="text-center pt-4">
          {/* 主標題 */}
          <h2 className="text-3xl font-black text-white mb-2">太棒了！</h2>

          {/* 省下金額 */}
          <div className="mb-4">
            <div className="text-emerald-300 text-sm mb-1">你決定不買，守住了</div>
            <div className="text-4xl font-black text-emerald-400">
              {formatCurrencyFull(savedAmount)}
            </div>
          </div>

          {/* 贏回時間 */}
          <div className="bg-emerald-500/20 rounded-2xl p-4 mb-4">
            <div className="text-emerald-300 text-sm mb-1">這代表你贏回了</div>
            <div className="text-2xl font-bold text-white">
              {formatSavedTime(savedHours)} 的自由
            </div>
          </div>

          {/* 新里程碑 */}
          {newMilestone && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-4 animate-pulse">
              <div className="text-yellow-300 text-sm mb-1">🏆 解鎖新成就！</div>
              <div className="text-xl font-bold text-yellow-400">
                {newMilestone.icon} {newMilestone.name}
              </div>
            </div>
          )}

          {/* 激勵語句 */}
          <div className="text-gray-300 text-sm italic mb-4">
            {getMotivationalQuote()}
          </div>

          {/* v2.0: 儲蓄確認按鈕區 */}
          {showSaveOption ? (
            <div className="space-y-2">
              <button
                onClick={handleConfirmSave}
                className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>💰</span>
                <span>把這筆錢存下來</span>
              </button>
              <button
                onClick={onClose}
                className="w-full px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-medium rounded-xl transition-all"
              >
                繼續加油 💪
              </button>
              <div className="text-gray-500 text-xs mt-2">
                選擇「存下來」會將這筆金額記入儲蓄紀錄
              </div>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold rounded-xl transition-all"
            >
              繼續加油 💪
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

