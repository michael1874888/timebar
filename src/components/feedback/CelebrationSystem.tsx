import { useEffect, useState } from 'react';
import { Confetti } from '../Confetti';
import { FinanceCalc } from '@/utils/financeCalc';
import { UserData } from '@/types';

interface CelebrationSystemProps {
  trigger: boolean;
  amount: number;
  userData: UserData;
}

export function CelebrationSystem({ trigger, amount, userData }: CelebrationSystemProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (trigger && amount > 0) {
      // 手機震動
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }

      // 顯示慶祝 Modal
      setShowModal(true);

      // 3 秒後自動關閉
      setTimeout(() => {
        setShowModal(false);
      }, 3000);
    }
  }, [trigger, amount]);

  if (!showModal || amount === 0) return null;

  // 計算買回的時間
  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  const timeCost = FinanceCalc.calculateTimeCost(
    amount,
    false,
    hourlyRate,
    realRate,
    yearsToRetire
  );

  const days = Math.floor(timeCost / 24);
  const hours = Math.floor(timeCost % 24);

  // 根據金額選擇訊息
  const getMessage = () => {
    if (amount >= 10000) {
      return '這是一個重大決定！';
    } else if (amount >= 1000) {
      return '很棒的自制力！';
    } else {
      return '積少成多！';
    }
  };

  // 激勵語錄
  const getMotivationalQuote = () => {
    const quotes = [
      '每一次忍住，都是在買回自己的自由',
      '省下的不是錢，是時間',
      '你正在用行動改變未來',
      '自律帶來自由',
      '小小的決定，大大的改變',
      '你比昨天的自己更自由了',
      '堅持下去，終點不遠了'
    ];

    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <>
      {/* 彩帶動畫 */}
      <Confetti active={true} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 rounded-3xl p-8 max-w-sm mx-4 shadow-2xl border-2 border-emerald-500/50 animate-bounce-in">
          <div className="text-center">
            {/* Emoji */}
            <div className="text-7xl mb-4 animate-bounce">🎉</div>

            {/* 主標題 */}
            <h2 className="text-white text-3xl font-black mb-3">
              {getMessage()}
            </h2>

            {/* 說明 */}
            <p className="text-emerald-200 text-lg mb-4">
              你剛剛買回了
            </p>

            {/* 買回的時間 */}
            <div className="bg-emerald-950/50 rounded-2xl p-4 mb-4 border border-emerald-500/30">
              <div className="text-white text-5xl font-black mb-2">
                {days > 0 && <>{days} 天</>}
                {days > 0 && hours > 0 && <> </>}
                {hours > 0 && <>{hours} 小時</>}
              </div>
              <div className="text-emerald-300 text-sm">
                自由時光
              </div>
            </div>

            {/* 激勵語 */}
            <p className="text-emerald-200/80 text-sm italic">
              "{getMotivationalQuote()}"
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
