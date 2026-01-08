/**
 * TimeBar - useSync Hook
 * Layer 3 (Business Layer) - 雲端同步
 */

import { useState, useCallback, useEffect } from 'react';
import { googleSheetsAPI, type SyncStatus, type RecordDTO, type UserDataDTO } from '@data/api';

export interface UseSyncResult {
  /** 同步狀態 */
  status: SyncStatus;
  /** 最後同步時間 */
  lastSyncTime: Date | null;
  /** 是否已配置 */
  isConfigured: boolean;
  /** 同步所有數據 */
  syncAll: () => Promise<void>;
  /** 同步用戶數據 */
  syncUserData: (data: UserDataDTO) => Promise<void>;
  /** 同步單筆記錄 */
  syncRecord: (record: RecordDTO) => Promise<void>;
  /** 設定 API URL */
  setApiUrl: (url: string) => void;
}

/**
 * 雲端同步 Hook
 */
export function useSync(): UseSyncResult {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isConfigured, setIsConfigured] = useState(googleSheetsAPI.isConfigured());

  // 檢查配置狀態
  useEffect(() => {
    setIsConfigured(googleSheetsAPI.isConfigured());
  }, []);

  // 同步所有數據
  const syncAll = useCallback(async () => {
    if (!isConfigured) return;

    setStatus('syncing');
    try {
      const result = await googleSheetsAPI.getAll();
      if (result.success) {
        setStatus('synced');
        setLastSyncTime(new Date());
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setStatus('offline');
    }
  }, [isConfigured]);

  // 同步用戶數據
  const syncUserData = useCallback(
    async (data: UserDataDTO) => {
      if (!isConfigured) return;

      setStatus('syncing');
      try {
        const result = await googleSheetsAPI.saveUserData(data);
        if (result.success) {
          setStatus('synced');
          setLastSyncTime(new Date());
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('User data sync failed:', error);
        setStatus('offline');
      }
    },
    [isConfigured]
  );

  // 同步單筆記錄
  const syncRecord = useCallback(
    async (record: RecordDTO) => {
      if (!isConfigured) return;

      try {
        await googleSheetsAPI.saveRecord(record);
        setLastSyncTime(new Date());
      } catch (error) {
        console.error('Record sync failed:', error);
      }
    },
    [isConfigured]
  );

  // 設定 API URL
  const setApiUrl = useCallback((url: string) => {
    googleSheetsAPI.setApiUrl(url);
    setIsConfigured(true);
  }, []);

  return {
    status,
    lastSyncTime,
    isConfigured,
    syncAll,
    syncUserData,
    syncRecord,
    setApiUrl,
  };
}

export default useSync;
