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

  describe('calculateActualSavings', () => {
    it('推算收入 = 月薪 × 經過月數', () => {
      const userData = createMockUserData({
        salary: 80000,
      });
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 5000,
          isRecurring: false,
          timeCost: 5,
          category: 'food',
          note: '',
          timestamp: '2026-01-15T00:00:00.000Z',
          date: '2026-01-15',
        },
      ];
      const monthsElapsed = 1;

      const result = TrajectoryCalculator.calculateActualSavings(
        userData,
        records,
        monthsElapsed
      );

      // 80,000 × 1 - 5,000 = 75,000
      expect(result).toBe(75000);
    });

    it('排除 guiltFree 記錄', () => {
      const userData = createMockUserData({
        salary: 80000,
      });
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 5000,
          isRecurring: false,
          timeCost: 5,
          category: 'food',
          note: '',
          timestamp: '2026-01-15T00:00:00.000Z',
          date: '2026-01-15',
        },
        {
          id: '2',
          type: 'spend',
          amount: 3000,
          isRecurring: false,
          timeCost: 3,
          category: 'food',
          note: '',
          timestamp: '2026-01-16T00:00:00.000Z',
          date: '2026-01-16',
          guiltFree: true, // 使用免死金牌
        },
      ];
      const monthsElapsed = 1;

      const result = TrajectoryCalculator.calculateActualSavings(
        userData,
        records,
        monthsElapsed
      );

      // 80,000 × 1 - 5,000 = 75,000 (不計 guiltFree)
      expect(result).toBe(75000);
    });

    it('排除 ended 訂閱', () => {
      const userData = createMockUserData({
        salary: 80000,
      });
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 5000,
          isRecurring: false,
          timeCost: 5,
          category: 'food',
          note: '',
          timestamp: '2026-01-15T00:00:00.000Z',
          date: '2026-01-15',
        },
        {
          id: '2',
          type: 'spend',
          amount: 200,
          isRecurring: true,
          timeCost: 2,
          category: 'entertainment',
          note: '',
          timestamp: '2026-01-16T00:00:00.000Z',
          date: '2026-01-16',
          recurringStatus: 'ended',
        },
      ];
      const monthsElapsed = 1;

      const result = TrajectoryCalculator.calculateActualSavings(
        userData,
        records,
        monthsElapsed
      );

      // 80,000 × 1 - 5,000 = 75,000 (不計 ended 訂閱)
      expect(result).toBe(75000);
    });

    it('處理多筆記錄', () => {
      const userData = createMockUserData({
        salary: 80000,
      });
      const records: Record[] = [
        { id: '1', type: 'spend', amount: 5000, isRecurring: false, timeCost: 5, category: 'food', note: '', timestamp: '2026-01-15T00:00:00.000Z', date: '2026-01-15' },
        { id: '2', type: 'spend', amount: 3000, isRecurring: false, timeCost: 3, category: 'transport', note: '', timestamp: '2026-01-16T00:00:00.000Z', date: '2026-01-16' },
        { id: '3', type: 'spend', amount: 10000, isRecurring: false, timeCost: 10, category: 'housing', note: '', timestamp: '2026-01-17T00:00:00.000Z', date: '2026-01-17' },
      ];
      const monthsElapsed = 2;

      const result = TrajectoryCalculator.calculateActualSavings(
        userData,
        records,
        monthsElapsed
      );

      // 80,000 × 2 - (5,000 + 3,000 + 10,000) = 142,000
      expect(result).toBe(142000);
    });
  });

  describe('calculateDeviation', () => {
    const createMockUserDataForDeviation = (): UserData => ({
      age: 25,
      salary: 80000,
      retireAge: 60,
      currentSavings: 100000,
      monthlySavings: 30000,
      inflationRate: 2.5,
      roiRate: 6,
      targetRetirementFund: 10000000,
      createdAt: '2026-01-01T00:00:00.000Z',
      trajectoryStartDate: '2026-01-01T00:00:00.000Z',
    });

    it('返回超前狀態當實際儲蓄 > 目標儲蓄', () => {
      const userData = createMockUserDataForDeviation();
      // 模擬經過 1 個月，應該存 30,000，實際存了 50,000（只花 30,000）
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 30000,
          isRecurring: false,
          timeCost: 30,
          category: 'food',
          note: '',
          timestamp: '2026-01-15T00:00:00.000Z',
          date: '2026-01-15',
        },
      ];

      // Mock Date.now() 為 1 個月後
      const mockNow = new Date('2026-02-01T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateDeviation({
        userData,
        records,
      });

      expect(result.isAhead).toBe(true);
      expect(result.isBehind).toBe(false);
      expect(result.deviation).toBeGreaterThan(0);
      expect(result.deviationHours).toBeGreaterThan(0);

      Date.now = originalNow;
    });

    it('返回落後狀態當實際儲蓄 < 目標儲蓄', () => {
      const userData = createMockUserDataForDeviation();
      // 模擬經過 1 個月，應該存 30,000，但花了 60,000（實際儲蓄 20,000）
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 60000,
          isRecurring: false,
          timeCost: 60,
          category: 'food',
          note: '',
          timestamp: '2026-01-15T00:00:00.000Z',
          date: '2026-01-15',
        },
      ];

      const mockNow = new Date('2026-02-01T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateDeviation({
        userData,
        records,
      });

      expect(result.isAhead).toBe(false);
      expect(result.isBehind).toBe(true);
      expect(result.deviation).toBeLessThan(0);
      expect(result.deviationHours).toBeLessThan(0);

      Date.now = originalNow;
    });

    it('處理歷史偏差疊加', () => {
      const userData = createMockUserDataForDeviation();
      userData.historicalDeviationHours = -100; // 歷史落後 100 小時（負數表示落後）

      // 模擬花費剛好符合預算（50,000），所以當前持平
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 50000, // 剛好花費預算金額（80,000 - 30,000）
          isRecurring: false,
          timeCost: 50,
          category: 'food',
          note: '',
          timestamp: '2026-01-15T00:00:00.000Z',
          date: '2026-01-15',
        },
      ];

      const mockNow = new Date('2026-02-01T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateDeviation({
        userData,
        records,
      });

      // 即使當前持平，也應該因為歷史偏差而顯示落後
      expect(result.deviationHours).toBeLessThan(0);

      Date.now = originalNow;
    });

    it('處理剛開始（沒有記錄）的情況', () => {
      const userData = createMockUserDataForDeviation();
      const records: Record[] = [];

      // 剛完成 onboarding（經過 1 小時）
      const mockNow = new Date('2026-01-01T01:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateDeviation({
        userData,
        records,
      });

      expect(result.monthsElapsed).toBeLessThan(0.01); // 接近 0
      expect(result.isOnTrack).toBe(true); // 應該顯示「在軌道上」
      expect(Math.abs(result.deviation)).toBeLessThan(1000); // 偏差很小

      Date.now = originalNow;
    });

    it('計算包含所有必要字段', () => {
      const userData = createMockUserDataForDeviation();
      const records: Record[] = [];

      const mockNow = new Date('2026-02-01T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateDeviation({
        userData,
        records,
      });

      // 驗證返回值包含所有必要字段
      expect(result).toHaveProperty('targetAccumulatedSavings');
      expect(result).toHaveProperty('actualAccumulatedSavings');
      expect(result).toHaveProperty('deviation');
      expect(result).toHaveProperty('deviationHours');
      expect(result).toHaveProperty('deviationDays');
      expect(result).toHaveProperty('deviationYears');
      expect(result).toHaveProperty('isOnTrack');
      expect(result).toHaveProperty('isAhead');
      expect(result).toHaveProperty('isBehind');
      expect(result).toHaveProperty('monthsElapsed');
      expect(result).toHaveProperty('requiredMonthlySavings');
      expect(result).toHaveProperty('startDate');

      Date.now = originalNow;
    });

    it('返回正確的 startDate 格式（ISO 8601）', () => {
      const userData = createMockUserDataForDeviation();
      const records: Record[] = [];

      const mockNow = new Date('2026-02-01T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateDeviation({
        userData,
        records,
      });

      // 驗證 startDate 是有效的 ISO 8601 字串
      expect(result.startDate).toBe('2026-01-01T00:00:00.000Z');
      expect(new Date(result.startDate).toISOString()).toBe(result.startDate);

      Date.now = originalNow;
    });

    it('使用 userData.trajectoryStartDate 作為優先的起始日期', () => {
      const userData = createMockUserDataForDeviation();
      userData.trajectoryStartDate = '2025-12-15T00:00:00.000Z'; // 比 createdAt 更早

      const records: Record[] = [];

      const mockNow = new Date('2026-02-01T00:00:00.000Z');
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = TrajectoryCalculator.calculateDeviation({
        userData,
        records,
      });

      // 應該使用 trajectoryStartDate
      expect(result.startDate).toBe('2025-12-15T00:00:00.000Z');

      Date.now = originalNow;
    });
  });
});
