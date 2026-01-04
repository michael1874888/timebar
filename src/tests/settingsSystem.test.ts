/**
 * SettingsSystem - 设置系统单元测试
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { SettingsSystem } from '@/utils/settingsSystem'
import { Storage } from '@/utils/storage'
import { GoogleSheetsAPI } from '@/services/googleSheets'
import type { Category } from '@/types'

// Mock modules
vi.mock('@/utils/storage')
vi.mock('@/services/googleSheets')

describe('SettingsSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Setup mocks
    Storage.save = vi.fn().mockReturnValue(true)
    Storage.load = vi.fn().mockReturnValue(null)

    GoogleSheetsAPI.isConfigured = vi.fn().mockReturnValue(true)
    GoogleSheetsAPI.getUserData = vi.fn().mockResolvedValue({ success: false, data: null })
    GoogleSheetsAPI.saveUserData = vi.fn().mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('saveSetting() should save to localStorage immediately', () => {
    const testCategories: Category[] = [
      { id: 'test', name: '测试', icon: '🧪', color: '#000', type: 'custom' }
    ]

    SettingsSystem.saveSetting('customCategories', testCategories)

    expect(Storage.save).toHaveBeenCalledWith(
      'timebar_custom_categories',
      testCategories
    )
  })

  test('getSetting() should read from localStorage', () => {
    const testCategories: Category[] = [
      { id: 'test', name: '测试', icon: '🧪', color: '#000', type: 'custom' }
    ]
    Storage.load = vi.fn().mockReturnValue(testCategories)

    const result = SettingsSystem.getSetting('customCategories')

    expect(Storage.load).toHaveBeenCalledWith('timebar_custom_categories')
    expect(result).toEqual(testCategories)
  })

  test('getSetting() should return default value when no data', () => {
    Storage.load = vi.fn().mockReturnValue(null)

    const result = SettingsSystem.getSetting('customCategories', [])

    expect(result).toEqual([])
  })

  test('saveSetting() should debounce cloud sync by 1 second', async () => {
    const testCategories: Category[] = [
      { id: 'test', name: '测试', icon: '🧪', color: '#000', type: 'custom' }
    ]

    SettingsSystem.saveSetting('customCategories', testCategories)

    expect(GoogleSheetsAPI.saveUserData).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)

    expect(GoogleSheetsAPI.saveUserData).toHaveBeenCalledTimes(1)
  })

  test('multiple saveSetting() should batch into single cloud sync', async () => {
    const categories: Category[] = [
      { id: 'test1', name: '测试1', icon: '🧪', color: '#000', type: 'custom' }
    ]
    const hiddenCategories = ['food', 'transport']

    // Mock Storage.load to return saved data when called by getAllSettings
    const savedData: Record<string, any> = {}
    Storage.save = vi.fn().mockImplementation((key: string, value: any) => {
      savedData[key] = value
      return true
    })
    Storage.load = vi.fn().mockImplementation((key: string) => {
      return savedData[key] || null
    })

    SettingsSystem.saveSetting('customCategories', categories)
    await vi.advanceTimersByTimeAsync(100)

    SettingsSystem.saveSetting('hiddenCategories', hiddenCategories)
    await vi.advanceTimersByTimeAsync(100)

    expect(GoogleSheetsAPI.saveUserData).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)

    expect(GoogleSheetsAPI.saveUserData).toHaveBeenCalledTimes(1)

    const calls = (GoogleSheetsAPI.saveUserData as any).mock.calls
    const syncedData = calls[0][0]
    expect(syncedData.customCategories).toEqual(categories)
    expect(syncedData.hiddenCategories).toEqual(hiddenCategories)
  })

  test('syncFromCloud() should load settings from cloud', async () => {
    const cloudData = {
      customCategories: [{ id: 'cloud-cat', name: '云端分类', icon: '☁️', color: '#000', type: 'custom' as const }],
      hiddenCategories: ['food'],
    }

    GoogleSheetsAPI.getUserData = vi.fn().mockResolvedValue({
      success: true,
      data: cloudData
    })

    const result = await SettingsSystem.syncFromCloud()

    expect(result).toBe(true)
    expect(Storage.save).toHaveBeenCalledWith('timebar_custom_categories', cloudData.customCategories)
    expect(Storage.save).toHaveBeenCalledWith('timebar_hidden_categories', cloudData.hiddenCategories)
  })

  test('syncFromCloud() should return false on failure', async () => {
    GoogleSheetsAPI.getUserData = vi.fn().mockResolvedValue({
      success: false,
      data: null
    })

    const result = await SettingsSystem.syncFromCloud()

    expect(result).toBe(false)
  })

  test('syncFromCloud() should handle network errors', async () => {
    GoogleSheetsAPI.getUserData = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await SettingsSystem.syncFromCloud()

    expect(result).toBe(false)
  })

  test('forceSyncToCloud() should sync all local settings immediately', async () => {
    const localSettings = {
      customCategories: [{ id: 'cat1', name: '分类', icon: '📁', color: '#000', type: 'custom' as const }],
      hiddenCategories: ['food'],
    }

    Storage.load = vi.fn().mockImplementation((key: string) => {
      if (key === 'timebar_custom_categories') return localSettings.customCategories
      if (key === 'timebar_hidden_categories') return localSettings.hiddenCategories
      if (key === 'timebar_custom_challenges') return []
      if (key === 'timebar_deleted_default_challenges') return []
      if (key === 'timebar_modified_default_challenges') return {}
      if (key === 'timebar_daily_budget') return { method: 'auto' }
      return null
    })

    await SettingsSystem.forceSyncToCloud()

    expect(GoogleSheetsAPI.saveUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        customCategories: localSettings.customCategories,
        hiddenCategories: localSettings.hiddenCategories
      })
    )
  })
})
