/**
 * CategoryMapping - 舊分類遷移對應表
 * v2.1: 將非標準分類映射到標準分類 ID
 */

import { Record as RecordType } from '@/types';
import { DEFAULT_CATEGORIES } from './categorySystem';
import { Storage } from './storage';

// 舊分類到新分類的映射表
export const LEGACY_CATEGORY_MAPPING: { [key: string]: string } = {
  // 飲食相關
  'food': 'food',
  'Food': 'food',
  'FOOD': 'food',
  '飲食': 'food',
  '食物': 'food',
  '吃飯': 'food',
  '餐飲': 'food',
  '外食': 'food',
  '早餐': 'food',
  '午餐': 'food',
  '晚餐': 'food',
  '宵夜': 'food',
  '零食': 'food',
  '飲料': 'food',
  '咖啡': 'food',
  
  // 交通相關
  'transport': 'transport',
  'Transport': 'transport',
  '交通': 'transport',
  '通勤': 'transport',
  '油費': 'transport',
  '加油': 'transport',
  '捷運': 'transport',
  '公車': 'transport',
  'Uber': 'transport',
  '計程車': 'transport',
  
  // 娛樂相關
  'entertainment': 'entertainment',
  'Entertainment': 'entertainment',
  '娛樂': 'entertainment',
  '遊戲': 'entertainment',
  '電影': 'entertainment',
  '旅遊': 'entertainment',
  '休閒': 'entertainment',
  
  // 居住相關
  'housing': 'housing',
  'Housing': 'housing',
  '居住': 'housing',
  '房租': 'housing',
  '水電': 'housing',
  '網路': 'housing',
  '電信': 'housing',
  
  // 健康相關
  'health': 'health',
  'Health': 'health',
  '健康': 'health',
  '醫療': 'health',
  '看病': 'health',
  '藥品': 'health',
  '保健': 'health',
  '運動': 'health',
  '健身': 'health',
  
  // 學習相關
  'education': 'education',
  'Education': 'education',
  '學習': 'education',
  '教育': 'education',
  '課程': 'education',
  '書籍': 'education',
  '進修': 'education',
  
  // 訂閱相關
  'subscription': 'subscription',
  'Subscription': 'subscription',
  '訂閱': 'subscription',
  'Netflix': 'subscription',
  'Spotify': 'subscription',
  'YouTube': 'subscription',
  
  // 其他
  'other': 'other',
  'Other': 'other',
  '其他': 'other',
  '雜項': 'other',
  '': 'other',
};

const MIGRATION_FLAG_KEY = 'timebar_category_migrated';

export const CategoryMigration = {
  /**
   * 映射舊分類到新分類
   */
  mapCategory(oldCategory: string): string {
    // 先檢查映射表
    if (LEGACY_CATEGORY_MAPPING[oldCategory]) {
      return LEGACY_CATEGORY_MAPPING[oldCategory];
    }
    
    // 檢查是否已經是有效的分類 ID
    const validIds = DEFAULT_CATEGORIES.map(c => c.id);
    if (validIds.includes(oldCategory)) {
      return oldCategory;
    }
    
    // 嘗試模糊匹配（小寫比對）
    const lowerCategory = oldCategory.toLowerCase();
    const fuzzyMatch = Object.entries(LEGACY_CATEGORY_MAPPING).find(
      ([key]) => key.toLowerCase() === lowerCategory
    );
    if (fuzzyMatch) {
      return fuzzyMatch[1];
    }
    
    // 無法識別，歸類為「其他」
    return 'other';
  },

  /**
   * 遷移單筆記錄的分類
   */
  migrateRecord(record: RecordType): RecordType {
    const mappedCategory = this.mapCategory(record.category);
    if (mappedCategory !== record.category) {
      return {
        ...record,
        category: mappedCategory,
        updatedAt: Date.now()
      };
    }
    return record;
  },

  /**
   * 遷移所有記錄的分類
   * @returns 遷移後的記錄陣列和遷移數量
   */
  migrateAllRecords(records: RecordType[]): { records: RecordType[]; migratedCount: number } {
    let migratedCount = 0;
    const migratedRecords = records.map(record => {
      const mappedCategory = this.mapCategory(record.category);
      if (mappedCategory !== record.category) {
        migratedCount++;
        return {
          ...record,
          category: mappedCategory,
          updatedAt: Date.now()
        };
      }
      return record;
    });
    
    return { records: migratedRecords, migratedCount };
  },

  /**
   * 檢查是否已經執行過遷移
   */
  hasMigrated(): boolean {
    return Storage.load(MIGRATION_FLAG_KEY) === true;
  },

  /**
   * 標記已完成遷移
   */
  markMigrated(): void {
    Storage.save(MIGRATION_FLAG_KEY, true);
  },

  /**
   * 執行一次性遷移（如果尚未執行）
   */
  runMigrationIfNeeded(records: RecordType[]): { records: RecordType[]; migratedCount: number } {
    if (this.hasMigrated()) {
      return { records, migratedCount: 0 };
    }
    
    const result = this.migrateAllRecords(records);
    
    if (result.migratedCount > 0) {
      console.log(`[CategoryMigration] Migrated ${result.migratedCount} records to standard categories`);
    }
    
    this.markMigrated();
    return result;
  }
};
