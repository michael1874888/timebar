import { useMemo } from 'react';

interface RetirementProgressProps {
  currentAge: number;
  targetAge: number;
  estimatedAge: number;
}

/**
 * RetirementProgress - 退休進度條組件
 *
 * 設計理念：
 * - 使用進度條而非電池隱喻，降低學習成本
 * - 一眼看出領先/落後狀態
 * - 簡潔的視覺呈現，聚焦核心資訊
 */
export function RetirementProgress({
  currentAge,
  targetAge,
  estimatedAge
}: RetirementProgressProps) {
  // 計算狀態
  const status = useMemo(() => {
    const diff = estimatedAge - targetAge;
    if (Math.abs(diff) < 0.01) return 'onTrack';
    return diff > 0 ? 'behind' : 'ahead';
  }, [targetAge, estimatedAge]);

  // 計算差距（年）
  const yearsDiff = useMemo(() => {
    return Math.abs(estimatedAge - targetAge);
  }, [targetAge, estimatedAge]);

  // 計算進度條位置百分比
  const progressPositions = useMemo(() => {
    // 使用當前年齡到目標年齡+10年作為範圍
    const rangeStart = currentAge;
    const rangeEnd = targetAge + 10;
    const totalRange = rangeEnd - rangeStart;

    // 計算目標年齡位置（百分比）
    const targetPosition = ((targetAge - rangeStart) / totalRange) * 100;

    // 計算預估年齡位置（百分比）
    const estimatedPosition = ((estimatedAge - rangeStart) / totalRange) * 100;

    return {
      target: Math.max(0, Math.min(100, targetPosition)),
      estimated: Math.max(0, Math.min(100, estimatedPosition))
    };
  }, [currentAge, targetAge, estimatedAge]);

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* 標題與狀態 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-white font-bold text-base">退休目標進度</span>
        </div>

        {/* 狀態標籤 */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-500 ${
          status === 'ahead' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
          status === 'behind' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
          'bg-blue-500/20 text-blue-300 border border-blue-500/40'
        }`}>
          {status === 'ahead' && (
            <>
              <span className="text-lg">🚀</span>
              <span>領先 {yearsDiff.toFixed(1)} 年</span>
            </>
          )}
          {status === 'behind' && (
            <>
              <span className="text-lg animate-pulse">⏰</span>
              <span>落後 {yearsDiff.toFixed(1)} 年</span>
            </>
          )}
          {status === 'onTrack' && (
            <>
              <span className="text-lg">✅</span>
              <span>準時達標</span>
            </>
          )}
        </div>
      </div>

      {/* 進度條視覺化 */}
      <div className="relative mb-6">
        {/* 背景軌道 */}
        <div className="relative h-4 rounded-full overflow-hidden bg-gray-950/80 border border-gray-700">
          {/* 進度填充 - 從起點到預估年齡 */}
          <div
            className={`absolute h-full transition-all duration-700 ${
              status === 'ahead' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' :
              status === 'behind' ? 'bg-gradient-to-r from-orange-600 to-orange-500' :
              'bg-gradient-to-r from-blue-600 to-blue-500'
            }`}
            style={{ width: `${progressPositions.estimated}%` }}
          />

          {/* 光澤效果 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        </div>

        {/* 目標年齡標記 */}
        <div
          className="absolute top-0 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${progressPositions.target}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-white flex items-center justify-center shadow-lg">
              <span className="text-xs">🎯</span>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs text-gray-400">目標</div>
              <div className="text-sm font-bold text-white">{targetAge}歲</div>
            </div>
          </div>
        </div>

        {/* 預估年齡標記 */}
        <div
          className="absolute top-0 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${progressPositions.estimated}%` }}
        >
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-500 ${
              status === 'ahead' ? 'bg-emerald-500 border-emerald-300' :
              status === 'behind' ? 'bg-orange-500 border-orange-300' :
              'bg-blue-500 border-blue-300'
            }`}>
              <span className="text-xs">📍</span>
            </div>
            <div className="mt-2 text-center">
              <div className={`text-xs transition-colors ${
                status === 'ahead' ? 'text-emerald-400' :
                status === 'behind' ? 'text-orange-400' :
                'text-blue-400'
              }`}>
                預估
              </div>
              <div className={`text-sm font-bold transition-colors ${
                status === 'ahead' ? 'text-emerald-400' :
                status === 'behind' ? 'text-orange-400' :
                'text-blue-400'
              }`}>
                {estimatedAge.toFixed(1)}歲
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部說明文字 */}
      <div className="mt-16 pt-4 border-t border-gray-700/50">
        <div className="text-center">
          {status === 'ahead' && (
            <p className="text-sm text-emerald-400">
              太棒了！你的財務決策讓你可以提早 {yearsDiff.toFixed(1)} 年退休 🎉
            </p>
          )}
          {status === 'behind' && (
            <p className="text-sm text-orange-400">
              目前會延後 {yearsDiff.toFixed(1)} 年退休，但別擔心，每個省下的決定都有幫助！
            </p>
          )}
          {status === 'onTrack' && (
            <p className="text-sm text-blue-400">
              完美！你正朝著目標穩定前進 👍
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
