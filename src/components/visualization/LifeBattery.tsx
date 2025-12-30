import { useMemo } from 'react';
import { GPSCalc } from '@/utils/financeCalc';
import { UserData, Record as RecordType } from '@/types';
import { PositiveMessaging } from '@/utils/positiveMessaging';

interface LifeBatteryProps {
  userData: UserData;
  records: RecordType[];
}

export function LifeBattery({ userData, records }: LifeBatteryProps) {
  const { age, retireAge } = userData;
  const lifeExpectancy = 85; // 預期壽命

  // 使用 GPS 計算實際預估退休年齡
  const { estimatedAge } = useMemo(() =>
    GPSCalc.calculateEstimatedAge(retireAge, records),
    [retireAge, records]
  );

  // 計算各階段年數
  const stages = useMemo(() => {
    const workingStart = 22; // 開始工作年齡
    const livedYears = age - workingStart;
    const workYearsLeft = Math.max(0, estimatedAge - age);
    const freeYears = Math.max(0, lifeExpectancy - estimatedAge);
    const totalYears = lifeExpectancy - workingStart;

    return {
      lived: livedYears,
      work: workYearsLeft,
      free: freeYears,
      total: totalYears,
      // 百分比
      livedPercent: (livedYears / totalYears) * 100,
      workPercent: (workYearsLeft / totalYears) * 100,
      freePercent: (freeYears / totalYears) * 100
    };
  }, [age, estimatedAge, lifeExpectancy]);

  // 動態訊息 - 使用正向訊息框架
  const message = useMemo(() => {
    const ageDiff = estimatedAge - retireAge;

    if (ageDiff < 0) {
      // 領先
      const msg = PositiveMessaging.gpsStatus.ahead(Math.abs(ageDiff));
      return {
        text: msg.message,
        emoji: msg.emoji,
        color: 'emerald'
      };
    } else if (ageDiff > 0) {
      // 落後 - 使用正向語氣
      const msg = PositiveMessaging.gpsStatus.behind(ageDiff, 2000);
      return {
        text: msg.message,
        emoji: msg.emoji,
        color: 'orange'
      };
    } else {
      // 正好
      const msg = PositiveMessaging.gpsStatus.onTrack();
      return {
        text: msg.message,
        emoji: msg.emoji,
        color: 'blue'
      };
    }
  }, [estimatedAge, retireAge]);

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <h3 className="text-white text-xl font-bold mb-2">
          你的生命電量
        </h3>
        <p className="text-gray-400 text-sm">
          灰 = 已過去 | 紅 = 要工作 | 綠 = 自由時光
        </p>
      </div>

      {/* 電池視覺化 */}
      <div className="relative mb-6">
        {/* 電池外框 */}
        <div className="h-24 rounded-2xl border-4 border-gray-600 overflow-hidden relative bg-gray-800">
          {/* 已過去的時間（灰色） */}
          <div
            className="absolute h-full bg-gradient-to-r from-gray-700 to-gray-600 transition-all duration-700"
            style={{ width: `${stages.livedPercent}%`, left: 0 }}
          >
            <div className="flex items-center justify-center h-full text-gray-400 font-bold text-sm">
              {stages.lived > 5 && `${stages.lived} 年`}
            </div>
          </div>

          {/* 還要工作的時間（紅色） */}
          <div
            className="absolute h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 transition-all duration-700 animate-pulse-slow"
            style={{
              width: `${stages.workPercent}%`,
              left: `${stages.livedPercent}%`
            }}
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-sm">
              {stages.work > 5 && (
                <>
                  ⚠️ {stages.work.toFixed(1)} 年
                </>
              )}
            </div>
          </div>

          {/* 自由時間（綠色） */}
          <div
            className="absolute h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-700"
            style={{
              width: `${stages.freePercent}%`,
              right: 0
            }}
          >
            <div className="flex items-center justify-center h-full text-gray-900 font-bold text-sm">
              {stages.free > 5 && (
                <>
                  ✨ {stages.free.toFixed(1)} 年
                </>
              )}
            </div>
          </div>
        </div>

        {/* 電池頭（裝飾） */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-10 bg-gray-600 rounded-r" />

        {/* 電量百分比顯示 */}
        <div className="absolute -top-8 right-0 text-emerald-400 text-sm font-bold">
          ⚡ {Math.round(stages.freePercent)}% 自由
        </div>
      </div>

      {/* 數據圖例 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-700/30 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-3 h-3 bg-gray-600 rounded" />
            <div className="text-gray-500 text-xs">已過去</div>
          </div>
          <div className="text-white font-bold">{stages.lived} 年</div>
        </div>
        <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-3 h-3 bg-red-500 rounded animate-pulse" />
            <div className="text-red-400 text-xs">要工作</div>
          </div>
          <div className="text-red-400 font-bold">
            {stages.work.toFixed(1)} 年
          </div>
        </div>
        <div className="text-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <div className="text-emerald-400 text-xs">自由</div>
          </div>
          <div className="text-emerald-400 font-bold">
            {stages.free.toFixed(1)} 年
          </div>
        </div>
      </div>

      {/* 動態訊息 */}
      <div
        className={`text-center p-4 rounded-xl ${
          message.color === 'emerald'
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : message.color === 'orange'
            ? 'bg-orange-500/10 border border-orange-500/30'
            : 'bg-blue-500/10 border border-blue-500/30'
        }`}
      >
        <div
          className={`font-bold text-sm ${
            message.color === 'emerald'
              ? 'text-emerald-400'
              : message.color === 'orange'
              ? 'text-orange-400'
              : 'text-blue-400'
          }`}
        >
          {message.emoji} {message.text}
        </div>
      </div>

      {/* 提示文字 */}
      <div className="mt-4 text-center text-gray-500 text-xs">
        每次儲蓄都在縮短紅色區域，擴大綠色區域
      </div>
    </div>
  );
}
