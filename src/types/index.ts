// TimeBar 類型定義

export interface UserData {
  age: number;
  salary: number;
  retireAge: number;
  currentSavings: number;
  monthlySavings: number;
  inflationRate: number;
  roiRate: number;
  targetRetirementFund?: number;
}

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
}

export type Screen = 'loading' | 'onboarding' | 'main' | 'history' | 'settings';

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
