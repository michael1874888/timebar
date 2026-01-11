/**
 * CategorySystem - 分類標準化系統
 * v2.3: 重構為純函數架構，提升可測試性和維護性
 */

import { Category } from '@/types'
import { SettingsService, SettingsSystem as SettingsSystemImport } from '@/utils/settingsSystem'

// 預設分類
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: '飲食',
    icon: '🍽️',
    color: '#f97316', // orange-500
    type: 'default',
    sortOrder: 1,
  },
  {
    id: 'transport',
    name: '交通',
    icon: '🚗',
    color: '#3b82f6', // blue-500
    type: 'default',
    sortOrder: 2,
  },
  {
    id: 'entertainment',
    name: '娛樂',
    icon: '🎮',
    color: '#a855f7', // purple-500
    type: 'default',
    sortOrder: 3,
  },
  {
    id: 'housing',
    name: '居住',
    icon: '🏠',
    color: '#eab308', // yellow-500
    type: 'default',
    sortOrder: 4,
  },
  {
    id: 'health',
    name: '健康',
    icon: '💊',
    color: '#22c55e', // green-500
    type: 'default',
    sortOrder: 5,
  },
  {
    id: 'education',
    name: '學習',
    icon: '📚',
    color: '#06b6d4', // cyan-500
    type: 'default',
    sortOrder: 6,
  },
  {
    id: 'subscription',
    name: '訂閱',
    icon: '📱',
    color: '#ec4899', // pink-500
    type: 'default',
    sortOrder: 7,
  },
  {
    id: 'other',
    name: '其他',
    icon: '📦',
    color: '#6b7280', // gray-500
    type: 'default',
    sortOrder: 8,
  },
]

// ==================== 核心服務類 ====================

/**
 * CategoryService - 分類管理服務
 * 使用純函數設計，方便測試
 */
export class CategoryService {
  constructor(private settingsService: SettingsService) {}

  /**
   * 取得所有分類（包含隱藏標記）
   * 純函數 - 不修改任何狀態
   */
  private getAllCategoriesWithHiddenFlag(): Category[] {
    const customCategories = this.settingsService.getSetting('customCategories', []) || []
    const hiddenIds = this.settingsService.getSetting('hiddenCategories', []) || []

    const allCategories = [
      ...DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        isHidden: hiddenIds.includes(c.id),
      })),
      ...customCategories,
    ]

    return allCategories.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99))
  }

  /**
   * 取得所有分類（預設 + 自訂，排除隱藏）
   */
  getCategories(): Category[] {
    return this.getAllCategoriesWithHiddenFlag().filter((c) => !c.isHidden)
  }

  /**
   * 取得所有分類（包含隱藏）
   */
  getAllCategories(): Category[] {
    return this.getAllCategoriesWithHiddenFlag()
  }

  /**
   * 新增自訂分類
   * 純函數 - 創建新數組而非修改舊數組
   */
  addCustomCategory(category: Omit<Category, 'type'>): Category {
    const customs = this.settingsService.getSetting('customCategories', []) || []

    const newCategory: Category = {
      ...category,
      type: 'custom',
      sortOrder: category.sortOrder ?? 100 + customs.length,
    }

    // 創建新數組，不修改舊數組
    this.settingsService.saveSetting('customCategories', [...customs, newCategory])

    return newCategory
  }

  /**
   * 移除自訂分類
   * 純函數 - 使用 filter 而非 splice
   */
  removeCustomCategory(id: string): boolean {
    const customs = this.settingsService.getSetting('customCategories', []) || []
    const index = customs.findIndex((c) => c.id === id)

    if (index === -1) return false

    // 創建新數組，不修改舊數組
    this.settingsService.saveSetting(
      'customCategories',
      customs.filter((c) => c.id !== id)
    )

    return true
  }

  /**
   * 切換分類顯示/隱藏
   * 純函數 - 創建新數組
   */
  toggleCategoryVisibility(id: string): boolean {
    const hiddenIds = this.settingsService.getSetting('hiddenCategories', []) || []
    const isCurrentlyHidden = hiddenIds.includes(id)

    if (isCurrentlyHidden) {
      // 取消隱藏 - 移除 ID
      this.settingsService.saveSetting(
        'hiddenCategories',
        hiddenIds.filter((hiddenId) => hiddenId !== id)
      )
      return false // 返回新狀態：不再隱藏
    } else {
      // 隱藏 - 添加 ID
      this.settingsService.saveSetting('hiddenCategories', [...hiddenIds, id])
      return true // 返回新狀態：現在是隱藏的
    }
  }

  /**
   * 根據 ID 取得分類
   */
  getCategoryById(id: string): Category | undefined {
    return this.getAllCategories().find((c) => c.id === id)
  }

  /**
   * 根據 ID 取得分類顯示資訊
   */
  getCategoryDisplay(id: string): { icon: string; name: string; color: string } {
    const category = this.getCategoryById(id)
    if (category) {
      return { icon: category.icon, name: category.name, color: category.color }
    }
    // 如果找不到，返回預設值
    return { icon: '📦', name: id || '其他', color: '#6b7280' }
  }
}

// ==================== 向後兼容的靜態導出 ====================

// 延遲初始化以避免循環依賴
let defaultService: CategoryService | null = null

function getDefaultService(): CategoryService {
  if (!defaultService) {
    // 直接使用 SettingsSystem 作為 SettingsService（duck typing）
    defaultService = new CategoryService(SettingsSystemImport as unknown as SettingsService)
  }
  return defaultService
}

/**
 * CategorySystem - 分類標準化系統
 * 向後兼容的靜態對象導出
 */
export const CategorySystem = {
  getCategories: () => getDefaultService().getCategories(),
  getAllCategories: () => getDefaultService().getAllCategories(),
  getCustomCategories: () => {
    // 從 SettingsSystem 直接讀取
    return SettingsSystemImport.getSetting('customCategories', [])
  },
  getHiddenCategoryIds: () => {
    // 從 SettingsSystem 直接讀取
    return SettingsSystemImport.getSetting('hiddenCategories', [])
  },
  addCustomCategory: (category: Omit<Category, 'type'>) =>
    getDefaultService().addCustomCategory(category),
  removeCustomCategory: (id: string) => getDefaultService().removeCustomCategory(id),
  toggleCategoryVisibility: (id: string) => getDefaultService().toggleCategoryVisibility(id),
  getCategoryById: (id: string) => getDefaultService().getCategoryById(id),
  getCategoryDisplay: (id: string) => getDefaultService().getCategoryDisplay(id),
}
