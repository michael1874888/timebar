/**
 * TimeBar v2.0 - 庫存系統
 * 管理道具庫存、增減、使用
 */

import { Storage } from './storage';
import { Inventory, ShopItem } from '@/types';

// LocalStorage key
const INVENTORY_KEY = 'timebar_inventory';

// 預設庫存
const DEFAULT_INVENTORY: Inventory = {
  guiltFreePass: 0
};

// 商店道具定義
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'guilt_free_pass',
    name: '免死金牌',
    description: '使用後，一筆消費不計入「生命殺手」統計',
    icon: '🎫',
    cost: 300,  // 300 積分（約 7-10 天可獲得）
    type: 'consumable',
    effect: 'exclude_from_negative_stats'
  }
  // 未來可擴充其他道具
];

// 庫存狀態
let inventory: Inventory = { ...DEFAULT_INVENTORY };

/**
 * 庫存系統
 */
export const InventorySystem = {
  /**
   * 獲取道具數量
   */
  getItemCount(itemId: string): number {
    if (itemId === 'guilt_free_pass') {
      return inventory.guiltFreePass;
    }
    return 0;
  },

  /**
   * 獲取整個庫存
   */
  getInventory(): Inventory {
    return { ...inventory };
  },

  /**
   * 設置庫存（用於初始化）
   */
  setInventory(newInventory: Inventory): void {
    inventory = { ...DEFAULT_INVENTORY, ...newInventory };
    this.save();
  },

  /**
   * 增加道具
   */
  addItem(itemId: string, count: number = 1): void {
    if (count <= 0) return;

    if (itemId === 'guilt_free_pass') {
      inventory.guiltFreePass += count;
      this.save();
      console.log(`[InventorySystem] +${count} 免死金牌, 庫存: ${inventory.guiltFreePass}`);
    }
  },

  /**
   * 使用道具
   * @returns 是否成功使用
   */
  useItem(itemId: string): boolean {
    if (!this.hasItem(itemId)) {
      console.warn(`[InventorySystem] 沒有道具: ${itemId}`);
      return false;
    }

    if (itemId === 'guilt_free_pass') {
      inventory.guiltFreePass -= 1;
      this.save();
      console.log(`[InventorySystem] 使用免死金牌, 剩餘: ${inventory.guiltFreePass}`);
      return true;
    }

    return false;
  },

  /**
   * 檢查是否擁有道具
   */
  hasItem(itemId: string): boolean {
    return this.getItemCount(itemId) > 0;
  },

  /**
   * 儲存到 localStorage
   */
  save(): void {
    Storage.save(INVENTORY_KEY, inventory);
  },

  /**
   * 從 localStorage 載入
   */
  load(): Inventory {
    const saved = Storage.load(INVENTORY_KEY) as Inventory | null;
    inventory = saved ? { ...DEFAULT_INVENTORY, ...saved } : { ...DEFAULT_INVENTORY };
    console.log(`[InventorySystem] 載入庫存:`, inventory);
    return inventory;
  },

  /**
   * 重置庫存
   */
  reset(): void {
    inventory = { ...DEFAULT_INVENTORY };
    this.save();
  }
};

// 初始化時載入庫存
InventorySystem.load();
