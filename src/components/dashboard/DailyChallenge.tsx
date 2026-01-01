import { useState, useMemo, useCallback } from 'react';
import { Storage } from '@/utils/storage';

// 每日挑戰定義
interface Challenge {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  icon: string;
}

const DAILY_CHALLENGES: Challenge[] = [
  {
    id: 'skip_coffee',
    name: '跳過一杯咖啡',
    description: '今天不買咖啡，省下約 $100',
    targetAmount: 100,
    icon: '☕'
  },
  {
    id: 'skip_snack',
    name: '拒絕一次零食',
    description: '不買零食或飲料，省下約 $50',
    targetAmount: 50,
    icon: '🍪'
  },
  {
    id: 'walk_instead',
    name: '走路代替交通',
    description: '步行或騎車，省下交通費 $30',
    targetAmount: 30,
    icon: '🚶'
  },
  {
    id: 'cook_home',
    name: '自己做一餐',
    description: '不叫外送，自己煮飯省 $150',
    targetAmount: 150,
    icon: '🍳'
  }
];

// LocalStorage key
const CHALLENGE_STATE_KEY = 'timebar_daily_challenges';

interface ChallengeState {
  date: string; // YYYY-MM-DD
  completed: string[]; // 已完成的 challenge ids
  skippedAmounts: { [id: string]: number }; // 對應節省金額
}

// 取得今天日期
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// 載入挑戰狀態
const loadChallengeState = (): ChallengeState => {
  const saved = Storage.load(CHALLENGE_STATE_KEY) as ChallengeState | null;
  const today = getTodayDate();
  
  // 如果是新的一天，重置挑戰
  if (!saved || saved.date !== today) {
    return {
      date: today,
      completed: [],
      skippedAmounts: {}
    };
  }
  
  return saved;
};

// 儲存挑戰狀態
const saveChallengeState = (state: ChallengeState): void => {
  Storage.save(CHALLENGE_STATE_KEY, state);
};

interface DailyChallengeProps {
  onCompleteChallenge: (challenge: Challenge) => void;
}

export function DailyChallenge({ onCompleteChallenge }: DailyChallengeProps) {
  const [challengeState, setChallengeState] = useState<ChallengeState>(loadChallengeState);

  // 計算今天完成了幾個
  const completedCount = challengeState.completed.length;
  const totalChallenges = DAILY_CHALLENGES.length;

  // 計算今天省下的總金額
  const todaySaved = useMemo(() => {
    return Object.values(challengeState.skippedAmounts).reduce((sum, amt) => sum + amt, 0);
  }, [challengeState.skippedAmounts]);

  // 完成挑戰
  const handleComplete = useCallback((challenge: Challenge) => {
    if (challengeState.completed.includes(challenge.id)) return;

    const newState: ChallengeState = {
      ...challengeState,
      completed: [...challengeState.completed, challenge.id],
      skippedAmounts: {
        ...challengeState.skippedAmounts,
        [challenge.id]: challenge.targetAmount
      }
    };

    setChallengeState(newState);
    saveChallengeState(newState);
    onCompleteChallenge(challenge);
  }, [challengeState, onCompleteChallenge]);

  // 所有都完成了
  const allCompleted = completedCount === totalChallenges;

  return (
    <div className="bg-gray-800/40 rounded-2xl p-4">
      {/* 標題與進度 */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-gray-400 text-sm">🎯 今日挑戰</div>
        <div className="text-sm">
          <span className={completedCount > 0 ? 'text-emerald-400 font-medium' : 'text-gray-500'}>
            {completedCount}/{totalChallenges}
          </span>
          {todaySaved > 0 && (
            <span className="text-emerald-400 ml-2">省 ${todaySaved}</span>
          )}
        </div>
      </div>

      {/* 挑戰列表 */}
      {allCompleted ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-emerald-400 font-bold">今日挑戰全部完成！</div>
          <div className="text-gray-500 text-sm">今天省下了 ${todaySaved}，太棒了！</div>
        </div>
      ) : (
        <div className="space-y-2">
          {DAILY_CHALLENGES.map((challenge) => {
            const isCompleted = challengeState.completed.includes(challenge.id);
            
            return (
              <div
                key={challenge.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">{challenge.icon}</div>
                  <div>
                    <div className={`text-sm font-medium ${isCompleted ? 'text-emerald-400 line-through' : 'text-white'}`}>
                      {challenge.name}
                    </div>
                    <div className="text-gray-500 text-xs">{challenge.description}</div>
                  </div>
                </div>
                
                {isCompleted ? (
                  <div className="text-emerald-400 text-sm">✓ 完成</div>
                ) : (
                  <button
                    onClick={() => handleComplete(challenge)}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/30 transition-all"
                  >
                    完成
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Export for use in other components
export { DAILY_CHALLENGES };
export type { Challenge, ChallengeState };
