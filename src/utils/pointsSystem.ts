/**
 * TimeBar v2.0 - 積分系統
 * 管理積分餘額、增減、驗證
 */

import { Storage } from './storage';

// LocalStorage key
const POINTS_KEY = 'timebar_points';

// 積分系統狀態
let pointsBalance = 0;

/**
 * 積分系統
 */
export const PointsSystem = {
  /**
   * 獲取當前積分餘額
   */
  getBalance(): number {
    return pointsBalance;
  },

  /**
   * 設置積分餘額（用於初始化）
   */
  setBalance(amount: number): void {
    pointsBalance = Math.max(0, amount);
    this.save();
  },

  /**
   * 增加積分
   * @param amount 增加的積分數量
   * @param source 積分來源（用於追蹤）
   * @returns 增加後的新餘額
   */
  addPoints(amount: number, source: string = 'unknown'): number {
    if (amount <= 0) return pointsBalance;
    
    pointsBalance += amount;
    this.save();
    
    console.log(`[PointsSystem] +${amount} 積分 (來源: ${source}), 新餘額: ${pointsBalance}`);
    return pointsBalance;
  },

  /**
   * 扣除積分
   * @param amount 扣除的積分數量
   * @param reason 扣除原因
   * @returns 是否成功扣除
   */
  spendPoints(amount: number, reason: string = 'unknown'): boolean {
    if (amount <= 0) return false;
    if (!this.hasEnough(amount)) {
      console.warn(`[PointsSystem] 積分不足! 需要: ${amount}, 擁有: ${pointsBalance}`);
      return false;
    }

    pointsBalance -= amount;
    this.save();
    
    console.log(`[PointsSystem] -${amount} 積分 (原因: ${reason}), 新餘額: ${pointsBalance}`);
    return true;
  },

  /**
   * 驗證是否有足夠積分
   */
  hasEnough(amount: number): boolean {
    return pointsBalance >= amount;
  },

  /**
   * 儲存到 localStorage
   */
  save(): void {
    Storage.save(POINTS_KEY, pointsBalance);
  },

  /**
   * 從 localStorage 載入
   * @returns 載入的積分餘額
   */
  load(): number {
    const saved = Storage.load(POINTS_KEY);
    pointsBalance = typeof saved === 'number' ? saved : 0;
    console.log(`[PointsSystem] 載入積分: ${pointsBalance}`);
    return pointsBalance;
  },

  /**
   * 重置積分（用於測試或重置資料）
   */
  reset(): void {
    pointsBalance = 0;
    this.save();
  }
};

// 初始化時載入積分
PointsSystem.load();
