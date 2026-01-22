/**
 * TimeBar - GPS 狀態 Hook
 * Layer 3 (Business Layer) - 封裝 GPS 計算邏輯
 */

import { useMemo } from 'react';
import { TrajectoryCalculator, TimeCalculator } from '@domain/calculators';
import type { RecordItem, GPSStatus } from '@domain/types';
import type { Record, UserData } from '@/types';

export interface UseGPSResult {
  /** 預估退休年齡 */
  estimatedAge: number;
  /** 與目標的差距 (年) */
  ageDiff: number;
  /** 與目標的差距 (天) */
  ageDiffDays: number;
  /** GPS 狀態 */
  status: GPSStatus;
  /** 是否領先 */
  isAhead: boolean;
  /** 是否落後 */
  isBehind: boolean;
  /** 是否進度正常 */
  isOnTrack: boolean;
  /** 總節省時數 */
  totalSavedHours: number;
  /** 總花費時數 */
  totalSpentHours: number;
  /** 節省天數 */
  savedDays: number;
  /** 花費天數 */
  spentDays: number;
  /** 淨天數 */
  netDays: number;
  /** 格式化後的年齡差距 */
  formattedAgeDiff: { value: string; unit: string };
  /** 目標累積儲蓄金額 */
  targetAccumulatedSavings: number;
  /** 實際累積儲蓄金額 */
  actualAccumulatedSavings: number;
  /** 經過的月數 */
  monthsElapsed: number;
  /** 經過的完整週數（用於目標儲蓄計算） */
  weeksElapsed: number;
  /** 偏差金額（正=超前，負=落後） */
  deviation: number;
  /** 每月必須儲蓄金額 */
  requiredMonthlySavings: number;
  /** 軌跡追蹤起點（ISO 8601 格式） */
  startDate: string;
  /** 偏差天數（正=超前，負=落後） */
  deviationDays: number;
  /** 未分配資金（正=有餘額，負=透支） */
  unallocatedFunds: number;
}

/**
 * GPS 狀態 Hook
 *
 * @example
 * const { estimatedAge, status, isAhead } = useGPS({
 *   userData: { age: 30, salary: 50000, retireAge: 65, ... },
 *   records: myRecords,
 * });
 */
