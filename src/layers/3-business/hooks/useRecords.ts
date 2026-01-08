/**
 * TimeBar - useRecords Hook
 * Layer 3 (Business Layer) - 記錄管理
 */

import { useState, useCallback, useMemo } from 'react';
import type { RecordDTO } from '@data/api';

export interface UseRecordsResult {
  /** 記錄列表 */
  records: RecordDTO[];
  /** 添加記錄 */
  addRecord: (record: Omit<RecordDTO, 'id' | 'timestamp' | 'date'>) => RecordDTO;
  /** 更新記錄 */
  updateRecord: (id: string, updates: Partial<RecordDTO>) => void;
  /** 刪除記錄 */
  deleteRecord: (id: string) => void;
  /** 按日期分組 */
  recordsByDate: Map<string, RecordDTO[]>;
  /** 按類別分組 */
  recordsByCategory: Map<string, RecordDTO[]>;
  /** 取得今日記錄 */
  todayRecords: RecordDTO[];
  /** 取得本月記錄 */
  monthRecords: RecordDTO[];
  /** 計算總儲蓄 */
  totalSaved: number;
  /** 計算總消費 */
  totalSpent: number;
}

/**
 * 記錄管理 Hook
 */
export function useRecords(initialRecords: RecordDTO[] = []): UseRecordsResult {
  const [records, setRecords] = useState<RecordDTO[]>(initialRecords);

  // 添加記錄
  const addRecord = useCallback(
    (record: Omit<RecordDTO, 'id' | 'timestamp' | 'date'>): RecordDTO => {
      const now = new Date();
      const newRecord: RecordDTO = {
        ...record,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
        createdAt: Date.now(),
      };
      setRecords((prev) => [...prev, newRecord]);
      return newRecord;
    },
    []
  );

  // 更新記錄
  const updateRecord = useCallback(
    (id: string, updates: Partial<RecordDTO>): void => {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
        )
      );
    },
    []
  );

  // 刪除記錄
  const deleteRecord = useCallback((id: string): void => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // 按日期分組
  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, RecordDTO[]>();
    records.forEach((r) => {
      const existing = grouped.get(r.date) || [];
      grouped.set(r.date, [...existing, r]);
    });
    return grouped;
  }, [records]);

  // 按類別分組
  const recordsByCategory = useMemo(() => {
    const grouped = new Map<string, RecordDTO[]>();
    records.forEach((r) => {
      const existing = grouped.get(r.category) || [];
      grouped.set(r.category, [...existing, r]);
    });
    return grouped;
  }, [records]);

  // 今日記錄
  const todayRecords = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return records.filter((r) => r.date === today);
  }, [records]);

  // 本月記錄
  const monthRecords = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return records.filter((r) => r.date.startsWith(monthStart));
  }, [records]);

  // 計算總儲蓄
  const totalSaved = useMemo(() => {
    return records
      .filter((r) => r.type === 'save')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records]);

  // 計算總消費
  const totalSpent = useMemo(() => {
    return records
      .filter((r) => r.type === 'spend' && !r.guiltFree)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records]);

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    recordsByDate,
    recordsByCategory,
    todayRecords,
    monthRecords,
    totalSaved,
    totalSpent,
  };
}

export default useRecords;
