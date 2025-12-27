// 初始設定流程（5步驟）
import { useState, useEffect } from 'react';
import { FinanceCalc, Formatters, CONSTANTS } from '@/utils/financeCalc';
import { UserData } from '@/types';

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS;
const { formatCurrency, formatCurrencyFull } = Formatters;

interface OnboardingScreenProps {
  onComplete: (data: UserData) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<number>(0);
  const [age, setAge] = useState<number>(30);
  const [salary, setSalary] = useState<number>(50000);
  const [retireAge, setRetireAge] = useState<number>(65);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [monthlySavings, setMonthlySavings] = useState<number>(10000);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    setMonthlySavings(Math.round(salary * 0.2));
  }, [salary]);

  const hourlyRate = Math.round(FinanceCalc.hourlyRate(salary));
  const realRate = FinanceCalc.realRate(DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE);
  const yearsToRetire = retireAge - age;
  const projectedFund = FinanceCalc.targetFundByAge(currentSavings, monthlySavings, yearsToRetire, realRate);
  const monthlyRetirement = FinanceCalc.fundToMonthly(projectedFund);

  const handleNext = (): void => {
    setIsAnimating(true);
    setTimeout(() => {
      if (step < 4) {
        setStep(step + 1);
      } else {
        onComplete({
          age, salary, retireAge, currentSavings, monthlySavings,
          targetRetirementFund: Math.round(projectedFund),
          inflationRate: DEFAULT_INFLATION_RATE,
          roiRate: DEFAULT_ROI_RATE,
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
    {
      title: '目前有多少存款？',
      subtitle: '這是你的起跑點',
      content: (
        <div className="flex flex-col items-center">
          <div className="text-4xl font-black text-white mb-4 tabular-nums">{formatCurrencyFull(currentSavings)}</div>
          <input type="range" min="0" max="10000000" step="100000" value={currentSavings}
            onChange={(e) => setCurrentSavings(parseInt(e.target.value))} className="slider w-72" />
          <div className="flex justify-between w-72 text-gray-500 text-sm mt-2">
            <span>$0</span><span>$1000萬</span>
          </div>
          <div className="text-gray-500 text-sm mt-4">沒有也沒關係，從零開始更厲害 💪</div>
        </div>
      ),
    },
    {
      title: '每月存多少？',
      subtitle: '這只是估計，之後可以調整',
      content: (
        <div className="flex flex-col items-center">
          <div className="text-4xl font-black text-white mb-2 tabular-nums">{formatCurrencyFull(monthlySavings)}</div>
          <div className="text-gray-400 mb-4">/每月</div>
          <div className="text-gray-500 text-xs mb-6">佔月薪 {Math.round(monthlySavings / salary * 100)}%</div>
          <input type="range" min="0" max={Math.min(salary, 200000)} step="1000" value={monthlySavings}
            onChange={(e) => setMonthlySavings(parseInt(e.target.value))} className="slider w-72" />
          <div className="flex justify-between w-72 text-gray-500 text-sm mt-2">
            <span>$0</span><span>{formatCurrency(Math.min(salary, 200000))}</span>
          </div>

          {/* Preview */}
          <div className="bg-gray-800/60 rounded-2xl p-4 mt-8 w-72 border border-gray-700/50">
            <div className="text-gray-400 text-xs mb-2 text-center">按此計畫，{retireAge}歲時可累積</div>
            <div className="text-emerald-400 text-2xl font-bold text-center">{formatCurrency(Math.round(projectedFund))}</div>
            <div className="text-gray-500 text-xs text-center mt-1">
              退休後每月可領約 {formatCurrency(Math.round(monthlyRetirement))}
            </div>
          </div>
        </div>
      ),
    },
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
        {step < 4 ? '繼續' : '開始使用'}
      </button>
    </div>
  );
}
