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
  const status = useMemo(() => {
    const diff = estimatedRetireAge - retireAge;
    if (Math.abs(diff) < 0.01) return 'onTrack';
    return diff > 0 ? 'behind' : 'ahead';
  }, [retireAge, estimatedRetireAge]);

  // 計算差距年數
  const diffYears = useMemo(() => {
    return Math.abs(estimatedRetireAge - retireAge);
  }, [retireAge, estimatedRetireAge]);

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* 頂部狀態橫幅 */}
      <div className={`-mx-5 -mt-5 px-5 py-3 rounded-t-2xl mb-4 transition-all duration-500 ${
        status === 'ahead' ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border-b border-emerald-500/30' :
        status === 'behind' ? 'bg-gradient-to-r from-orange-600/30 to-red-600/30 border-b border-orange-500/30' :
        'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-b border-blue-500/30'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔋</span>
            <span className="text-white font-bold text-base">生命電池</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-500 ${
            status === 'ahead' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
            status === 'behind' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
            'bg-blue-500/20 text-blue-300 border border-blue-500/40'
          }`}>
            {status === 'ahead' && (
              <>
                <span className="text-lg">🚀</span>
                <span>領先 {diffYears.toFixed(1)} 年</span>
              </>
            )}
            {status === 'behind' && (
              <>
                <span className="text-lg animate-pulse">⏰</span>
                <span>落後 {diffYears.toFixed(1)} 年</span>
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
      </div>

      {/* 電池視覺化 - 改良版 */}
      <div className="relative">
        {/* 電池外框 */}
        <div className="relative h-14 rounded-2xl overflow-hidden bg-gray-950/80 border-2 border-gray-700 shadow-inner">
          {/* 內部漸層條 */}
          <div className="h-full flex">
            {/* 已過時間 (灰色) */}
            <div
              className="h-full bg-gradient-to-r from-gray-700 to-gray-600 transition-all duration-700 flex items-center justify-center relative group"
              style={{ width: `${segments.past.percent}%` }}
            >
              {segments.past.percent > 12 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-white font-bold drop-shadow-lg">
                    {Math.round(segments.past.years)}歲
                  </span>
                </div>
              )}
              {/* 紋理效果 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* 工作時間 (橙紅色漸層，帶動畫) */}
            <div
              className="h-full bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 transition-all duration-700 flex items-center justify-center relative group bg-[length:200%_100%] animate-gradient"
              style={{ width: `${segments.work.percent}%` }}
            >
              {segments.work.percent > 12 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-white font-bold drop-shadow-lg">
                    工作 {Math.round(segments.work.years)}年
                  </span>
                </div>
              )}
              {/* 脈動光效 */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-50 animate-pulse"></div>
            </div>

            {/* 自由時間 (綠色漸層) */}
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 transition-all duration-700 flex items-center justify-center relative group bg-[length:200%_100%] animate-gradient-slow"
              style={{ width: `${segments.free.percent}%` }}
            >
              {segments.free.percent > 12 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-white font-bold drop-shadow-lg">
                    自由 {Math.round(segments.free.years)}年
                  </span>
                </div>
              )}
              {/* 光澤效果 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10"></div>
            </div>
          </div>

          {/* 電池頂部高光效果 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        </div>

        {/* 電池正極 (右側小凸起) */}
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-gray-700 rounded-r-md border-2 border-gray-700"></div>
      </div>

      {/* 圖例 - 改良版 */}
      <div className="flex justify-around mt-4 pt-3 border-t border-gray-700/50">
        <div className="flex flex-col items-center gap-1 group cursor-pointer">
          <div className="w-3 h-3 rounded-full bg-gray-600 group-hover:scale-125 transition-transform"></div>
          <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">已過</span>
          <span className="text-xs font-bold text-white">{Math.round(segments.past.years)}年</span>
        </div>
        <div className="flex flex-col items-center gap-1 group cursor-pointer">
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse group-hover:scale-125 transition-transform"></div>
          <span className="text-xs text-gray-400 group-hover:text-orange-300 transition-colors">工作</span>
          <span className="text-xs font-bold text-white">{Math.round(segments.work.years)}年</span>
        </div>
        <div className="flex flex-col items-center gap-1 group cursor-pointer">
          <div className="w-3 h-3 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></div>
          <span className="text-xs text-gray-400 group-hover:text-emerald-300 transition-colors">自由</span>
          <span className="text-xs font-bold text-white">{Math.round(segments.free.years)}年</span>
        </div>
      </div>

      {/* 退休年齡對比 - 強化版 */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="grid grid-cols-2 gap-3">
          {/* 目標退休 */}
          <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700/50 hover:border-blue-500/50 transition-all">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <span>🎯</span>
              <span>目標退休</span>
            </div>
            <div className="text-2xl font-bold text-white">{retireAge}</div>
            <div className="text-xs text-gray-400">歲</div>
          </div>

          {/* 預估退休 */}
          <div className={`rounded-xl p-3 border transition-all ${
            status === 'ahead' ? 'bg-emerald-900/30 border-emerald-500/50 hover:border-emerald-400' :
            status === 'behind' ? 'bg-orange-900/30 border-orange-500/50 hover:border-orange-400' :
            'bg-blue-900/30 border-blue-500/50 hover:border-blue-400'
          }`}>
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <span>📊</span>
              <span>預估退休</span>
            </div>
            <div className={`text-2xl font-bold transition-colors ${
              status === 'ahead' ? 'text-emerald-400' :
              status === 'behind' ? 'text-orange-400' :
              'text-blue-400'
            }`}>
              {estimatedRetireAge.toFixed(1)}
            </div>
            <div className={`text-xs transition-colors ${
              status === 'ahead' ? 'text-emerald-300' :
              status === 'behind' ? 'text-orange-300' :
              'text-blue-300'
            }`}>
              歲
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
