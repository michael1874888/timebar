/**
 * Progressive Disclosure System Tests (漸進式揭露系統測試)
 *
 * 測試功能解鎖邏輯，確保新手引導流程正確運作
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateDaysSinceOnboarding,
  isQuickActionsUnlocked,
  isChallengesUnlocked,
  isGamificationUnlocked,
  getUnlockStatus,
  checkNewUnlock,
  getFeatureUnlockMessage,
} from '@/utils/progressiveDisclosure';
import type { UserData, Record as RecordType } from '@/types';

describe('Progressive Disclosure System', () => {
  // 測試用資料
  const createUserData = (daysAgo: number): UserData => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    return {
      age: 30,
      salary: 50000,
      retireAge: 65,
      currentSavings: 0,
      monthlySavings: 10000,
      inflationRate: 2.5,
      roiRate: 6,
      createdAt: createdAt.toISOString(),
    };
  };

  const createRecords = (count: number): RecordType[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `record-${i}`,
      type: 'spend' as const,
      amount: 100,
      isRecurring: false,
      timeCost: 1,
      category: 'food',
      note: '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    }));
  };

  describe('calculateDaysSinceOnboarding', () => {
    it('應正確計算使用天數', () => {
      const userData = createUserData(5);
      const days = calculateDaysSinceOnboarding(userData);
      expect(days).toBe(5);
    });

    it('新用戶（今天註冊）應返回 0 天', () => {
      const userData = createUserData(0);
      const days = calculateDaysSinceOnboarding(userData);
      expect(days).toBe(0);
    });

    it('舊用戶（無 createdAt）應返回 Infinity（所有功能解鎖）', () => {
      const userData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: 2.5,
        roiRate: 6,
        // 沒有 createdAt
      };
      const days = calculateDaysSinceOnboarding(userData);
      expect(days).toBe(Infinity);
    });
  });

  describe('isQuickActionsUnlocked (快速記帳)', () => {
    it('3 筆記錄後應解鎖', () => {
      const records = createRecords(3);
      const result = isQuickActionsUnlocked(records);

      expect(result.isUnlocked).toBe(true);
      expect(result.progress).toBe(1);
      expect(result.recordsRemaining).toBe(0);
    });

    it('少於 3 筆記錄時不應解鎖', () => {
      const records = createRecords(2);
      const result = isQuickActionsUnlocked(records);

      expect(result.isUnlocked).toBe(false);
      expect(result.progress).toBeCloseTo(2 / 3);
      expect(result.recordsRemaining).toBe(1);
    });

    it('0 筆記錄時進度應為 0', () => {
      const records = createRecords(0);
      const result = isQuickActionsUnlocked(records);

      expect(result.isUnlocked).toBe(false);
      expect(result.progress).toBe(0);
      expect(result.recordsRemaining).toBe(3);
    });

    it('超過要求的記錄數時進度應限制為 1', () => {
      const records = createRecords(10);
      const result = isQuickActionsUnlocked(records);

      expect(result.isUnlocked).toBe(true);
      expect(result.progress).toBe(1);
    });
  });

  describe('isChallengesUnlocked (每日挑戰)', () => {
    it('使用滿 2 天後應解鎖', () => {
      const userData = createUserData(2);
      const result = isChallengesUnlocked(userData);

      expect(result.isUnlocked).toBe(true);
      expect(result.progress).toBe(1);
      expect(result.daysRemaining).toBe(0);
    });

    it('使用不滿 2 天時不應解鎖', () => {
      const userData = createUserData(1);
      const result = isChallengesUnlocked(userData);

      expect(result.isUnlocked).toBe(false);
      expect(result.progress).toBe(0.5);
      expect(result.daysRemaining).toBe(1);
    });

    it('新用戶（第 0 天）不應解鎖', () => {
      const userData = createUserData(0);
      const result = isChallengesUnlocked(userData);

      expect(result.isUnlocked).toBe(false);
      expect(result.progress).toBe(0);
      expect(result.daysRemaining).toBe(2);
    });

    it('舊用戶（無 createdAt）應自動解鎖', () => {
      const userData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: 2.5,
        roiRate: 6,
      };
      const result = isChallengesUnlocked(userData);

      expect(result.isUnlocked).toBe(true);
      expect(result.progress).toBe(1);
    });
  });

  describe('isGamificationUnlocked (遊戲化系統)', () => {
    it('使用滿 7 天且有 10 筆記錄時應解鎖', () => {
      const userData = createUserData(7);
      const records = createRecords(10);
      const result = isGamificationUnlocked(userData, records);

      expect(result.isUnlocked).toBe(true);
      expect(result.progress).toBe(1);
      expect(result.daysRemaining).toBe(0);
      expect(result.recordsRemaining).toBe(0);
    });

    it('天數滿足但記錄不足時不應解鎖', () => {
      const userData = createUserData(10);
      const records = createRecords(5);
      const result = isGamificationUnlocked(userData, records);

      expect(result.isUnlocked).toBe(false);
      expect(result.daysRemaining).toBe(0);
      expect(result.recordsRemaining).toBe(5);
    });

    it('記錄滿足但天數不足時不應解鎖', () => {
      const userData = createUserData(3);
      const records = createRecords(15);
      const result = isGamificationUnlocked(userData, records);

      expect(result.isUnlocked).toBe(false);
      expect(result.daysRemaining).toBe(4);
      expect(result.recordsRemaining).toBe(0);
    });

    it('兩個條件都不滿足時不應解鎖', () => {
      const userData = createUserData(3);
      const records = createRecords(5);
      const result = isGamificationUnlocked(userData, records);

      expect(result.isUnlocked).toBe(false);
      expect(result.daysRemaining).toBe(4);
      expect(result.recordsRemaining).toBe(5);
    });

    it('進度應取兩個條件中較小的值', () => {
      const userData = createUserData(3); // 3/7 = 0.428
      const records = createRecords(10); // 10/10 = 1
      const result = isGamificationUnlocked(userData, records);

      // 應該使用較小的進度（天數進度）
      expect(result.progress).toBeCloseTo(3 / 7, 2);
    });
  });

  describe('getUnlockStatus (綜合狀態)', () => {
    it('新用戶所有功能都未解鎖', () => {
      const userData = createUserData(0);
      const records = createRecords(0);
      const status = getUnlockStatus(userData, records);

      expect(status.quickActions).toBe(false);
      expect(status.challenges).toBe(false);
      expect(status.gamification).toBe(false);
    });

    it('使用 2 天 + 3 筆記錄應解鎖快速記帳和每日挑戰', () => {
      const userData = createUserData(2);
      const records = createRecords(3);
      const status = getUnlockStatus(userData, records);

      expect(status.quickActions).toBe(true);
      expect(status.challenges).toBe(true);
      expect(status.gamification).toBe(false);
    });

    it('使用 7 天 + 10 筆記錄應解鎖所有功能', () => {
      const userData = createUserData(7);
      const records = createRecords(10);
      const status = getUnlockStatus(userData, records);

      expect(status.quickActions).toBe(true);
      expect(status.challenges).toBe(true);
      expect(status.gamification).toBe(true);
    });

    it('舊用戶（無 createdAt）所有功能都應解鎖', () => {
      const userData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: 2.5,
        roiRate: 6,
      };
      const records = createRecords(0);
      const status = getUnlockStatus(userData, records);

      expect(status.quickActions).toBe(false); // 仍需要 3 筆記錄
      expect(status.challenges).toBe(true);    // 天數條件自動滿足
      expect(status.gamification).toBe(false); // 仍需要 10 筆記錄
    });
  });

  describe('checkNewUnlock (檢測新解鎖)', () => {
    it('從 2 筆變成 3 筆記錄時應檢測到快速記帳解鎖', () => {
      const userData = createUserData(0);
      const feature = checkNewUnlock(2, 3, userData);

      expect(feature).toBe('quickActions');
    });

    it('從 9 筆變成 10 筆記錄且使用滿 7 天時應檢測到遊戲化解鎖', () => {
      const userData = createUserData(7);
      const feature = checkNewUnlock(9, 10, userData);

      expect(feature).toBe('gamification');
    });

    it('從 9 筆變成 10 筆記錄但使用不滿 7 天時不應檢測到遊戲化解鎖', () => {
      const userData = createUserData(3);
      const feature = checkNewUnlock(9, 10, userData);

      expect(feature).toBeNull();
    });

    it('記錄數沒有跨越解鎖閾值時應返回 null', () => {
      const userData = createUserData(0);
      const feature = checkNewUnlock(1, 2, userData);

      expect(feature).toBeNull();
    });

    it('記錄數減少時不應觸發解鎖', () => {
      const userData = createUserData(0);
      const feature = checkNewUnlock(3, 2, userData);

      expect(feature).toBeNull();
    });
  });

  describe('getFeatureUnlockMessage (解鎖訊息)', () => {
    it('快速記帳解鎖訊息應正確', () => {
      const message = getFeatureUnlockMessage('quickActions');

      expect(message.title).toContain('快速記帳');
      expect(message.icon).toBe('⚡');
      expect(message.description).toBeTruthy();
    });

    it('每日挑戰解鎖訊息應正確', () => {
      const message = getFeatureUnlockMessage('challenges');

      expect(message.title).toContain('每日挑戰');
      expect(message.icon).toBe('🎯');
      expect(message.description).toBeTruthy();
    });

    it('遊戲化系統解鎖訊息應正確', () => {
      const message = getFeatureUnlockMessage('gamification');

      expect(message.title).toContain('遊戲化系統');
      expect(message.icon).toBe('🎮');
      expect(message.description).toBeTruthy();
    });

    it('未知功能應返回預設訊息', () => {
      const message = getFeatureUnlockMessage('unknown');

      expect(message.title).toContain('新功能解鎖');
      expect(message.icon).toBe('✨');
      expect(message.description).toBeTruthy();
    });
  });
});
