import { useMemo } from 'react';
import { Formatters } from '@/utils/financeCalc';
import { UserData } from '@/types';

const { formatCurrency, formatYearMonth } = Formatters;

interface CatchUpPlanProps {
  userData: UserData;
  ageDiff: number; // 落後的年數（負數 = 領先）
}

export function CatchUpPlan({ userData, ageDiff }: CatchUpPlanProps) {
  // 如果領先或剛好，不顯示追趕計劃
  if (ageDiff <= 0) return null;

  const { monthlySavings } = userData;

  // 計算不同方案需要多久才能追上
  const scenarios = useMemo(() => {
    const plans = [1000, 2000, 3000, 5000];

    return plans.map((extraSaving) => {
      const newMonthlySaving = monthlySavings + extraSaving;

      // 計算新的預估退休年齡
      // 簡化版：假設線性關係
      const savingIncrease = extraSaving / monthlySavings;
      const timeSaved = ageDiff * savingIncrease;

      // 計算需要幾個月才能追上
      const monthsToTarget = ageDiff * 12 / savingIncrease;

      return {
        extraSaving,
        newMonthlySaving,
        timeSaved: Math.min(timeSaved, ageDiff),
        monthsToTarget: Math.round(monthsToTarget),
        percentage: Math.round((extraSaving / monthlySavings) * 100)
      };
    }).filter(s => s.monthsToTarget > 0 && s.monthsToTarget < 240); // 只顯示合理的方案（20年內）
  }, [ageDiff, monthlySavings]);

  if (scenarios.length === 0) {
    return null;
  }

  return (
    <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-5">
      <div className="flex items-start gap-2 mb-4">
        <div className="text-2xl">💡</div>
        <div>
          <div className="text-orange-400 font-bold text-lg mb-1">
            追趕計劃
          </div>
          <div className="text-gray-300 text-sm">
            目前落後 {formatYearMonth(ageDiff)}，以下方案可以幫你追上：
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {scenarios.map((scenario, index) => (
          <div
            key={scenario.extraSaving}
            className={`bg-gray-800/60 rounded-xl p-4 border transition-all hover:border-orange-500 cursor-pointer ${
              index === 1 ? 'border-orange-500/50' : 'border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-white font-bold">
                  方案 {index + 1}
                  {index === 1 && (
                    <span className="ml-2 text-xs bg-orange-500 text-gray-900 px-2 py-0.5 rounded">
                      推薦
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-sm">
                  每月多存 {formatCurrency(scenario.extraSaving)}
                  （增加 {scenario.percentage}%）
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-gray-300 text-sm">
                新月儲蓄：
                <span className="text-emerald-400 font-bold ml-1">
                  {formatCurrency(scenario.newMonthlySaving)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-bold">
                  {Math.floor(scenario.monthsToTarget / 12)} 年{' '}
                  {scenario.monthsToTarget % 12} 個月
                </div>
                <div className="text-gray-500 text-xs">可追上目標</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button className="bg-orange-500 hover:bg-orange-400 text-gray-900 px-6 py-3 rounded-xl font-bold transition-all active:scale-95">
          選擇方案並開始執行
        </button>
      </div>
    </div>
  );
}
