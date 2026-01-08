/**
 * TimeBar - GPS 狀態 Hook
 * Layer 3 (Business Layer) - 封裝 GPS 計算邏輯
 */

import { useMemo } from 'react';
import { GPSCalculator, TimeCalculator } from '@domain/calculators';
import type { RecordItem, GPSStatus } from '@domain/types';

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
}

/**
 * GPS 狀態 Hook
 *
 * @example
 * const { estimatedAge, status, isAhead } = useGPS({
 *   targetRetireAge: 65,
 *   records: myRecords,
 * });
 */
export function useGPS(params: {
  targetRetireAge: number;
  records: RecordItem[];
}): UseGPSResult {
  const { targetRetireAge, records } = params;

  // 計算 GPS 狀態
  const gpsResult = useMemo(() => {
    return GPSCalculator.calculateEstimatedAge(targetRetireAge, records);
  }, [targetRetireAge, records]);

  // 計算天數
  const dayStats = useMemo(() => {
    const savedDays = Math.round(gpsResult.totalSavedHours / 8);
    const spentDays = Math.round(gpsResult.totalSpentHours / 8);
    return {
      savedDays,
      spentDays,
      netDays: savedDays - spentDays,
    };
  }, [gpsResult.totalSavedHours, gpsResult.totalSpentHours]);

  // 格式化年齡差距
  const formattedAgeDiff = useMemo(() => {
    return TimeCalculator.formatAgeDiff(gpsResult.ageDiff);
  }, [gpsResult.ageDiff]);

  return {
    estimatedAge: gpsResult.estimatedAge,
    ageDiff: gpsResult.ageDiff,
    ageDiffDays: gpsResult.ageDiffDays,
    status: gpsResult.status,
    isAhead: gpsResult.isAhead,
    isBehind: gpsResult.isBehind,
    isOnTrack: gpsResult.isOnTrack,
    totalSavedHours: gpsResult.totalSavedHours,
    totalSpentHours: gpsResult.totalSpentHours,
    savedDays: dayStats.savedDays,
    spentDays: dayStats.spentDays,
    netDays: dayStats.netDays,
    formattedAgeDiff,
  };
}

export default useGPS;
