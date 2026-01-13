import { describe, it, expect } from 'vitest';
import { TrajectoryCalculator } from '@/layers/2-domain/calculators/TrajectoryCalculator';
import type { UserData, Record } from '@/types';

describe('TrajectoryCalculator', () => {
  describe('calculateStartDate', () => {
    it('使用 createdAt 當第一筆記錄在 7 天內', () => {
      const userData: Partial<UserData> = {
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 100,
          isRecurring: false,
          timeCost: 1,
          category: 'food',
          note: '',
          timestamp: '2026-01-05T12:00:00.000Z',
          date: '2026-01-05',
        },
      ];

      const result = TrajectoryCalculator.calculateStartDate(
        userData as UserData,
        records
      );

      expect(result).toBe('2026-01-01T00:00:00.000Z');
    });

    it('使用 firstRecord - 7天 當超過 7 天才記帳', () => {
      const userData: Partial<UserData> = {
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 100,
          isRecurring: false,
          timeCost: 1,
          category: 'food',
          note: '',
          timestamp: '2026-01-20T12:00:00.000Z',
          date: '2026-01-20',
        },
      ];

      const result = TrajectoryCalculator.calculateStartDate(
        userData as UserData,
        records
      );

      // 2026-01-20 往前推 7 天 = 2026-01-13
      expect(new Date(result).getDate()).toBe(13);
      expect(new Date(result).getMonth()).toBe(0); // January
    });

    it('沒有記錄時返回 createdAt', () => {
      const userData: Partial<UserData> = {
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const records: Record[] = [];

      const result = TrajectoryCalculator.calculateStartDate(
        userData as UserData,
        records
      );

      expect(result).toBe('2026-01-01T00:00:00.000Z');
    });

    it('沒有 createdAt 時使用當前時間', () => {
      const userData: Partial<UserData> = {};
      const records: Record[] = [];

      const result = TrajectoryCalculator.calculateStartDate(
        userData as UserData,
        records
      );

      const resultDate = new Date(result);
      const now = new Date();
      const diffMs = Math.abs(now.getTime() - resultDate.getTime());

      // 應該在 1 秒內
      expect(diffMs).toBeLessThan(1000);
    });
  });
});
