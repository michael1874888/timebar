/**
 * Progressive Disclosure System (漸進式揭露系統)
 *
 * 根據用戶使用天數和記帳次數逐步解鎖功能，降低新手學習曲線
 *
 * 解鎖時機：
 * - Quick Actions (快速記帳): 3筆記錄後解鎖
 * - Daily Challenges (每日挑戰): 第2天後解鎖
 * - Gamification (遊戲化系統): 第7天 + 10筆記錄後解鎖
 */

import type { UserData, Record as RecordType } from '@/types';

/**
 * 功能解鎖狀態
 */
export interface UnlockStatus {
  quickActions: boolean;      // 快速記帳按鈕
  challenges: boolean;         // 每日挑戰
  gamification: boolean;       // 遊戲化系統（積分、道具）
}

/**
 * 功能解鎖信息
 */
export interface FeatureUnlockInfo {
  isUnlocked: boolean;         // 是否已解鎖
  progress: number;            // 解鎖進度 (0-1)
  requirement: string;         // 解鎖條件描述
  daysRemaining?: number;      // 剩餘天數
  recordsRemaining?: number;   // 剩餘記錄數
}

/**
 * 計算用戶使用天數
 * @param userData 用戶資料
 * @returns 使用天數（如果沒有 createdAt 則返回 Infinity 表示已解鎖所有功能）
 */
export function calculateDaysSinceOnboarding(userData: UserData): number {
  if (!userData.createdAt) {
    // 舊用戶沒有 createdAt，默認已使用很久，所有功能解鎖
    return Infinity;
  }

  const createdDate = new Date(userData.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 檢查快速記帳功能是否解鎖
 * 條件：至少有 3 筆記錄
 */
export function isQuickActionsUnlocked(records: RecordType[]): FeatureUnlockInfo {
  const recordCount = records.length;
  const requiredRecords = 3;
  const isUnlocked = recordCount >= requiredRecords;

  return {
    isUnlocked,
    progress: Math.min(recordCount / requiredRecords, 1),
    requirement: `記帳 ${requiredRecords} 次後解鎖`,
    recordsRemaining: isUnlocked ? 0 : requiredRecords - recordCount,
  };
}

/**
 * 檢查每日挑戰功能是否解鎖
 * 條件：使用滿 2 天
 */
export function isChallengesUnlocked(userData: UserData): FeatureUnlockInfo {
  const daysSince = calculateDaysSinceOnboarding(userData);
  const requiredDays = 2;
  const isUnlocked = daysSince >= requiredDays;

  return {
    isUnlocked,
    progress: Math.min(daysSince / requiredDays, 1),
    requirement: `使用 ${requiredDays} 天後解鎖`,
    daysRemaining: isUnlocked ? 0 : Math.max(0, requiredDays - daysSince),
  };
}

/**
 * 檢查遊戲化系統是否解鎖
 * 條件：使用滿 7 天 且 至少有 10 筆記錄
 */
export function isGamificationUnlocked(userData: UserData, records: RecordType[]): FeatureUnlockInfo {
  const daysSince = calculateDaysSinceOnboarding(userData);
  const recordCount = records.length;

  const requiredDays = 7;
  const requiredRecords = 10;

  const daysUnlocked = daysSince >= requiredDays;
  const recordsUnlocked = recordCount >= requiredRecords;
  const isUnlocked = daysUnlocked && recordsUnlocked;

  const daysProgress = Math.min(daysSince / requiredDays, 1);
  const recordsProgress = Math.min(recordCount / requiredRecords, 1);
  const progress = Math.min(daysProgress, recordsProgress);

  return {
    isUnlocked,
    progress,
    requirement: `使用 ${requiredDays} 天且記帳 ${requiredRecords} 次後解鎖`,
    daysRemaining: daysUnlocked ? 0 : Math.max(0, requiredDays - daysSince),
    recordsRemaining: recordsUnlocked ? 0 : Math.max(0, requiredRecords - recordCount),
  };
}

/**
 * 獲取所有功能的解鎖狀態
 */
export function getUnlockStatus(userData: UserData, records: RecordType[]): UnlockStatus {
  return {
    quickActions: isQuickActionsUnlocked(records).isUnlocked,
    challenges: isChallengesUnlocked(userData).isUnlocked,
    gamification: isGamificationUnlocked(userData, records).isUnlocked,
  };
}

/**
 * 檢查是否有新功能剛剛解鎖
 * 用於觸發解鎖慶祝動畫
 *
 * @param oldRecordCount 舊記錄數量
 * @param newRecordCount 新記錄數量
 * @param userData 用戶資料
 * @returns 剛解鎖的功能名稱（如果有的話）
 */
export function checkNewUnlock(
  oldRecordCount: number,
  newRecordCount: number,
  userData: UserData
): string | null {
  // Quick Actions: 從 2 筆記錄變成 3 筆
  if (oldRecordCount < 3 && newRecordCount >= 3) {
    return 'quickActions';
  }

  // Gamification: 從 9 筆記錄變成 10 筆（且天數已滿足）
  const daysSince = calculateDaysSinceOnboarding(userData);
  if (oldRecordCount < 10 && newRecordCount >= 10 && daysSince >= 7) {
    return 'gamification';
  }

  return null;
}

/**
 * 獲取功能解鎖的顯示信息
 */
export function getFeatureUnlockMessage(featureName: string): {
  title: string;
  description: string;
  icon: string;
} {
  switch (featureName) {
    case 'quickActions':
      return {
        title: '🎉 解鎖快速記帳！',
        description: '你可以在主畫面設置常用的快速記帳按鈕了',
        icon: '⚡',
      };
    case 'challenges':
      return {
        title: '🎉 解鎖每日挑戰！',
        description: '完成挑戰可以獲得積分和成就感',
        icon: '🎯',
      };
    case 'gamification':
      return {
        title: '🎉 解鎖遊戲化系統！',
        description: '記帳、存錢、完成挑戰都能獲得積分，兌換專屬道具',
        icon: '🎮',
      };
    default:
      return {
        title: '🎉 新功能解鎖！',
        description: '繼續探索 TimeBar 的更多功能',
        icon: '✨',
      };
  }
}

