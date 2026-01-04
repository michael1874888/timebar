/**
 * CategorySystem - 分类系统单元测试
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { CategorySystem, DEFAULT_CATEGORIES } from '@/utils/categorySystem'
import { SettingsSystem } from '@/utils/settingsSystem'
import type { Category } from '@/types'

// Mock SettingsSystem
vi.mock('@/utils/settingsSystem', () => ({
  SettingsSystem: {
    getSetting: vi.fn(),
    saveSetting: vi.fn(),
  }
}))

describe('CategorySystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock behavior
    SettingsSystem.getSetting = vi.fn().mockImplementation((_key: string, defaultValue: any) => defaultValue)
    SettingsSystem.saveSetting = vi.fn()
  })

  test('DEFAULT_CATEGORIES should have 8 items', () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(8)
  })

  test('all default categories should have required fields', () => {
    DEFAULT_CATEGORIES.forEach(category => {
      expect(category).toHaveProperty('id')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('icon')
      expect(category).toHaveProperty('color')
      expect(category).toHaveProperty('type', 'default')
      expect(category).toHaveProperty('sortOrder')
    })
  })

  test('default categories should be sorted by sortOrder', () => {
    for (let i = 0; i < DEFAULT_CATEGORIES.length - 1; i++) {
      const current = DEFAULT_CATEGORIES[i].sortOrder || 99
      const next = DEFAULT_CATEGORIES[i + 1].sortOrder || 99
      expect(current).toBeLessThanOrEqual(next)
    }
  })

  test('getCategories() should return all default categories when no custom or hidden', () => {
    const categories = CategorySystem.getCategories()

    expect(categories).toHaveLength(8)
    expect(SettingsSystem.getSetting).toHaveBeenCalledWith('customCategories', [])
    expect(SettingsSystem.getSetting).toHaveBeenCalledWith('hiddenCategories', [])
  })

  test('getCategories() should exclude hidden categories', () => {
    SettingsSystem.getSetting = vi.fn().mockImplementation((key: string, defaultValue: any) => {
      if (key === 'hiddenCategories') return ['food', 'transport']
      return defaultValue
    })

    const categories = CategorySystem.getCategories()

    expect(categories.length).toBe(6) // 8 - 2 = 6
    expect(categories.find(c => c.id === 'food')).toBeUndefined()
    expect(categories.find(c => c.id === 'transport')).toBeUndefined()
  })

  test('getCategories() should include custom categories', () => {
    const customCategories: Category[] = [
      { id: 'custom1', name: '自定义1', icon: '🎨', color: '#000', type: 'custom', sortOrder: 100 }
    ]

    SettingsSystem.getSetting = vi.fn().mockImplementation((key: string, defaultValue: any) => {
      if (key === 'customCategories') return customCategories
      return defaultValue
    })

    const categories = CategorySystem.getCategories()

    expect(categories.length).toBe(9) // 8 + 1
    expect(categories.find(c => c.id === 'custom1')).toBeDefined()
  })

  test('getCategories() should sort all categories by sortOrder', () => {
    const customCategories: Category[] = [
      { id: 'custom1', name: '自定义1', icon: '🎨', color: '#000', type: 'custom', sortOrder: 5 },
      { id: 'custom2', name: '自定义2', icon: '🎯', color: '#000', type: 'custom', sortOrder: 3 }
    ]

    SettingsSystem.getSetting = vi.fn().mockImplementation((key: string, defaultValue: any) => {
      if (key === 'customCategories') return customCategories
      return defaultValue
    })

    const categories = CategorySystem.getCategories()

    for (let i = 0; i < categories.length - 1; i++) {
      const current = categories[i].sortOrder || 99
      const next = categories[i + 1].sortOrder || 99
      expect(current).toBeLessThanOrEqual(next)
    }
  })

  test('getAllCategories() should include hidden categories', () => {
    const customCategories: Category[] = [
      { id: 'custom1', name: '自定义', icon: '🎨', color: '#000', type: 'custom', sortOrder: 100 }
    ]

    SettingsSystem.getSetting = vi.fn().mockImplementation((key: string, defaultValue: any) => {
      if (key === 'customCategories') return customCategories
      if (key === 'hiddenCategories') return ['food', 'transport']
      return defaultValue
    })

    const allCategories = CategorySystem.getAllCategories()

    expect(allCategories.length).toBe(9)

    const foodCategory = allCategories.find(c => c.id === 'food')
    expect(foodCategory?.isHidden).toBe(true)

    const transportCategory = allCategories.find(c => c.id === 'transport')
    expect(transportCategory?.isHidden).toBe(true)

    const entertainmentCategory = allCategories.find(c => c.id === 'entertainment')
    expect(entertainmentCategory?.isHidden).toBe(false)
  })

  test('addCustomCategory() should add new category with correct type and sortOrder', () => {
    SettingsSystem.getSetting = vi.fn().mockReturnValue([])

    const newCategory = {
      id: 'custom1',
      name: '自定义分类',
      icon: '🎨',
      color: '#ff0000'
    }

    const result = CategorySystem.addCustomCategory(newCategory)

    expect(result.type).toBe('custom')
    expect(result.sortOrder).toBeDefined()
    expect(SettingsSystem.saveSetting).toHaveBeenCalledWith('customCategories', [result])
  })

  test('addCustomCategory() should increment sortOrder for multiple categories', () => {
    const existing: Category[] = [
      { id: 'custom1', name: '自定义1', icon: '🎨', color: '#000', type: 'custom', sortOrder: 100 }
    ]

    SettingsSystem.getSetting = vi.fn().mockReturnValue(existing)

    const newCategory = {
      id: 'custom2',
      name: '自定义2',
      icon: '🎯',
      color: '#00ff00'
    }

    const result = CategorySystem.addCustomCategory(newCategory)

    expect(result.sortOrder).toBe(101)
  })

  test('removeCustomCategory() should remove the specified category', () => {
    const existing: Category[] = [
      { id: 'custom1', name: '自定义1', icon: '🎨', color: '#000', type: 'custom' },
      { id: 'custom2', name: '自定义2', icon: '🎯', color: '#000', type: 'custom' }
    ]

    SettingsSystem.getSetting = vi.fn().mockReturnValue([...existing])

    const result = CategorySystem.removeCustomCategory('custom1')

    expect(result).toBe(true)
    expect(SettingsSystem.saveSetting).toHaveBeenCalledWith('customCategories', [existing[1]])
  })

  test('removeCustomCategory() should return false for non-existent category', () => {
    SettingsSystem.getSetting = vi.fn().mockReturnValue([])

    const result = CategorySystem.removeCustomCategory('nonexistent')

    expect(result).toBe(false)
    expect(SettingsSystem.saveSetting).not.toHaveBeenCalled()
  })

  test('toggleCategoryVisibility() should hide visible category and return true', () => {
    SettingsSystem.getSetting = vi.fn().mockReturnValue([])

    const result = CategorySystem.toggleCategoryVisibility('food')

    expect(result).toBe(true)
    expect(SettingsSystem.saveSetting).toHaveBeenCalledWith('hiddenCategories', ['food'])
  })

  test('toggleCategoryVisibility() should show hidden category and return false', () => {
    SettingsSystem.getSetting = vi.fn().mockReturnValue(['food', 'transport'])

    const result = CategorySystem.toggleCategoryVisibility('food')

    expect(result).toBe(false)
    expect(SettingsSystem.saveSetting).toHaveBeenCalledWith('hiddenCategories', ['transport'])
  })

  test('getCategoryById() should find default category', () => {
    const category = CategorySystem.getCategoryById('food')

    expect(category).toBeDefined()
    expect(category?.name).toBe('飲食')
    expect(category?.icon).toBe('🍽️')
  })

  test('getCategoryById() should find custom category', () => {
    const customCategories: Category[] = [
      { id: 'custom1', name: '自定义', icon: '🎨', color: '#000', type: 'custom' }
    ]

    SettingsSystem.getSetting = vi.fn().mockImplementation((key: string, defaultValue: any) => {
      if (key === 'customCategories') return customCategories
      return defaultValue
    })

    const category = CategorySystem.getCategoryById('custom1')

    expect(category).toBeDefined()
    expect(category?.name).toBe('自定义')
  })

  test('getCategoryById() should return undefined for non-existent category', () => {
    const category = CategorySystem.getCategoryById('nonexistent')

    expect(category).toBeUndefined()
  })

  test('getCategoryDisplay() should return category display info', () => {
    const display = CategorySystem.getCategoryDisplay('food')

    expect(display).toEqual({
      icon: '🍽️',
      name: '飲食',
      color: '#f97316'
    })
  })

  test('getCategoryDisplay() should return default display for non-existent category', () => {
    const display = CategorySystem.getCategoryDisplay('nonexistent')

    expect(display).toEqual({
      icon: '📦',
      name: 'nonexistent',
      color: '#6b7280'
    })
  })

  test('getCategoryDisplay() should return "其他" for empty ID', () => {
    const display = CategorySystem.getCategoryDisplay('')

    expect(display.name).toBe('其他')
  })

  test('all modification operations should trigger SettingsSystem.saveSetting', () => {
    SettingsSystem.getSetting = vi.fn().mockReturnValue([])

    CategorySystem.addCustomCategory({
      id: 'custom1',
      name: '测试',
      icon: '🧪',
      color: '#000'
    })
    expect(SettingsSystem.saveSetting).toHaveBeenCalledWith('customCategories', expect.any(Array))

    vi.clearAllMocks()

    CategorySystem.toggleCategoryVisibility('food')
    expect(SettingsSystem.saveSetting).toHaveBeenCalledWith('hiddenCategories', expect.any(Array))

    vi.clearAllMocks()

    SettingsSystem.getSetting = vi.fn().mockReturnValue([
      { id: 'custom1', name: '测试', icon: '🧪', color: '#000', type: 'custom' }
    ])
    CategorySystem.removeCustomCategory('custom1')
    expect(SettingsSystem.saveSetting).toHaveBeenCalledWith('customCategories', expect.any(Array))
  })
})
