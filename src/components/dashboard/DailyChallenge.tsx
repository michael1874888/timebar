import { useState, useMemo, useCallback, useEffect } from 'react';
import { Storage } from '@/utils/storage';
import { ChallengeDefinition } from '@/types';

const CUSTOM_CHALLENGES_KEY = 'timebar_custom_challenges';

// 預設每日挑戰定義（含積分獎勵）
const DAILY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'skip_coffee',
    name: '自備飲品',
    description: '帶自己的飲料，守住 $100 ☕',
    defaultAmount: 100,
    energyReward: 10,
    icon: '☕',
    category: 'food'
  },
  {
    id: 'skip_snack',
    name: '健康選擇',
    description: '選擇不買零食，贏回 $50 💪',
    defaultAmount: 50,
    energyReward: 10,
    icon: '🍪',
    category: 'food'
  },
  {
    id: 'walk_instead',
    name: '綠色出行',
    description: '步行或騎車，省下 $30 還更健康 🌿',
    defaultAmount: 30,
    energyReward: 10,
    icon: '🚶',
    category: 'transport'
  },
  {
    id: 'cook_home',
    name: '主廚日',
    description: '自己動手做餐，省 $150 還更美味 👨‍🍳',
    defaultAmount: 150,
    energyReward: 10,
    icon: '🍳',
    category: 'food'
  }
];

// LocalStorage key
const CHALLENGE_STATE_KEY = 'timebar_daily_challenges';

// 內部挑戰狀態（含 totalEarnedToday）
interface InternalChallengeState {
  date: string;
  completed: string[];
  totalEarnedToday: number;
}

// 取得今天日期
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// 載入挑戰狀態
const loadChallengeState = (): InternalChallengeState => {
  const saved = Storage.load(CHALLENGE_STATE_KEY) as InternalChallengeState | null;
  const today = getTodayDate();
  
  // 如果是新的一天，重置挑戰
  if (!saved || saved.date !== today) {
    return {
      date: today,
      completed: [],
      totalEarnedToday: 0
    };
  }
  
  return {
    ...saved,
    totalEarnedToday: saved.totalEarnedToday ?? 0
  };
};

// 儲存挑戰狀態
const saveChallengeState = (state: InternalChallengeState): void => {
  Storage.save(CHALLENGE_STATE_KEY, state);
};

// 完成挑戰的回傳結果
export interface ChallengeCompleteResult {
  points: number;           // 獲得的積分
  amount: number;           // 省下的金額
  showRecordPrompt: boolean; // 是否顯示記帳提示
}

interface DailyChallengeProps {
  onCompleteChallenge: (challenge: ChallengeDefinition, result: ChallengeCompleteResult) => void;
  totalPoints?: number; // 目前總積分（用於顯示）
}

