import { useMemo } from 'react';
import { Milestone } from '@/types';

// 里程碑定義
const MILESTONES: Milestone[] = [
  { id: 'half_day', name: '半天自由', hoursNeeded: 4, icon: '☀️' },
  { id: 'one_day', name: '一天自由', hoursNeeded: 8, icon: '📅' },
  { id: 'three_days', name: '三天假期', hoursNeeded: 24, icon: '🏕️' },
  { id: 'one_week', name: '一週假期', hoursNeeded: 40, icon: '🏖️' },
  { id: 'two_weeks', name: '兩週旅行', hoursNeeded: 80, icon: '✈️' },
  { id: 'one_month', name: '一個月自由', hoursNeeded: 176, icon: '🌴' },
  { id: 'three_months', name: '一季悠閒', hoursNeeded: 528, icon: '🌸' },
  { id: 'half_year', name: '半年時光', hoursNeeded: 1056, icon: '🌞' },
  { id: 'one_year', name: '一整年自由', hoursNeeded: 2112, icon: '🚀' },
];

interface MilestoneDisplayProps {
  totalSavedHours: number;
}

export function MilestoneDisplay({ totalSavedHours }: MilestoneDisplayProps) {
  // 計算已解鎖和下一個里程碑
  const { unlocked, next, progress } = useMemo(() => {
    const unlockedMilestones: Milestone[] = [];
    let nextMilestone: Milestone | null = null;
    let progressPercent = 0;

    for (const milestone of MILESTONES) {
      if (totalSavedHours >= milestone.hoursNeeded) {
        unlockedMilestones.push({ ...milestone, isUnlocked: true });
      } else {
        if (!nextMilestone) {
          nextMilestone = milestone;
          const prevHours = unlockedMilestones.length > 0
            ? unlockedMilestones[unlockedMilestones.length - 1].hoursNeeded
            : 0;
          const range = milestone.hoursNeeded - prevHours;
          const current = totalSavedHours - prevHours;
          progressPercent = Math.max(0, Math.min(100, (current / range) * 100));
        }
      }
    }

    return {
      unlocked: unlockedMilestones,
      next: nextMilestone,
      progress: progressPercent
    };
  }, [totalSavedHours]);

  // 如果沒有儲蓄，顯示起始狀態
  if (totalSavedHours <= 0) {
    return (
      <div className="bg-gray-800/40 rounded-2xl p-4">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-2">🎯 開始解鎖你的自由里程碑</div>
          <div className="flex gap-2 justify-center flex-wrap">
            {MILESTONES.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="px-3 py-1.5 bg-gray-700/50 rounded-lg text-gray-500 text-sm"
              >
                {m.icon} {m.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 rounded-2xl p-4">
      {/* 已解鎖里程碑 */}
      {unlocked.length > 0 && (
        <div className="mb-3">
          <div className="text-emerald-400 text-sm mb-2">✅ 已解鎖</div>
          <div className="flex gap-2 flex-wrap">
            {unlocked.map((m) => (
              <div
                key={m.id}
                className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm"
              >
                {m.icon} {m.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 下一個里程碑進度 */}
      {next && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="text-gray-400 text-sm">🔜 下一個: {next.icon} {next.name}</div>
            <div className="text-gray-500 text-xs">{Math.round(progress)}%</div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-gray-500 text-xs mt-1 text-right">
            還需 {Math.round(next.hoursNeeded - totalSavedHours)} 小時
          </div>
        </div>
      )}

      {/* 全部解鎖 */}
      {!next && unlocked.length === MILESTONES.length && (
        <div className="text-center py-2">
          <div className="text-2xl mb-1">🎉</div>
          <div className="text-emerald-400 font-bold">所有里程碑已解鎖！</div>
          <div className="text-gray-500 text-sm">你已經贏回了超過一年的自由！</div>
        </div>
      )}
    </div>
  );
}
