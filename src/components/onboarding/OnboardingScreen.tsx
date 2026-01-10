// Phase 5: 初始設定流程簡化（3步驟）
import { useState, useEffect } from 'react';
import { FinanceCalc, Formatters, CONSTANTS } from '@/utils/financeCalc';
import { UserData } from '@/types';

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS;
const { formatCurrencyFull } = Formatters;  // Phase 5: 移除未使用的 formatCurrency

interface OnboardingScreenProps {
  onComplete: (data: UserData) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<number>(0);
  const [age, setAge] = useState<number>(30);
  const [salary, setSalary] = useState<number>(50000);
  const [retireAge, setRetireAge] = useState<number>(65);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Phase 5: 自動計算值
  const currentSavings = 0;  // 自動設為 0
  const [monthlySavings, setMonthlySavings] = useState<number>(10000);

  // 根據薪水自動更新每月儲蓄（20%）
  useEffect(() => {
    setMonthlySavings(Math.round(salary * 0.2));
  }, [salary]);

  const hourlyRate = Math.round(FinanceCalc.hourlyRate(salary));
  const realRate = FinanceCalc.realRate(DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE);
  const yearsToRetire = retireAge - age;
  const projectedFund = FinanceCalc.targetFundByAge(currentSavings, monthlySavings, yearsToRetire, realRate);

  const handleNext = (): void => {
    setIsAnimating(true);
    setTimeout(() => {
      if (step < 2) {  // Phase 5: 簡化為 3 個步驟 (0, 1, 2)
        setStep(step + 1);
      } else {
        onComplete({
          age, salary, retireAge, currentSavings, monthlySavings,
          targetRetirementFund: Math.round(projectedFund),
          inflationRate: DEFAULT_INFLATION_RATE,
          roiRate: DEFAULT_ROI_RATE,
          createdAt: new Date().toISOString(),  // Phase 1: 記錄完成 onboarding 的時間
        });
      }
      setIsAnimating(false);
    }, 300);
  };

  const steps = [
    {
      title: '你幾歲？',
      subtitle: '讓我們從現在開始計算',
      content: (
        <div className="flex flex-col items-center">
          <div className="text-8xl font-black text-white mb-4 tabular-nums">{age}</div>
          <div className="text-gray-400 mb-8">歲</div>
          <input type="range" min="18" max="55" value={age}
            onChange={(e) => setAge(parseInt(e.target.value))} className="slider w-72" />
          <div className="flex justify-between w-72 text-gray-500 text-sm mt-2">
            <span>18</span><span>55</span>
          </div>
        </div>
      ),
    },
    {
      title: '月薪多少？',
      subtitle: '這決定了你的時間單價',
      content: (
        <div className="flex flex-col items-center">
          <div className="text-5xl font-black text-white mb-2 tabular-nums">{formatCurrencyFull(salary)}</div>
          <div className="text-gray-400 mb-4">/月</div>
          <div className="bg-gray-800/50 rounded-2xl px-6 py-3 mb-8">
            <span className="text-gray-400">時薪約 </span>
            <span className="text-emerald-400 font-bold">${hourlyRate}</span>
          </div>
          <input type="range" min="25000" max="500000" step="5000" value={salary}
            onChange={(e) => setSalary(parseInt(e.target.value))} className="slider w-72" />
          <div className="flex justify-between w-72 text-gray-500 text-sm mt-2">
            <span>$2.5萬</span><span>$50萬</span>
          </div>
        </div>
      ),
    },
    {
      title: '想幾歲退休？',
      subtitle: '這是你的目標，GPS 會幫你導航',
      content: (
        <div className="flex flex-col items-center">
          <div className="text-8xl font-black text-white mb-2 tabular-nums">{retireAge}</div>
          <div className="text-gray-400 mb-4">歲退休</div>
          <div className="bg-emerald-500/20 rounded-2xl px-6 py-3 mb-8">
            <span className="text-emerald-400">還有 </span>
            <span className="text-emerald-300 font-bold">{yearsToRetire} 年</span>
            <span className="text-emerald-400"> 可以奮鬥</span>
          </div>
          <input type="range" min={age + 5} max="75" value={retireAge}
            onChange={(e) => setRetireAge(parseInt(e.target.value))} className="slider w-72" />
          <div className="flex justify-between w-72 text-gray-500 text-sm mt-2">
            <span>{age + 5}</span><span>75</span>
          </div>
        </div>
      ),
    },
    // Phase 5: 移除 Step 4 和 Step 5，改為自動計算
    // currentSavings 自動設為 0
    // monthlySavings 自動設為 salary × 0.2
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <div className="text-3xl font-black text-white tracking-tight">
          Time<span className="text-emerald-400">Bar</span>
        </div>
        <div className="text-gray-500 text-xs text-center">你的時間，你定價</div>
      </div>

      <div className="flex gap-2 mb-12">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
            i === step ? 'w-8 bg-emerald-400' : i < step ? 'w-4 bg-emerald-600' : 'w-4 bg-gray-700'
          }`} />
        ))}
      </div>

      <div className={`text-center mb-8 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
        <h1 className="text-3xl font-bold text-white mb-2">{steps[step].title}</h1>
        <p className="text-gray-400">{steps[step].subtitle}</p>
      </div>

      <div className={`mb-8 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100'}`}>
        {steps[step].content}
      </div>

      <button onClick={handleNext}
        className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold py-4 px-16 rounded-2xl text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/25">
        {step < 2 ? '繼續' : '開始使用'}
      </button>
    </div>
  );
}
