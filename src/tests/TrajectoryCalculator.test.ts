import { describe, it, expect } from 'vitest';
import { TrajectoryCalculator } from '@/layers/2-domain/calculators/TrajectoryCalculator';
import type { UserData, Record } from '@/types';

const createMockUserData = (overrides: Partial<UserData> = {}): UserData => ({
  age: 25,
  salary: 80000,
  retireAge: 60,
  currentSavings: 100000,
  monthlySavings: 30000,
  inflationRate: 2.5,
  roiRate: 6,
  ...overrides,
});

describe('TrajectoryCalculator', () => {
  describe('calculateStartDate', () => {
    it('使用 createdAt 當第一筆記錄在 7 天內', () => {
      const userData = createMockUserData({
        createdAt: '2026-01-01T00:00:00.000Z',
      });
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
        userData,
        records
      );

      expect(result).toBe('2026-01-01T00:00:00.000Z');
    });

    it('使用 firstRecord - 7天 當超過 7 天才記帳', () => {
      const userData = createMockUserData({
        createdAt: '2026-01-01T00:00:00.000Z',
      });
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
        userData,
        records
      );

      // 2026-01-20 往前推 7 天 = 2026-01-13
      expect(new Date(result).getDate()).toBe(13);
      expect(new Date(result).getMonth()).toBe(0); // January
    });

    it('沒有記錄時返回 createdAt', () => {
      const userData = createMockUserData({
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      const records: Record[] = [];

      const result = TrajectoryCalculator.calculateStartDate(
        userData,
        records
      );

      expect(result).toBe('2026-01-01T00:00:00.000Z');
    });

    it('沒有 createdAt 時使用當前時間', () => {
      const userData = createMockUserData({});
      const records: Record[] = [];

      const result = TrajectoryCalculator.calculateStartDate(
        userData,
        records
      );

      const resultDate = new Date(result);
      const now = new Date();
      const diffMs = Math.abs(now.getTime() - resultDate.getTime());

      // 應該在 1 秒內
      expect(diffMs).toBeLessThan(1000);
    });
  });

  describe('calculateMonthsElapsed', () => {
    it('正確計算經過的月數（精確到小數）', () => {
      const startDate = '2026-01-01T00:00:00.000Z';
      // 假設現在是 2026-01-31（經過 1 個月）
      const mockNow = new Date('2026-01-31T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateMonthsElapsed(startDate);

      // 30 天 / 30.44 (平均每月天數) ≈ 0.986
      expect(result).toBeCloseTo(0.986, 2);

      Date.now = originalNow;
    });

    it('3個月後計算正確', () => {
      const startDate = '2026-01-01T00:00:00.000Z';
      const mockNow = new Date('2026-04-01T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateMonthsElapsed(startDate);

      // 90 天 / 30.44 ≈ 2.96
      expect(result).toBeCloseTo(2.96, 2);

      Date.now = originalNow;
    });

    it('處理小於 1 個月的情況', () => {
      const startDate = '2026-01-01T00:00:00.000Z';
      const mockNow = new Date('2026-01-08T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateMonthsElapsed(startDate);

      // 7 天 / 30.44 ≈ 0.23
      expect(result).toBeCloseTo(0.23, 2);

      Date.now = originalNow;
    });
  });
});
