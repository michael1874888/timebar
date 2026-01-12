
import { describe, it, expect, vi } from 'vitest';
import { TrajectoryCalculator, TrajectoryParams } from '../TrajectoryCalculator';
import { FinanceCalculator } from '../FinanceCalculator';
import type { RecordItem } from '../../types/calculator.types';

describe('TrajectoryCalculator', () => {
  // 基本參數設置
  const baseParams: TrajectoryParams = {
    salary: 100000,
    currentSavings: 1000000,
    targetRetireAge: 60,
    currentAge: 30,
    inflationRate: 2,
    roiRate: 5,
  };

  // 模擬 FinanceCalculator
  vi.spyOn(FinanceCalculator, 'requiredMonthlySavings').mockReturnValue(20000); // 假設目標儲蓄 2萬
  vi.spyOn(FinanceCalculator, 'monthlyToFund').mockReturnValue(30000000); // 假設退休金 3000萬
  vi.spyOn(FinanceCalculator, 'calculateTimeCost').mockImplementation((gap) => gap > 0 ? 0.5 : -0.5); // 簡單模擬偏差

  describe('calculateActualMonthlySavings', () => {
    it('應只計算 type="save" 的記錄總和', () => {
      const records: RecordItem[] = [
        { type: 'spend', amount: 5000, timeCost: 0, isRecurring: false }, // 消費
        { type: 'save', amount: 10000, timeCost: 0, isRecurring: false }, // 儲蓄
        { type: 'save', amount: 5000, timeCost: 0, isRecurring: false },  // 儲蓄
      ] as any;

      const result = TrajectoryCalculator.calculateActualMonthlySavings(records);
      expect(result).toBe(15000); // 10000 + 5000
    });

    it('如果沒有儲蓄記錄應回傳 0', () => {
      const records: RecordItem[] = [
        { type: 'spend', amount: 5000, timeCost: 0, isRecurring: false },
      ] as any;

      const result = TrajectoryCalculator.calculateActualMonthlySavings(records);
      expect(result).toBe(0);
    });
  });

  describe('calculateMonthlySavingsStatus (剩餘預算邏輯)', () => {
    // 情境：月薪 10萬，目標儲蓄 2萬

    it('情境 A：完美達標 (存2萬，花5萬)', () => {
      const records: RecordItem[] = [
        { type: 'save', amount: 20000, timeCost: 0, isRecurring: false }, // 存 2萬
        { type: 'spend', amount: 50000, timeCost: 0, isRecurring: false }, // 花 5萬
      ] as any;

      const result = TrajectoryCalculator.calculateMonthlySavingsStatus(baseParams, records);

      expect(result.requiredMonthlySavings).toBe(20000);
      expect(result.actualMonthlySavings).toBe(20000);
      expect(result.savingsGap).toBe(0);
      // 剩餘預算 = 10萬 - 5萬(花) - max(2萬, 2萬) = 3萬
      expect(result.remainingBudget).toBe(30000);
      expect(result.progressPercent).toBe(100);
    });

    it('情境 B：超額儲蓄 (存3萬，花5萬)', () => {
      const records: RecordItem[] = [
        { type: 'save', amount: 30000, timeCost: 0, isRecurring: false }, // 存 3萬
        { type: 'spend', amount: 50000, timeCost: 0, isRecurring: false }, // 花 5萬
      ] as any;

      const result = TrajectoryCalculator.calculateMonthlySavingsStatus(baseParams, records);

      expect(result.actualMonthlySavings).toBe(30000);
      expect(result.savingsGap).toBe(-10000); // 領先 1萬
      // 剩餘預算 = 10萬 - 5萬(花) - max(2萬, 3萬) = 2萬
      // 因為多存了1萬，物理上可花的錢變少了，這是正確的
      expect(result.remainingBudget).toBe(20000);
      expect(result.progressPercent).toBe(150);
    });

    it('情境 C：儲蓄不足 (存1萬，花5萬)', () => {
      const records: RecordItem[] = [
        { type: 'save', amount: 10000, timeCost: 0, isRecurring: false }, // 存 1萬
        { type: 'spend', amount: 50000, timeCost: 0, isRecurring: false }, // 花 5萬
      ] as any;

      const result = TrajectoryCalculator.calculateMonthlySavingsStatus(baseParams, records);

      expect(result.actualMonthlySavings).toBe(10000);
      expect(result.savingsGap).toBe(10000); // 落後 1萬
      // 剩餘預算 = 10萬 - 5萬(花) - max(2萬, 1萬) = 3萬
      // 雖然物理上還有 4萬 (10-1-5)，但為了達成目標，系統應顯示剩餘 3萬
      // 這樣用戶才不會把該存的錢花掉
      expect(result.remainingBudget).toBe(30000);
      expect(result.progressPercent).toBe(50);
    });

    it('情境 D：完全沒存 (存0，花5萬)', () => {
      const records: RecordItem[] = [
        { type: 'spend', amount: 50000, timeCost: 0, isRecurring: false }, // 花 5萬
      ] as any;

      const result = TrajectoryCalculator.calculateMonthlySavingsStatus(baseParams, records);

      expect(result.actualMonthlySavings).toBe(0);
      // 剩餘預算 = 10萬 - 5萬 - max(2萬, 0) = 3萬
      expect(result.remainingBudget).toBe(30000);
      expect(result.progressPercent).toBe(0);
    });

    it('情境 F：表面達標但實際超支 (存2萬，花9萬)', () => {
      // 這是 "Net Worth Logic" 的關鍵測試
      // 月薪 10萬，存 2萬(達標)，但花 9萬
      // 現金流 = 10 - 2 - 9 = -1萬 (赤字)
      // 有效儲蓄應該被赤字抵銷： 2萬 + (-1萬) = 1萬 (變為未達標)
      
      const records: RecordItem[] = [
        { type: 'save', amount: 20000, timeCost: 0, isRecurring: false }, // 存 2萬
        { type: 'spend', amount: 90000, timeCost: 0, isRecurring: false }, // 花 9萬
      ] as any;

      const result = TrajectoryCalculator.calculateMonthlySavingsStatus(baseParams, records);

      expect(result.actualMonthlySavings).toBe(10000); // 2萬 - 1萬赤字
      expect(result.savingsGap).toBe(10000); // 落後 1萬
      expect(result.remainingBudget).toBe(-10000); // 顯示赤字
      expect(result.progressPercent).toBe(50); // 只有 50% 達成率
    });

    it('情境 G：嚴重超支導致負儲蓄 (存0，花12萬)', () => {
      // 月薪 10萬，花 12萬
      // 現金流 = -2萬
      // 有效儲蓄 = 0 - 2萬 = -2萬
      
      const records: RecordItem[] = [
        { type: 'spend', amount: 120000, timeCost: 0, isRecurring: false }, // 花 12萬
      ] as any;

      const result = TrajectoryCalculator.calculateMonthlySavingsStatus(baseParams, records);

      expect(result.actualMonthlySavings).toBe(-20000);
      expect(result.savingsGap).toBe(40000); // 距離目標 2萬 還有 4萬差距
      expect(result.remainingBudget).toBe(-20000);
      expect(result.progressPercent).toBe(-100);
    });
  });
});