export function useGPS(params: {
  userData: Partial<UserData>;
  records: RecordItem[];
}): UseGPSResult {
  const { userData: userDataInput, records } = params;

  // Provide defaults for missing fields
  const userData: UserData = {
    age: userDataInput.age || 25,
    salary: userDataInput.salary || 50000,
    retireAge: userDataInput.retireAge || 65,
    currentSavings: userDataInput.currentSavings || 0,
    monthlySavings: userDataInput.monthlySavings || 0,
    inflationRate: userDataInput.inflationRate || 2.5,
    roiRate: userDataInput.roiRate || 6,
    targetRetirementFund: userDataInput.targetRetirementFund,
    createdAt: userDataInput.createdAt,
    trajectoryStartDate: userDataInput.trajectoryStartDate,
    historicalDeviationHours: userDataInput.historicalDeviationHours,
  };

  // Convert RecordItem[] to Record[]
  const fullRecords: Record[] = useMemo(() => {
    return records.map((r, index) => {
      // 使用記錄中的時間戳，如果沒有則使用當前時間（預覽記錄用）
      const timestamp = (r as any).timestamp || new Date().toISOString();
      const date = (r as any).date || new Date().toISOString().split('T')[0];

      return {
        id: (r as any).id || `record-${index}-${Date.now()}`,
        type: r.type,
        amount: r.amount,
        isRecurring: r.isRecurring || false,
        timeCost: r.timeCost || 0,
        category: (r as any).category || (r.type === 'save' ? '主動儲蓄' : '一般消費'),
        note: (r as any).note || '',
        timestamp,
        date,
        recurringStatus: r.recurringStatus,
      };
    });
  }, [records]);

  // 計算軌跡偏差
  const deviationResult = useMemo(() => {
    return TrajectoryCalculator.calculateDeviation({
      userData,
      records: fullRecords,
    });
  }, [userData, fullRecords]);

  // Calculate totalSavedHours and totalSpentHours directly from records
  const hourStats = useMemo(() => {
    const savedHours = records
      .filter(r => r.type === 'save')
      .reduce((sum, r) => sum + (r.timeCost || 0), 0);

    const spentHours = records
      .filter(r => r.type === 'spend' && r.recurringStatus !== 'ended')
      .reduce((sum, r) => sum + (r.timeCost || 0), 0);

    return { savedHours, spentHours };
  }, [records]);

  // 檢查是否有真實記錄（排除預覽記錄）
  // 真實記錄會有 timestamp 欄位，預覽記錄沒有
  // 使用原始 records 來檢查，因為 fullRecords 會給所有記錄生成 ID
  const hasRealRecords = records.some(r => 
    (r as any).timestamp || (r as any).id
  );

  // === GPS 狀態計算（基於 timeCost，與 GPSCalc 一致） ===
  // 儲蓄的 timeCost = 可提早退休的時數（正面影響）
  // 消費的 timeCost = 需延後退休的時數（負面影響）
  // 淨影響 = spentHours - savedHours（正=落後，負=領先）
  const netHoursImpact = hourStats.spentHours - hourStats.savedHours;
  const WORKING_HOURS_PER_YEAR = 2112; // 22天 * 8小時 * 12月
  const WORKING_HOURS_PER_DAY = 8;
  
  // 計算預估退休年齡和狀態（基於 timeCost）
  const timeCostBasedAgeDiff = hasRealRecords 
    ? -netHoursImpact / WORKING_HOURS_PER_YEAR 
    : 0;
  const estimatedAge = hasRealRecords 
    ? userData.retireAge - timeCostBasedAgeDiff
    : userData.retireAge;
  const ageDiff = timeCostBasedAgeDiff;
  
  // 使用 timeCost 計算 GPS 狀態（±1天 閾值）
  const status: GPSStatus = !hasRealRecords
    ? 'onTrack'  // 沒有記錄時，顯示準時狀態
    : netHoursImpact < -WORKING_HOURS_PER_DAY ? 'ahead'  // 省了超過1天 = 領先
    : netHoursImpact > WORKING_HOURS_PER_DAY ? 'behind'   // 花了超過1天 = 落後
    : 'onTrack';

  // 計算天數
  const dayStats = useMemo(() => {
    const savedDays = Math.round(hourStats.savedHours / 8);
    const spentDays = Math.round(hourStats.spentHours / 8);
    return {
      savedDays,
      spentDays,
      netDays: savedDays - spentDays,
    };
  }, [hourStats]);

  // 格式化年齡差距
  const formattedAgeDiff = useMemo(() => {
    return TimeCalculator.formatAgeDiff(ageDiff);
  }, [ageDiff]);

  return {
    estimatedAge,
    ageDiff,
    ageDiffDays: Math.round(ageDiff * 365),
    status,
    isAhead: deviationResult.isAhead,
    isBehind: deviationResult.isBehind,
    isOnTrack: deviationResult.isOnTrack,
    totalSavedHours: hourStats.savedHours,
    totalSpentHours: hourStats.spentHours,
    savedDays: dayStats.savedDays,
    spentDays: dayStats.spentDays,
    netDays: dayStats.netDays,
    formattedAgeDiff,
    targetAccumulatedSavings: deviationResult.targetAccumulatedSavings,
    actualAccumulatedSavings: deviationResult.actualAccumulatedSavings,
    monthsElapsed: deviationResult.monthsElapsed,
    weeksElapsed: deviationResult.weeksElapsed,
    deviation: deviationResult.deviation,
    requiredMonthlySavings: deviationResult.requiredMonthlySavings,
    startDate: deviationResult.startDate,
    deviationDays: deviationResult.deviationDays,
    // 只有在有真實記錄時才計算未分配資金
    // 避免新用戶看到「phantom money」隨時間增長
    unallocatedFunds: hasRealRecords
      ? TrajectoryCalculator.calculateUnallocatedFunds(
          userData,
          fullRecords,
          deviationResult.monthsElapsed
        )
      : 0,
  };
}

export default useGPS;
