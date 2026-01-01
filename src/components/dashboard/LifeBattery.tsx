import { useMemo } from 'react';

interface LifeBatteryProps {
  currentAge: number;
  retireAge: number;
  estimatedRetireAge: number;
  lifeExpectancy?: number;
}

export function LifeBattery({
  currentAge,
  retireAge,
  estimatedRetireAge,
  lifeExpectancy = 85
}: LifeBatteryProps) {
  // 計算各區塊百分比
  const segments = useMemo(() => {
    const totalLife = lifeExpectancy;
    
    // 已過時間 (灰色)
    const pastPercent = (currentAge / totalLife) * 100;
    
    // 工作時間 (紅色) - 從現在到預估退休
    const workYears = Math.max(0, estimatedRetireAge - currentAge);
    const workPercent = (workYears / totalLife) * 100;
    
    // 自由時間 (綠色) - 從預估退休到終點
    const freeYears = Math.max(0, lifeExpectancy - estimatedRetireAge);
    const freePercent = (freeYears / totalLife) * 100;
    
    return {
      past: { percent: pastPercent, years: currentAge },
      work: { percent: workPercent, years: workYears },
      free: { percent: freePercent, years: freeYears }
    };
  }, [currentAge, estimatedRetireAge, lifeExpectancy]);

  // 判斷是否領先/落後
  // 如果 estimatedRetireAge > retireAge，代表要工作更久，所以是「落後」
  // 如果 estimatedRetireAge < retireAge，代表可以提早退休，所以是「領先」
  const status = useMemo(() => {
    const diff = estimatedRetireAge - retireAge;
    if (Math.abs(diff) < 0.01) return 'onTrack';
    return diff > 0 ? 'behind' : 'ahead';
  }, [retireAge, estimatedRetireAge]);

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
      {/* 標題 */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-gray-400 text-sm">🔋 生命電池</div>
        <div className={`text-sm font-medium ${
          status === 'ahead' ? 'text-emerald-400' :
          status === 'behind' ? 'text-orange-400' :
          'text-gray-400'
        }`}>
          {status === 'ahead' && '🚀 領先中'}
          {status === 'behind' && '⏰ 追趕中'}
          {status === 'onTrack' && '✅ 準時'}
        </div>
      </div>

      {/* 電池條 */}
      <div className="relative h-10 rounded-xl overflow-hidden bg-gray-900 flex">
        {/* 已過時間 (灰色) */}
        <div
          className="h-full bg-gray-600 transition-all duration-700 flex items-center justify-center relative"
          style={{ width: `${segments.past.percent}%` }}
        >
          {segments.past.percent > 15 && (
            <span className="text-xs text-gray-300 font-medium">
              {Math.round(segments.past.years)}歲
            </span>
          )}
        </div>

        {/* 工作時間 (紅色，脈動動畫) */}
        <div
          className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-700 flex items-center justify-center relative animate-pulse-subtle"
          style={{ width: `${segments.work.percent}%` }}
        >
          {segments.work.percent > 15 && (
            <span className="text-xs text-white font-medium">
              工作 {Math.round(segments.work.years)}年
            </span>
          )}
        </div>

        {/* 自由時間 (綠色) */}
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 flex items-center justify-center relative"
          style={{ width: `${segments.free.percent}%` }}
        >
          {segments.free.percent > 15 && (
            <span className="text-xs text-white font-medium">
              自由 {Math.round(segments.free.years)}年
            </span>
          )}
        </div>
      </div>

      {/* 圖例 */}
      <div className="flex justify-between mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-600"></div>
          <span>已過</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
          <span>工作</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>自由</span>
        </div>
      </div>

      {/* 退休年齡資訊 */}
      <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between text-sm">
        <div>
          <div className="text-gray-500">目標退休</div>
          <div className="text-white font-bold">{retireAge} 歲</div>
        </div>
        <div className="text-right">
          <div className="text-gray-500">預估退休</div>
          <div className={`font-bold ${
            status === 'ahead' ? 'text-emerald-400' :
            status === 'behind' ? 'text-orange-400' :
            'text-white'
          }`}>
            {estimatedRetireAge.toFixed(1)} 歲
          </div>
        </div>
      </div>
    </div>
  );
}
