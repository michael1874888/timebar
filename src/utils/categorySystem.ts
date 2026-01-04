/**
 * CategorySystem - 分類標準化系統
 * v2.1: 提供預設分類定義、分類管理功能
 */

import { Category } from '@/types';
import { Storage } from '@/utils/storage';

const CUSTOM_CATEGORIES_KEY = 'timebar_custom_categories';
const HIDDEN_CATEGORIES_KEY = 'timebar_hidden_categories';

// 預設分類
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: '飲食',
    icon: '🍽️',
    color: '#f97316', // orange-500
    type: 'default',
    sortOrder: 1
  },
  {
    id: 'transport',
    name: '交通',
    icon: '🚗',
    color: '#3b82f6', // blue-500
    type: 'default',
    sortOrder: 2
  },
  {
    id: 'entertainment',
    name: '娛樂',
    icon: '🎮',
    color: '#a855f7', // purple-500
    type: 'default',
    sortOrder: 3
  },
  {
    id: 'housing',
    name: '居住',
    icon: '🏠',
    color: '#eab308', // yellow-500
    type: 'default',
    sortOrder: 4
  },
  {
    id: 'health',
    name: '健康',
    icon: '💊',
    color: '#22c55e', // green-500
    type: 'default',
    sortOrder: 5
  },
  {
    id: 'education',
    name: '學習',
    icon: '📚',
    color: '#06b6d4', // cyan-500
    type: 'default',
    sortOrder: 6
  },
  {
    id: 'subscription',
    name: '訂閱',
    icon: '📱',
    color: '#ec4899', // pink-500
    type: 'default',
    sortOrder: 7
  },
  {
    id: 'other',
    name: '其他',
    icon: '📦',
    color: '#6b7280', // gray-500
    type: 'default',
    sortOrder: 8
  }
];

export const CategorySystem = {
  /**
   * 取得所有分類（預設 + 自訂，排除隱藏）
   */
  getCategories(): Category[] {
    const customCategories = this.getCustomCategories();
    const hiddenIds = this.getHiddenCategoryIds();
    
    const allCategories = [
      ...DEFAULT_CATEGORIES.map(c => ({
        ...c,
        isHidden: hiddenIds.includes(c.id)
      })),
      ...customCategories
    ];
    
    return allCategories
      .filter(c => !c.isHidden)
      .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
  },

  /**
   * 取得所有分類（包含隱藏）
   */
  getAllCategories(): Category[] {
    const customCategories = this.getCustomCategories();
    const hiddenIds = this.getHiddenCategoryIds();
    
    return [
      ...DEFAULT_CATEGORIES.map(c => ({
        ...c,
        isHidden: hiddenIds.includes(c.id)
      })),
      ...customCategories
    ].sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
  },

  /**
   * 取得自訂分類
   */
  getCustomCategories(): Category[] {
    const saved = Storage.load(CUSTOM_CATEGORIES_KEY);
    return Array.isArray(saved) ? saved : [];
  },

  /**
   * 取得隱藏的分類 ID
   */
  getHiddenCategoryIds(): string[] {
    const saved = Storage.load(HIDDEN_CATEGORIES_KEY);
    return Array.isArray(saved) ? saved : [];
  },

  /**
   * 新增自訂分類
   */
  addCustomCategory(category: Omit<Category, 'type'>): Category {
    const newCategory: Category = {
      ...category,
      type: 'custom',
      sortOrder: category.sortOrder || 100 + this.getCustomCategories().length
    };
    
    const customs = this.getCustomCategories();
    customs.push(newCategory);
    Storage.save(CUSTOM_CATEGORIES_KEY, customs);
    
    return newCategory;
  },

  /**
   * 移除自訂分類
   */
  removeCustomCategory(id: string): boolean {
    const customs = this.getCustomCategories();
    const index = customs.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    customs.splice(index, 1);
    Storage.save(CUSTOM_CATEGORIES_KEY, customs);
    return true;
  },

  /**
   * 切換分類顯示/隱藏
   */
  toggleCategoryVisibility(id: string): boolean {
    const hiddenIds = this.getHiddenCategoryIds();
    const index = hiddenIds.indexOf(id);
    
    if (index === -1) {
      hiddenIds.push(id);
    } else {
      hiddenIds.splice(index, 1);
    }
    
    Storage.save(HIDDEN_CATEGORIES_KEY, hiddenIds);
    return index === -1; // 返回是否現在是隱藏狀態
  },

  /**
   * 根據 ID 取得分類
   */
  getCategoryById(id: string): Category | undefined {
    return this.getAllCategories().find(c => c.id === id);
  },

  /**
   * 根據 ID 取得分類顯示資訊
   */
  getCategoryDisplay(id: string): { icon: string; name: string; color: string } {
    const category = this.getCategoryById(id);
    if (category) {
      return { icon: category.icon, name: category.name, color: category.color };
    }
    // 如果找不到，嘗試從舊的 mapping 找
    return { icon: '📦', name: id || '其他', color: '#6b7280' };
  }
};
