import { useState, useEffect } from 'react';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { Storage } from '@/utils/storage';
import { UserData } from '@/types';

const { formatTime } = Formatters;

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  category: string;
}

interface DailyChallengeProps {
  userData: UserData;
  onChallengeComplete: (challenge: Challenge) => void;
}

export function DailyChallenge({ userData, onChallengeComplete }: DailyChallengeProps) {
  const [completedToday, setCompletedToday] = useState<string[]>([]);

  // 載入今日已完成的挑戰
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = Storage.load(`challenges_${today}`, []) as string[];
    setCompletedToday(stored);
  }, []);

  // 儲存完成狀態
  const saveCompleted = (challengeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = [...completedToday, challengeId];
    setCompletedToday(updated);
    Storage.save(`challenges_${today}`, updated);
  };

  // 挑戰列表
  const challenges: Challenge[] = [
    {
      id: 'coffee',
      title: '咖啡挑戰',
      description: '今天不買手搖飲/咖啡',
      reward: 150,
      icon: '☕',
      category: '飲食'
    },
    {
      id: 'lunch',
      title: '自備午餐',
      description: '自己帶便當上班',
      reward: 100,
      icon: '🍱',
      category: '飲食'
    },
    {
      id: 'taxi',
      title: '大眾運輸',
      description: '不叫計程車/Uber',
      reward: 200,
      icon: '🚇',
      category: '交通'
    },
    {
      id: 'snack',
      title: '零食抵抗',
      description: '不買零食點心',
      reward: 50,
      icon: '🍿',
      category: '飲食'
    }
  ];

  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 計算完成百分比
  const completionRate = Math.round((completedToday.length / challenges.length) * 100);

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">🎯 今日挑戰</h3>
        <div className="text-emerald-400 text-sm font-bold">
          {completedToday.length}/{challenges.length}
        </div>
      </div>

      {/* 進度條 */}
      <div className="mb-6">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="text-gray-500 text-xs mt-1 text-right">
          {completionRate}% 完成
        </div>
      </div>

      {/* 挑戰列表 */}
      <div className="space-y-3">
        {challenges.map((challenge) => {
          const isCompleted = completedToday.includes(challenge.id);

          // 計算這個挑戰能買回多少時間
          const timeCost = FinanceCalc.calculateTimeCost(
            challenge.reward,
            false,
            hourlyRate,
            realRate,
            yearsToRetire
          );
          const timeFormatted = formatTime(timeCost);

          return (
            <div
              key={challenge.id}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isCompleted
                  ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`text-4xl transition-transform ${
                    isCompleted ? 'scale-110' : ''
                  }`}
                >
                  {challenge.icon}
                </div>

                {/* 內容 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`font-bold ${
                        isCompleted ? 'text-emerald-300' : 'text-white'
                      }`}
                    >
                      {challenge.title}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        isCompleted
                          ? 'bg-emerald-500/30 text-emerald-300'
                          : 'bg-gray-600 text-gray-400'
                      }`}
                    >
                      {challenge.category}
                    </span>
                  </div>
                  <div
                    className={`text-sm ${
                      isCompleted ? 'text-emerald-400/80' : 'text-gray-400'
                    }`}
                  >
                    {challenge.description}
                  </div>
                </div>

                {/* 按鈕或完成標記 */}
                {!isCompleted ? (
                  <button
                    onClick={() => {
                      saveCompleted(challenge.id);
                      onChallengeComplete(challenge);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
                  >
                    <div>完成</div>
                    <div className="text-xs text-emerald-900">
                      +{timeFormatted.value}
                      {timeFormatted.unit}
                    </div>
                  </button>
                ) : (
                  <div className="text-emerald-400 text-3xl">✓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 全部完成提示 */}
      {completedToday.length === challenges.length && (
        <div className="mt-4 text-center p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/50 animate-slide-up">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-emerald-400 font-bold mb-1">
            今日全部完成！
          </div>
          <div className="text-emerald-300/80 text-sm">
            你是自由戰士！明天再來挑戰吧！
          </div>
        </div>
      )}
    </div>
  );
}
