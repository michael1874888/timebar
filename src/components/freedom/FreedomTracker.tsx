import { useMemo } from 'react';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { UserData } from '@/types';

const { formatCurrency } = Formatters;

interface FreedomTrackerProps {
  userData: UserData;
  totalSaved: number;
}

export function FreedomTracker({ userData, totalSaved }: FreedomTrackerProps) {
  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 計算已買回多少自由天數
  const freedomDays = useMemo(() => {
    if (totalSaved === 0) return 0;

    // 這筆儲蓄在退休時的複利價值
    const futureValue = totalSaved * Math.pow(1 + realRate, yearsToRetire);

    // 轉換成工作小時
    const freedomHours = futureValue / hourlyRate;

    // 轉換成天數（8 小時工作日）
    return Math.floor(freedomHours / 8);
  }, [totalSaved, hourlyRate, realRate, yearsToRetire]);

  // 里程碑定義
  const milestones = [
    {
      id: 'monday',
      days: 1,
      title: '自由星期一',
      icon: '🎉',
      description: '你已經存夠一天不用工作的錢了！',
      color: 'emerald'
    },
    {
      id: 'weekend',
      days: 7,
      title: '自由一週',
      icon: '🏖️',
      description: '可以出去玩一整週了！',
      color: 'blue'
    },
    {
      id: 'coffee',
      days: 30,
      title: '咖啡自由',
      icon: '☕',
      description: '被動收入可支付每天一杯咖啡',
      color: 'amber'
    },
    {
      id: 'month',
      days: 90,
      title: '季度假期自由',
      icon: '✈️',
      description: '每季可以出國旅遊一次',
      color: 'purple'
    },
    {
      id: 'year',
      days: 365,
      title: '年度自由',
      icon: '🎊',
      description: '整整一年不用工作！',
      color: 'pink'
    },
    {
      id: 'five-years',
      days: 1825,
      title: '五年自由',
      icon: '🚀',
      description: '可以環遊世界五年',
      color: 'red'
    }
  ];

  // 找出當前進度
  const unlockedMilestones = milestones.filter(m => m.days <= freedomDays);
  const nextMilestone = milestones.find(m => m.days > freedomDays) || milestones[milestones.length - 1];
  const progress = nextMilestone ? (freedomDays / nextMilestone.days) * 100 : 100;
  const daysToNext = nextMilestone ? nextMilestone.days - freedomDays : 0;

  // 計算還需要存多少錢才能解鎖下一個
  const amountToNext = useMemo(() => {
    if (!nextMilestone) return 0;

    const targetHours = daysToNext * 8;
    const targetFutureValue = targetHours * hourlyRate;
    const presentValue = targetFutureValue / Math.pow(1 + realRate, yearsToRetire);

    return Math.max(0, Math.round(presentValue));
  }, [nextMilestone, daysToNext, hourlyRate, realRate, yearsToRetire]);

  return (
    <div className="space-y-4">
      {/* 當前成就卡片 */}
      <div className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 rounded-3xl p-6 border border-emerald-500/30">
        <div className="text-center mb-6">
          <div className="text-emerald-400 text-sm font-medium mb-2">
            🏆 你已經買回
          </div>
          <div className="text-white text-6xl font-black mb-2">
            {freedomDays}
          </div>
          <div className="text-emerald-300 text-lg">
            天自由時光
          </div>
        </div>

        {/* 已解鎖成就 */}
        {unlockedMilestones.length > 0 && (
          <div className="mb-6">
            <div className="text-emerald-400 text-xs font-medium mb-3">
              ✓ 已解鎖成就
            </div>
            <div className="space-y-2">
              {unlockedMilestones.slice(-3).reverse().map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 bg-emerald-500/10 rounded-xl p-3"
                >
                  <div className="text-2xl">{milestone.icon}</div>
                  <div className="flex-1">
                    <div className="text-emerald-300 font-bold text-sm">
                      {milestone.title}
                    </div>
                    <div className="text-emerald-400/70 text-xs">
                      {milestone.description}
                    </div>
                  </div>
                  <div className="text-emerald-400 text-xl">✓</div>
                </div>
              ))}
            </div>
            {unlockedMilestones.length > 3 && (
              <div className="text-emerald-400/50 text-xs text-center mt-2">
                還有 {unlockedMilestones.length - 3} 個成就
              </div>
            )}
          </div>
        )}

        {/* 下一個里程碑 */}
        {nextMilestone && (
          <div>
            <div className="text-gray-400 text-xs font-medium mb-3">
              🎯 下一個目標
            </div>
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-3xl">{nextMilestone.icon}</div>
                  <div>
                    <div className="text-white font-bold">
                      {nextMilestone.title}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {nextMilestone.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 text-sm font-bold">
                    還差 {daysToNext} 天
                  </div>
                </div>
              </div>

              {/* 進度條 */}
              <div className="relative">
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-gray-500 text-xs mt-1 text-right">
                  {Math.min(Math.round(progress), 100)}%
                </div>
              </div>

              {/* 提示 */}
              <div className="mt-3 text-center">
                <div className="text-gray-400 text-xs">
                  再存 {formatCurrency(amountToNext)} 就能解鎖
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 所有里程碑列表（收合式） */}
      <details className="bg-gray-800/40 rounded-2xl overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer text-gray-400 text-sm hover:text-gray-300">
          查看所有里程碑 →
        </summary>
        <div className="px-4 pb-4 space-y-2">
          {milestones.map((milestone) => {
            const isUnlocked = milestone.days <= freedomDays;
            const isCurrent = milestone.id === nextMilestone?.id;

            return (
              <div
                key={milestone.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isUnlocked
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : isCurrent
                    ? 'bg-orange-500/10 border border-orange-500/30'
                    : 'bg-gray-700/30 border border-gray-600/30'
                }`}
              >
                <div className="text-2xl">{milestone.icon}</div>
                <div className="flex-1">
                  <div
                    className={`font-bold text-sm ${
                      isUnlocked
                        ? 'text-emerald-300'
                        : isCurrent
                        ? 'text-orange-300'
                        : 'text-gray-400'
                    }`}
                  >
                    {milestone.title}
                  </div>
                  <div
                    className={`text-xs ${
                      isUnlocked
                        ? 'text-emerald-400/70'
                        : isCurrent
                        ? 'text-orange-400/70'
                        : 'text-gray-500'
                    }`}
                  >
                    {milestone.days} 天
                  </div>
                </div>
                {isUnlocked && (
                  <div className="text-emerald-400 text-xl">✓</div>
                )}
                {isCurrent && (
                  <div className="text-orange-400 text-sm font-bold">
                    進行中
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
