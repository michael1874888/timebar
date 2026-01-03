// TimeBar 類型定義

// ==================== 挑戰系統 ====================

/** 挑戰定義（可自定義） */
export interface ChallengeDefinition {
  id: string;                // UUID
  name: string;              // "忍住不買手搖飲"
  description: string;       // "今天不買飲料，省下約 $60"
  icon: string;              // "🧋"
  defaultAmount: number;     // 60 (預設省下金額)
  energyReward: number;      // 10 (完成可得積分)
  category: string;          // "food" (對應支出分類)
}

/** 每日挑戰狀態 */
export interface ChallengeState {
  date: string;                         // "2026-01-03"
  completed: string[];                  // ["skip_coffee", "walk_instead"]
  totalEarnedToday: number;            // 今天獲得的總積分
}

// ==================== 積分系統 ====================

/** 積分交易記錄（未來擴充用） */
export interface PointsTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  source: string;           // "daily_challenge" | "streak_bonus" | "shop"
  timestamp: string;
  relatedId?: string;       // 關聯的挑戰 ID 或道具 ID
}

/** 道具定義 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;              // 積分價格
  type: 'consumable' | 'permanent';  // 可消耗 vs 永久
  effect?: string;           // 效果描述
}

/** 用戶庫存 */
export interface Inventory {
  guiltFreePass: number;     // 免死金牌數量
  // 未來可擴充其他道具
}

// ==================== 用戶數據 ====================

export interface UserData {
  age: number;
  salary: number;
  retireAge: number;
  currentSavings: number;
  monthlySavings: number;
  inflationRate: number;
  roiRate: number;
  targetRetirementFund?: number;
  
  // v2.0 新增欄位
  pointsBalance?: number;              // 積分餘額
  inventory?: Inventory;               // 道具庫存
  customChallenges?: ChallengeDefinition[];  // 自定義挑戰
}

// ==================== 記帳系統 ====================

export interface Record {
  id: string;
  type: 'spend' | 'save';
  amount: number;
  isRecurring: boolean;
  timeCost: number;
  category: string;
  note: string;
  timestamp: string;
  date: string;
  guiltFree?: boolean;       // v2.0: 是否使用免死金牌豁免
}

export type Screen = 'loading' | 'onboarding' | 'dashboard' | 'tracker' | 'history' | 'settings' | 'shop' | 'challenge-settings';

export interface GPSResult {
  estimatedAge: number;
  ageDiff: number;
  ageDiffDays: number;
  isAhead: boolean;
  isBehind: boolean;
  isOnTrack: boolean;
  totalSavedHours: number;
  totalSpentHours: number;
}

export interface TimeFormatted {
  value: number;
  unit: string;
  color: string;
}

// 里程碑類型
export interface Milestone {
  id: string;
  name: string;
  hoursNeeded: number;
  icon: string;
  isUnlocked?: boolean;
}

// 節省記錄
export interface SkippedPurchase {
  id: string;
  amount: number;
  workingHours: number;
  timestamp: string;
}