export function DailyChallenge({ onCompleteChallenge, totalPoints = 0 }: DailyChallengeProps) {
  const [challengeState, setChallengeState] = useState<InternalChallengeState>(loadChallengeState);
  const [customChallenges, setCustomChallenges] = useState<ChallengeDefinition[]>([]);
  const [deletedDefaults, setDeletedDefaults] = useState<string[]>([]);
  const [modifiedDefaults, setModifiedDefaults] = useState<Record<string, ChallengeDefinition>>({});

  // 載入自定義挑戰和預設挑戰的修改
  useEffect(() => {
    const savedCustom = Storage.load(CUSTOM_CHALLENGES_KEY);
    if (Array.isArray(savedCustom)) {
      setCustomChallenges(savedCustom);
    }

    const savedDeleted = Storage.load('timebar_deleted_default_challenges');
    if (Array.isArray(savedDeleted)) {
      setDeletedDefaults(savedDeleted);
    }

    const savedModified = Storage.load('timebar_modified_default_challenges');
    if (savedModified && typeof savedModified === 'object') {
      setModifiedDefaults(savedModified as Record<string, ChallengeDefinition>);
    }
  }, []);

  // v2.0: 跨日自動重置機制
  useEffect(() => {
    const checkAndResetAtMidnight = () => {
      const now = new Date();
      const currentDate = getTodayDate();

      // 如果當前日期與儲存的日期不同，重置挑戰
      if (challengeState.date !== currentDate) {
        const newState: InternalChallengeState = {
          date: currentDate,
          completed: [],
          totalEarnedToday: 0
        };
        setChallengeState(newState);
        saveChallengeState(newState);
        console.log('[DailyChallenge] 新的一天，挑戰已重置');
      }

      // 計算到下一個午夜的毫秒數
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      // 在午夜時重新檢查
      const timer = setTimeout(() => {
        checkAndResetAtMidnight();
      }, msUntilMidnight);

      return () => clearTimeout(timer);
    };

    const cleanup = checkAndResetAtMidnight();
    return cleanup;
  }, [challengeState.date]);

  // 合併預設（套用修改、排除刪除）+ 自定義挑戰
  const allChallenges = useMemo(() => {
    const effectiveDefaults = DAILY_CHALLENGES
      .filter(c => !deletedDefaults.includes(c.id))
      .map(c => modifiedDefaults[c.id] || c);
    return [...effectiveDefaults, ...customChallenges];
  }, [customChallenges, deletedDefaults, modifiedDefaults]);

  // 計算今天完成了幾個
  const completedCount = challengeState.completed.length;
  const totalChallenges = allChallenges.length;

  // 計算今天獲得的總積分
  const { todayEarned, todaySaved } = useMemo(() => {
    let earned = 0;
    let saved = 0;
    challengeState.completed.forEach(id => {
      const challenge = allChallenges.find(c => c.id === id);
      if (challenge) {
        earned += challenge.energyReward;
        saved += challenge.defaultAmount;
      }
    });
    return { todayEarned: earned, todaySaved: saved };
  }, [challengeState.completed, allChallenges]);

  // 完成挑戰
  const handleComplete = useCallback((challenge: ChallengeDefinition) => {
    if (challengeState.completed.includes(challenge.id)) return;

    const newState: InternalChallengeState = {
      ...challengeState,
      completed: [...challengeState.completed, challenge.id],
      totalEarnedToday: (challengeState.totalEarnedToday || 0) + challenge.energyReward
    };

    setChallengeState(newState);
    saveChallengeState(newState);
    
    // 回傳結果給父組件，讓父組件處理積分增加和記帳提示
    onCompleteChallenge(challenge, {
      points: challenge.energyReward,
      amount: challenge.defaultAmount,
      showRecordPrompt: true // 詢問是否記帳
    });
  }, [challengeState, onCompleteChallenge]);

  // 所有都完成了
  const allCompleted = completedCount === totalChallenges;

  return (
    <div className="bg-gray-800/40 rounded-2xl p-4">
      {/* 標題與進度 */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">🎯 今日挑戰</span>
          {totalPoints > 0 && (
            <span className="text-amber-400 text-xs bg-amber-500/20 px-2 py-0.5 rounded-full">
              ⏳ {totalPoints}
            </span>
          )}
        </div>
        <div className="text-sm flex items-center gap-2">
          <span className={completedCount > 0 ? 'text-emerald-400 font-medium' : 'text-gray-500'}>
            {completedCount}/{totalChallenges}
          </span>
          {todayEarned > 0 && (
            <span className="text-amber-400">+{todayEarned} ⏳</span>
          )}
        </div>
      </div>

      {/* 挑戰列表 */}
      {allCompleted ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-emerald-400 font-bold">今日挑戰全部完成！</div>
          <div className="text-amber-400 text-sm">獲得 {todayEarned} ⏳ 時間沙</div>
          <div className="text-gray-500 text-xs mt-1">今天省下了 ${todaySaved}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {allChallenges.map((challenge) => {
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
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    <span>+{challenge.energyReward}</span>
                    <span>⏳</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleComplete(challenge)}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                  >
                    完成
                    <span className="text-amber-400 text-xs">+{challenge.energyReward}⏳</span>
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
