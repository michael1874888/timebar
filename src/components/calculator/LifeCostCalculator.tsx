import { useState, useMemo } from 'react';
import { NumericFormat } from 'react-number-format';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { UserData } from '@/types';

const { formatCurrency } = Formatters;

interface LifeCostCalculatorProps {
  userData: UserData;
  onDecision: (action: 'buy' | 'save', amount: number) => void;
}

export function LifeCostCalculator({ userData, onDecision }: LifeCostCalculatorProps) {
  const [amount, setAmount] = useState<number>(0);
  const [itemName, setItemName] = useState<string>('');

  // 計算參數
  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 核心計算 1：這筆錢 = 多少工作時間
  const workTime = useMemo(() => {
    const hoursLost = amount / hourlyRate;
    const days = Math.floor(hoursLost / 8);
    const hours = Math.floor(hoursLost % 8);
    const minutes = Math.round((hoursLost % 1) * 60);

    return { days, hours, minutes, totalHours: hoursLost };
  }, [amount, hourlyRate]);

  // 核心計算 2：這筆錢會推遲多少退休日期
  const retirementImpact = useMemo(() => {
    const timeCost = FinanceCalc.calculateTimeCost(
      amount,
      false,
      hourlyRate,
      realRate,
      yearsToRetire
    );
    const daysLost = timeCost / 24;
    return {
      days: Math.floor(daysLost),
      hours: Math.round((daysLost % 1) * 24)
    };
  }, [amount, hourlyRate, realRate, yearsToRetire]);

  // 生動的比喻
  const lifeEquivalent = useMemo(() => {
    const hours = workTime.totalHours;

    if (hours < 0.5) return '看一集 YouTube 影片的時間';
    if (hours < 1) return '喝一杯咖啡的時間';
    if (hours < 2) return '一場電影的時間';
    if (hours < 4) return '半天的上班時間';
    if (hours < 8) return '一個上午的會議時間';
    if (hours < 24) return '整整一個工作天';
    if (hours < 40) return `${workTime.days} 個工作天`;

    const weeks = Math.floor(hours / 40);
    const months = Math.floor(weeks / 4);

    if (months > 0) {
      return `${months} 個月的薪水（${weeks} 週的辛苦工作）`;
    }
    return `${weeks} 週的辛苦工作`;
  }, [workTime]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* 頭部標題 */}
      <div className="text-center pt-8 pb-6 px-4">
        <h1 className="text-4xl font-black text-white mb-3">
          這個東西值多少
          <span className="text-orange-400">生命</span>
          ？
        </h1>
        <p className="text-gray-400 text-sm">
          在掏錢之前，先問問自己
        </p>
      </div>

      {/* 金額輸入區 */}
      <div className="px-4 mb-6">
        <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-6 border-2 border-orange-500/30 shadow-xl">
          {/* 物品名稱（選填） */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="想買什麼？（選填）"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full bg-gray-700/50 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* 金額輸入 */}
          <div className="text-center mb-4">
            <div className="text-gray-400 text-sm mb-2">
              {itemName || '這個東西'}要花
            </div>
            <NumericFormat
              value={amount || ''}
              onValueChange={(values) => setAmount(values.floatValue || 0)}
              thousandSeparator=","
              prefix="NT$ "
              placeholder="NT$ 0"
              className="text-5xl font-black text-center bg-transparent text-white w-full outline-none"
            />
          </div>

          {/* 快速金額按鈕 */}
          <div className="flex gap-2 justify-center flex-wrap">
            {[100, 150, 500, 1000, 1500, 5000, 10000, 36000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  amount === v
                    ? 'bg-orange-500 text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {v >= 1000 ? `${v / 1000}k` : v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 生命成本顯示（只在輸入金額後顯示） */}
      {amount > 0 && (
        <div className="px-4 pb-24 animate-fade-in">
          {/* 核心震撼：工作時間成本 */}
          <div className="bg-orange-500/10 border-2 border-orange-500 rounded-3xl p-6 mb-4 shadow-xl">
            <div className="text-center">
              <div className="text-orange-400 text-sm font-medium mb-3">
                ⚠️ 生命成本
              </div>
              <div className="text-white text-5xl font-black mb-3">
                {workTime.days > 0 && <>{workTime.days} 天</>}
                {workTime.days > 0 && (workTime.hours > 0 || workTime.minutes > 0) && <> </>}
                {workTime.hours > 0 && <>{workTime.hours} 小時</>}
                {workTime.hours > 0 && workTime.minutes > 0 && <> </>}
                {workTime.minutes > 0 && workTime.days === 0 && <>{workTime.minutes} 分</>}
              </div>
              <div className="text-gray-300 text-base">
                你需要為{itemName || '這個東西'}工作這麼久
              </div>
            </div>
          </div>

          {/* 退休影響 */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-4xl">💀</div>
              <div className="flex-1">
                <div className="text-red-400 font-bold text-lg mb-2">
                  這會推遲你的退休
                </div>
                <div className="text-white text-3xl font-black mb-1">
                  {retirementImpact.days} 天
                  {retirementImpact.hours > 0 && <> {retirementImpact.hours} 小時</>}
                </div>
                <div className="text-gray-400 text-sm">
                  原本 {retireAge} 歲退休，現在要到{' '}
                  {(retireAge + (retirementImpact.days + retirementImpact.hours / 24) / 365).toFixed(2)} 歲
                </div>
              </div>
            </div>
          </div>

          {/* 生動比喻 */}
          <div className="bg-gray-800/60 backdrop-blur rounded-2xl p-4 mb-6 border border-gray-700">
            <div className="flex items-start gap-2">
              <div className="text-2xl">💭</div>
              <div className="flex-1">
                <div className="text-gray-400 text-xs mb-1">這相當於...</div>
                <div className="text-gray-200 text-sm font-medium">
                  {lifeEquivalent}
                </div>
              </div>
            </div>
          </div>

          {/* 行動按鈕 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                onDecision('buy', amount);
                setAmount(0);
                setItemName('');
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95"
            >
              <div>還是要買</div>
              <div className="text-sm text-gray-400 mt-1">😔</div>
            </button>
            <button
              onClick={() => {
                onDecision('save', amount);
                setAmount(0);
                setItemName('');
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-emerald-500/25"
            >
              <div>我不買了！</div>
              <div className="text-sm text-emerald-700 mt-1">🎉</div>
            </button>
          </div>

          {/* 提示文字 */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              每一次忍住，都是在買回自己的自由
            </p>
          </div>
        </div>
      )}

      {/* 空狀態提示 */}
      {amount === 0 && (
        <div className="px-4 text-center">
          <div className="text-gray-600 text-sm">
            <div className="text-4xl mb-3">🤔</div>
            <div>輸入想買的東西的價格</div>
            <div className="mt-2">看看它值多少生命</div>
          </div>
        </div>
      )}
    </div>
  );
}
