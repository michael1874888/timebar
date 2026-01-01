import { useMemo } from 'react';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { UserData, GPSResult } from '@/types';

const { formatCurrency } = Formatters;

interface CatchUpOption {
  action: string;
  description: string;
  effect: string;
  icon: string;
  savingsPerMonth: number;
}

interface CatchUpPlanProps {
  userData: UserData;
  gpsResult: GPSResult;
}

export function CatchUpPlan({ userData, gpsResult }: CatchUpPlanProps) {
  const { isAhead, isBehind, ageDiffDays } = gpsResult;
  
  // 只有落後時才顯示
  if (!isBehind) return null;

  const catchUpOptions = useMemo((): CatchUpOption[] => {
    const { salary, monthlySavings, inflationRate, roiRate, retireAge, age } = userData;
    const realRate = FinanceCalc.realRate(inflationRate, roiRate);
    const hourlyRate = FinanceCalc.hourlyRate(salary);
    const yearsToRetire = retireAge - age;

    // 計算每月額外儲蓄能追回多少天
    const calculateDaysRecovered = (extraMonthly: number): number => {
      // 每月額外儲蓄的時間成本
      const timeCost = FinanceCalc.calculateTimeCost(
        extraMonthly,
        true, // recurring
        hourlyRate,
        realRate,
        yearsToRetire
      );
      // 轉換為天數 (8 小時 = 1 天)
      return Math.round(timeCost / 8);
    };

    const options: CatchUpOption[] = [];

    // 選項 1: 減少 10% 支出
    const reduceExpense = Math.round(salary * 0.1);
    const daysFromReduce = calculateDaysRecovered(reduceExpense);
    options.push({
      action: '減少 10% 支出',
      description: `每月少花 ${formatCurrency(reduceExpense)}`,
      effect: `追回 ${daysFromReduce} 天`,
      icon: '💰',
      savingsPerMonth: reduceExpense
    });

    // 選項 2: 取消訂閱服務
    const cancelSub = 500; // 假設平均訂閱費
    const daysFromCancel = calculateDaysRecovered(cancelSub);
    options.push({
      action: '取消 1 個訂閱',
      description: '省下 Netflix/Spotify 等',
      effect: `追回 ${daysFromCancel} 天`,
      icon: '📱',
      savingsPerMonth: cancelSub
    });

    // 選項 3: 少外食
    const lessEatOut = 2000;
    const daysFromEating = calculateDaysRecovered(lessEatOut);
    options.push({
      action: '每週少外食 1 次',
      description: `每月省約 ${formatCurrency(lessEatOut)}`,
      effect: `追回 ${daysFromEating} 天`,
      icon: '🍱',
      savingsPerMonth: lessEatOut
    });

    // 選項 4: 額外儲蓄
    const extraSave = 3000;
    const daysFromExtra = calculateDaysRecovered(extraSave);
    options.push({
      action: '每月多存 $3,000',
      description: '從娛樂預算挪用',
      effect: `追回 ${daysFromExtra} 天`,
      icon: '🎯',
      savingsPerMonth: extraSave
    });

    return options;
  }, [userData]);

  return (
    <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-4">
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏃</span>
        <div>
          <div className="text-orange-400 font-medium">追趕計劃</div>
          <div className="text-gray-500 text-xs">
            目前落後 {Math.abs(ageDiffDays)} 天，這樣做可以追上
          </div>
        </div>
      </div>

      {/* 選項列表 */}
      <div className="space-y-2">
        {catchUpOptions.map((option, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="text-xl">{option.icon}</div>
              <div>
                <div className="text-white text-sm font-medium">{option.action}</div>
                <div className="text-gray-500 text-xs">{option.description}</div>
              </div>
            </div>
            <div className="text-emerald-400 text-sm font-medium">
              {option.effect}
            </div>
          </div>
        ))}
      </div>

      {/* 激勵語 */}
      <div className="mt-3 pt-3 border-t border-orange-500/20 text-center">
        <div className="text-gray-400 text-sm">
          💪 任選一項開始，你就已經在進步了！
        </div>
      </div>
    </div>
  );
}
