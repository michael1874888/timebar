/**
 * App Component Integration Tests
 *
 * 測試範圍:
 * - 初始載入狀態與資料同步
 * - 首次使用者流程（Onboarding）
 * - 現有使用者流程（從 localStorage 載入）
 * - 畫面導航（loading → onboarding → main → history → settings）
 * - 新增記錄更新狀態與 localStorage
 * - 設定頁更新使用者資料
 * - 清除資料返回 Onboarding
 * - Google Sheets 同步（模擬 API）
 * - 同步狀態（syncing, synced, offline）
 * - 完整使用者旅程（從 Onboarding 到新增記錄）
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { Storage } from '@/utils/storage'
import { GoogleSheetsAPI } from '@/services/googleSheets'
import { UserData, Record as RecordType } from '@/types'
import { CONSTANTS } from '@/utils/financeCalc'

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS

// Mock modules
vi.mock('@/utils/storage')
vi.mock('@/services/googleSheets')
vi.mock('@/constants', () => ({
  GAS_WEB_APP_URL: '',
}))

// Mock child components to simplify testing
vi.mock('./onboarding/OnboardingScreen', () => ({
  OnboardingScreen: ({ onComplete }: { onComplete: (data: UserData) => void }) => (
    <div data-testid="onboarding-screen">
      <h1>Onboarding Screen</h1>
      <button
        onClick={() =>
          onComplete({
            age: 30,
            salary: 50000,
            retireAge: 65,
            currentSavings: 0,
            monthlySavings: 10000,
            inflationRate: DEFAULT_INFLATION_RATE,
            roiRate: DEFAULT_ROI_RATE,
            targetRetirementFund: 5000000,
          })
        }
      >
        Complete Onboarding
      </button>
    </div>
  ),
}))

vi.mock('./dashboard/DashboardScreen', () => ({
  DashboardScreen: ({
    userData,
    records,
    onAddRecord,
    onOpenTracker,
    onOpenHistory,
    onOpenSettings,
  }: {
    userData: UserData
    records: RecordType[]
    onAddRecord: (record: RecordType) => void
    onOpenTracker: () => void
    onOpenHistory: () => void
    onOpenSettings: () => void
  }) => (
    <div data-testid="dashboard-screen">
      <h1>Dashboard Screen</h1>
      <div>Age: {userData.age}</div>
      <div>Records: {records.length}</div>
      <button
        onClick={() =>
          onAddRecord({
            id: `record-${Date.now()}`,
            type: 'spend',
            amount: 1000,
            isRecurring: false,
            timeCost: 2,
            category: 'food',
            note: 'Test',
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
          })
        }
      >
        Add Record
      </button>
      <button onClick={onOpenTracker}>Open Tracker</button>
      <button onClick={onOpenHistory}>Open History</button>
      <button onClick={onOpenSettings}>Open Settings</button>
    </div>
  ),
}))

vi.mock('./tracker/MainTracker', () => ({
  MainTracker: ({
    userData,
    records,
    onAddRecord,
    onOpenHistory,
    onOpenSettings,
  }: {
    userData: UserData
    records: RecordType[]
    onAddRecord: (record: RecordType) => void
    onOpenHistory: () => void
    onOpenSettings: () => void
  }) => (
    <div data-testid="main-tracker">
      <h1>Main Tracker</h1>
      <div>Age: {userData.age}</div>
      <div>Records: {records.length}</div>
      <button
        onClick={() =>
          onAddRecord({
            id: `record-${Date.now()}`,
            type: 'spend',
            amount: 1000,
            isRecurring: false,
            timeCost: 2,
            category: 'food',
            note: 'Test',
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
          })
        }
      >
        Add Record
      </button>
      <button onClick={onOpenHistory}>Open History</button>
      <button onClick={onOpenSettings}>Open Settings</button>
    </div>
  ),
}))

vi.mock('./history/HistoryPage', () => ({
  HistoryPage: ({
    records,
    userData,
    onClose,
  }: {
    records: RecordType[]
    userData: UserData
    onClose: () => void
  }) => (
    <div data-testid="history-page">
      <h1>History Page</h1>
      <div>Total Records: {records.length}</div>
      <div>User Age: {userData.age}</div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

vi.mock('./settings/SettingsPage', () => ({
  SettingsPage: ({
    userData,
    onUpdateUser,
    onClose,
    onReset,
  }: {
    userData: UserData
    onUpdateUser: (data: UserData) => void
    onClose: () => void
    onReset: () => void
  }) => (
    <div data-testid="settings-page">
      <h1>Settings Page</h1>
      <div>Current Age: {userData.age}</div>
      <button
        onClick={() =>
          onUpdateUser({
            ...userData,
            age: 35,
            salary: 80000,
          })
        }
      >
        Update User
      </button>
      <button onClick={onClose}>Close</button>
      <button onClick={onReset}>Reset Data</button>
    </div>
  ),
}))

describe('App Component Integration Tests', () => {
  let mockStorage: {
    save: ReturnType<typeof vi.fn>
    load: ReturnType<typeof vi.fn>
    clear: ReturnType<typeof vi.fn>
  }

  let mockGoogleSheetsAPI: {
    isConfigured: ReturnType<typeof vi.fn>
    getAll: ReturnType<typeof vi.fn>
    getUserData: ReturnType<typeof vi.fn>
    saveUserData: ReturnType<typeof vi.fn>
    saveRecord: ReturnType<typeof vi.fn>
    clearAllData: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Storage
    mockStorage = {
      save: vi.fn().mockReturnValue(true),
      load: vi.fn().mockReturnValue(null),
      clear: vi.fn(),
    }
    ;(Storage.save as any) = mockStorage.save
    ;(Storage.load as any) = mockStorage.load
    ;(Storage.clear as any) = mockStorage.clear

    // Mock GoogleSheetsAPI
    mockGoogleSheetsAPI = {
      isConfigured: vi.fn().mockReturnValue(false),
      getAll: vi.fn().mockResolvedValue({ success: false, userData: null, records: [] }),
      getUserData: vi.fn().mockResolvedValue({ success: false, data: null }),
      saveUserData: vi.fn().mockResolvedValue({ success: true }),
      saveRecord: vi.fn().mockResolvedValue({ success: true }),
      clearAllData: vi.fn().mockResolvedValue({ success: true }),
    }
    ;(GoogleSheetsAPI.isConfigured as any) = mockGoogleSheetsAPI.isConfigured
    ;(GoogleSheetsAPI.getAll as any) = mockGoogleSheetsAPI.getAll
    ;(GoogleSheetsAPI.getUserData as any) = mockGoogleSheetsAPI.getUserData
    ;(GoogleSheetsAPI.saveUserData as any) = mockGoogleSheetsAPI.saveUserData
    ;(GoogleSheetsAPI.saveRecord as any) = mockGoogleSheetsAPI.saveRecord
    ;(GoogleSheetsAPI.clearAllData as any) = mockGoogleSheetsAPI.clearAllData
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial Loading State', () => {
    test('應該顯示載入畫面', () => {
      render(<App />)

      expect(screen.getByText('Time')).toBeInTheDocument()
      expect(screen.getByText('Bar')).toBeInTheDocument()
      expect(screen.getByText('載入中...')).toBeInTheDocument()
    })

    test('載入畫面應該顯示 spinner', () => {
      const { container } = render(<App />)

      const spinner = container.querySelector('.spinner')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('First-Time User Flow (Onboarding)', () => {
    test('無本地資料且雲端未設定時，應該顯示 Onboarding', async () => {
      mockStorage.load.mockReturnValue(null)
      mockGoogleSheetsAPI.isConfigured.mockReturnValue(false)

      render(<App />)

      const onboardingScreen = await screen.findByTestId('onboarding-screen')
      expect(onboardingScreen).toBeInTheDocument()
    })

    test('完成 Onboarding 後應該進入主畫面', async () => {
      mockStorage.load.mockReturnValue(null)

      render(<App />)

      await screen.findByTestId('onboarding-screen')

      const completeButton = screen.getByRole('button', { name: 'Complete Onboarding' })
      fireEvent.click(completeButton)

      const dashboardScreen = await screen.findByTestId('dashboard-screen')
      expect(dashboardScreen).toBeInTheDocument()
    })

    test('完成 Onboarding 後應該儲存資料到 localStorage', async () => {
      mockStorage.load.mockReturnValue(null)

      render(<App />)

      await screen.findByTestId('onboarding-screen')

      const completeButton = screen.getByRole('button', { name: 'Complete Onboarding' })
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(mockStorage.save).toHaveBeenCalledWith(
          'userData',
          expect.objectContaining({
            age: 30,
            salary: 50000,
            retireAge: 65,
          })
        )
      })
    })

    test('完成 Onboarding 後應該同步到雲端', async () => {
      mockStorage.load.mockReturnValue(null)

      render(<App />)

      await screen.findByTestId('onboarding-screen')

      const completeButton = screen.getByRole('button', { name: 'Complete Onboarding' })
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(mockGoogleSheetsAPI.saveUserData).toHaveBeenCalledWith(
          expect.objectContaining({
            age: 30,
            salary: 50000,
          })
        )
      })
    })
  })

  describe('Existing User Flow (Load from LocalStorage)', () => {
    test('有本地資料時應該直接進入主畫面', async () => {
      const mockUserData: UserData = {
        age: 35,
        salary: 60000,
        retireAge: 65,
        currentSavings: 100000,
        monthlySavings: 12000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserData
        if (key === 'records') return []
        return null
      })

      render(<App />)

      const dashboardScreen = await screen.findByTestId('dashboard-screen')
      expect(dashboardScreen).toBeInTheDocument()
    })

    test('應該載入 localStorage 的使用者資料', async () => {
      const mockUserData: UserData = {
        age: 35,
        salary: 60000,
        retireAge: 65,
        currentSavings: 100000,
        monthlySavings: 12000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserData
        if (key === 'records') return []
        return null
      })

      render(<App />)

      const ageText = await screen.findByText('Age: 35')
      expect(ageText).toBeInTheDocument()
    })

    test('應該載入 localStorage 的記錄資料', async () => {
      const mockUserData: UserData = {
        age: 35,
        salary: 60000,
        retireAge: 65,
        currentSavings: 100000,
        monthlySavings: 12000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      const mockRecords: RecordType[] = [
        {
          id: 'record-1',
          type: 'spend',
          amount: 500,
          isRecurring: false,
          timeCost: 1,
          category: 'food',
          note: 'Lunch',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
        {
          id: 'record-2',
          type: 'save',
          amount: 1000,
          isRecurring: false,
          timeCost: 2,
          category: 'savings',
          note: 'Monthly',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserData
        if (key === 'records') return mockRecords
        return null
      })

      render(<App />)

      const recordsText = await screen.findByText('Records: 2')
      expect(recordsText).toBeInTheDocument()
    })

    test('應該補充缺少的預設值（inflationRate, roiRate, monthlySavings）', async () => {
      const mockUserDataWithoutDefaults = {
        age: 35,
        salary: 60000,
        retireAge: 65,
        currentSavings: 100000,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserDataWithoutDefaults
        if (key === 'records') return []
        return null
      })

      render(<App />)

      await screen.findByTestId('dashboard-screen')

      await waitFor(() => {
        expect(mockStorage.save).toHaveBeenCalledWith(
          'userData',
          expect.objectContaining({
            inflationRate: DEFAULT_INFLATION_RATE,
            roiRate: DEFAULT_ROI_RATE,
            monthlySavings: Math.round(60000 * 0.2),
          })
        )
      })
    })
  })

  describe('Screen Navigation', () => {
    beforeEach(async () => {
      const mockUserData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserData
        if (key === 'records') return []
        return null
      })
    })

    test('應該能從主畫面導航到歷史頁', async () => {
      render(<App />)

      await screen.findByTestId('dashboard-screen')

      const historyButton = screen.getByRole('button', { name: 'Open History' })
      fireEvent.click(historyButton)

      const historyPage = await screen.findByTestId('history-page')
      expect(historyPage).toBeInTheDocument()
    })

    test('應該能從歷史頁返回主畫面', async () => {
      render(<App />)

      await screen.findByTestId('dashboard-screen')

      fireEvent.click(screen.getByRole('button', { name: 'Open History' }))

      await screen.findByTestId('history-page')

      const closeButton = screen.getByRole('button', { name: 'Close' })
      fireEvent.click(closeButton)

      const dashboardScreen = await screen.findByTestId('dashboard-screen')
      expect(dashboardScreen).toBeInTheDocument()
    })

    test('應該能從主畫面導航到設定頁', async () => {
      render(<App />)

      await screen.findByTestId('dashboard-screen')

      const settingsButton = screen.getByRole('button', { name: 'Open Settings' })
      fireEvent.click(settingsButton)

      const settingsPage = await screen.findByTestId('settings-page')
      expect(settingsPage).toBeInTheDocument()
    })

    test('應該能從設定頁返回主畫面', async () => {
      render(<App />)

      await screen.findByTestId('dashboard-screen')

      fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }))
      await screen.findByTestId('settings-page')

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))

      const dashboardScreen = await screen.findByTestId('dashboard-screen')
      expect(dashboardScreen).toBeInTheDocument()
    })

    // Phase 1: Tracker 已移除，功能已整合到 Dashboard
    // test('應該能從 Dashboard 導航到 Tracker', async () => {
    //   render(<App />)

    //   await screen.findByTestId('dashboard-screen')

    //   fireEvent.click(screen.getByRole('button', { name: 'Open Tracker' }))

    //   const tracker = await screen.findByTestId('main-tracker')
    //   expect(tracker).toBeInTheDocument()
    // })

    // Phase 1: Tracker 已移除，功能已整合到 Dashboard
    // test('應該能從 Tracker 返回 Dashboard', async () => {
    //   render(<App />)

    //   await screen.findByTestId('dashboard-screen')

    //   fireEvent.click(screen.getByRole('button', { name: 'Open Tracker' }))
    //   await screen.findByTestId('main-tracker')

    //   // Tracker 沒有返回按鈕，通過導航到其他頁面再返回來測試
    //   fireEvent.click(screen.getByRole('button', { name: 'Open History' }))
    //   await screen.findByTestId('history-page')

    //   fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    //   const dashboardScreen = await screen.findByTestId('dashboard-screen')
    //   expect(dashboardScreen).toBeInTheDocument()
    // })
  })

  describe('Adding Records', () => {
    beforeEach(async () => {
      const mockUserData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserData
        if (key === 'records') return []
        return null
      })
    })

    test('新增記錄應該更新狀態', async () => {
      render(<App />)

      await screen.findByTestId('dashboard-screen')

      expect(screen.getByText('Records: 0')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Add Record' }))

      const recordsText = await screen.findByText('Records: 1')
      expect(recordsText).toBeInTheDocument()
    })

    test('多次新增記錄應該累積', async () => {
      render(<App />)

      await screen.findByTestId('dashboard-screen')

      const addButton = screen.getByRole('button', { name: 'Add Record' })

      fireEvent.click(addButton)
      await screen.findByText('Records: 1')

      fireEvent.click(addButton)
      await screen.findByText('Records: 2')

      fireEvent.click(addButton)
      const recordsText = await screen.findByText('Records: 3')
      expect(recordsText).toBeInTheDocument()
    })
  })

  describe('Updating User Data in Settings', () => {
    beforeEach(async () => {
      const mockUserData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserData
        if (key === 'records') return []
        return null
      })
    })

    test('更新使用者資料應該更新狀態', async () => {
      render(<App />)

      await screen.findByTestId('dashboard-screen')

      fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }))
      await screen.findByTestId('settings-page')

      fireEvent.click(screen.getByRole('button', { name: 'Update User' }))
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))

      const ageText = await screen.findByText('Age: 35')
      expect(ageText).toBeInTheDocument()
    })
  })

  describe('Clearing Data', () => {
    beforeEach(async () => {
      const mockUserData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserData
        if (key === 'records') return []
        return null
      })
    })

    test('清除資料應該返回 Onboarding', async () => {
      render(<App />)

      await screen.findByTestId('dashboard-screen')

      fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }))
      await screen.findByTestId('settings-page')

      const resetButton = screen.getByRole('button', { name: 'Reset Data' })
      fireEvent.click(resetButton)

      const onboardingScreen = await screen.findByTestId('onboarding-screen')
      expect(onboardingScreen).toBeInTheDocument()
    })
  })

  describe('Google Sheets Sync', () => {
    test('雲端未設定時不應該嘗試同步', async () => {
      mockStorage.load.mockReturnValue(null)
      mockGoogleSheetsAPI.isConfigured.mockReturnValue(false)

      render(<App />)

      await screen.findByTestId('onboarding-screen')

      expect(mockGoogleSheetsAPI.getAll).not.toHaveBeenCalled()
    })

    test('雲端已設定時應該嘗試同步', async () => {
      mockStorage.load.mockReturnValue(null)
      mockGoogleSheetsAPI.isConfigured.mockReturnValue(true)
      mockGoogleSheetsAPI.getAll.mockResolvedValue({
        success: false,
        userData: null,
        records: [],
      })

      render(<App />)

      await waitFor(() => {
        expect(mockGoogleSheetsAPI.getAll).toHaveBeenCalled()
      })
    })

    test('雲端有資料時應該優先使用雲端資料', async () => {
      const cloudUserData: UserData = {
        age: 40,
        salary: 100000,
        retireAge: 60,
        currentSavings: 500000,
        monthlySavings: 20000,
        inflationRate: 3,
        roiRate: 7,
      }

      const cloudRecords: RecordType[] = [
        {
          id: 'cloud-record-1',
          type: 'spend',
          amount: 2000,
          isRecurring: false,
          timeCost: 4,
          category: 'shopping',
          note: 'Cloud record',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      const localUserData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return localUserData
        if (key === 'records') return []
        return null
      })

      mockGoogleSheetsAPI.isConfigured.mockReturnValue(true)
      mockGoogleSheetsAPI.getAll.mockResolvedValue({
        success: true,
        userData: cloudUserData,
        records: cloudRecords,
      })

      render(<App />)

      await screen.findByText('Age: 40')
      const recordsText = await screen.findByText('Records: 1')
      expect(recordsText).toBeInTheDocument()
    })

    test('雲端資料應該同步到本地', async () => {
      const cloudUserData: UserData = {
        age: 40,
        salary: 100000,
        retireAge: 60,
        currentSavings: 500000,
        monthlySavings: 20000,
        inflationRate: 3,
        roiRate: 7,
      }

      mockStorage.load.mockReturnValue(null)
      mockGoogleSheetsAPI.isConfigured.mockReturnValue(true)
      mockGoogleSheetsAPI.getAll.mockResolvedValue({
        success: true,
        userData: cloudUserData,
        records: [],
      })

      render(<App />)

      await waitFor(() => {
        expect(mockStorage.save).toHaveBeenCalledWith(
          'userData',
          expect.objectContaining({
            age: 40,
            salary: 100000,
          })
        )
      })
    })

    test('雲端同步失敗時應該使用本地資料', async () => {
      const localUserData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return localUserData
        if (key === 'records') return []
        return null
      })

      mockGoogleSheetsAPI.isConfigured.mockReturnValue(true)
      mockGoogleSheetsAPI.getAll.mockRejectedValue(new Error('Network error'))

      render(<App />)

      const ageText = await screen.findByText('Age: 30')
      expect(ageText).toBeInTheDocument()
    })

    test('雲端資料缺少預設值時應該補充', async () => {
      const cloudUserDataWithoutDefaults = {
        age: 40,
        salary: 100000,
        retireAge: 60,
        currentSavings: 500000,
      }

      mockStorage.load.mockReturnValue(null)
      mockGoogleSheetsAPI.isConfigured.mockReturnValue(true)
      mockGoogleSheetsAPI.getAll.mockResolvedValue({
        success: true,
        userData: cloudUserDataWithoutDefaults as UserData,
        records: [],
      })

      render(<App />)

      await waitFor(() => {
        expect(mockStorage.save).toHaveBeenCalledWith(
          'userData',
          expect.objectContaining({
            inflationRate: DEFAULT_INFLATION_RATE,
            roiRate: DEFAULT_ROI_RATE,
            monthlySavings: Math.round(100000 * 0.2),
          })
        )
      })
    })

  })

  describe('Sync Status States', () => {
    test('同步成功後應該進入對應畫面', async () => {
      const cloudUserData: UserData = {
        age: 40,
        salary: 100000,
        retireAge: 60,
        currentSavings: 500000,
        monthlySavings: 20000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockReturnValue(null)
      mockGoogleSheetsAPI.isConfigured.mockReturnValue(true)
      mockGoogleSheetsAPI.getAll.mockResolvedValue({
        success: true,
        userData: cloudUserData,
        records: [],
      })

      render(<App />)

      // 同步完成後應該進入主畫面
      const dashboardScreen = await screen.findByTestId('dashboard-screen')
      expect(dashboardScreen).toBeInTheDocument()
    })

    test('雲端無資料時應該清除本地資料並導向 onboarding', async () => {
      const localUserData: UserData = {
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return localUserData
        if (key === 'records') return []
        return null
      })

      mockGoogleSheetsAPI.isConfigured.mockReturnValue(true)
      mockGoogleSheetsAPI.getAll.mockResolvedValue({
        success: true,
        userData: null,
        records: [],
      })

      render(<App />)

      // 應該導向 onboarding screen（資料已被其他裝置清除）
      const onboardingScreen = await screen.findByTestId('onboarding-screen')
      expect(onboardingScreen).toBeInTheDocument()

      // 應該清除本地資料
      expect(mockStorage.clear).toHaveBeenCalled()
    })
  })

  describe('Full User Journey', () => {
    test('完整流程：Onboarding → 新增記錄 → 查看歷史 → 修改設定', async () => {
      mockStorage.load.mockReturnValue(null)

      render(<App />)

      // Step 1: 等待載入完成
      expect(screen.getByText('載入中...')).toBeInTheDocument()

      // Step 2: Onboarding
      await screen.findByTestId('onboarding-screen')

      fireEvent.click(screen.getByRole('button', { name: 'Complete Onboarding' }))

      // Step 3: 主畫面
      await screen.findByTestId('dashboard-screen')
      expect(screen.getByText('Age: 30')).toBeInTheDocument()
      expect(screen.getByText('Records: 0')).toBeInTheDocument()

      // Step 4: 新增記錄
      fireEvent.click(screen.getByRole('button', { name: 'Add Record' }))
      await screen.findByText('Records: 1')

      fireEvent.click(screen.getByRole('button', { name: 'Add Record' }))
      await screen.findByText('Records: 2')

      // Step 5: 查看歷史
      fireEvent.click(screen.getByRole('button', { name: 'Open History' }))
      await screen.findByTestId('history-page')
      expect(screen.getByText('Total Records: 2')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))

      // Step 6: 修改設定
      await screen.findByTestId('dashboard-screen')

      fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }))
      await screen.findByTestId('settings-page')

      fireEvent.click(screen.getByRole('button', { name: 'Update User' }))
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))

      // Step 7: 確認更新
      const ageText = await screen.findByText('Age: 35')
      expect(ageText).toBeInTheDocument()

      // 驗證所有資料都有儲存
      expect(mockStorage.save).toHaveBeenCalledWith('userData', expect.any(Object))
      expect(mockStorage.save).toHaveBeenCalledWith('records', expect.any(Array))
    })

    test('完整流程：載入現有資料 → 新增記錄 → 清除資料 → 重新 Onboarding', async () => {
      const mockUserData: UserData = {
        age: 35,
        salary: 60000,
        retireAge: 65,
        currentSavings: 100000,
        monthlySavings: 12000,
        inflationRate: DEFAULT_INFLATION_RATE,
        roiRate: DEFAULT_ROI_RATE,
      }

      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') return mockUserData
        if (key === 'records') return []
        return null
      })

      render(<App />)

      // Step 1: 載入現有資料
      await screen.findByText('Age: 35')

      // Step 2: 新增記錄
      fireEvent.click(screen.getByRole('button', { name: 'Add Record' }))
      await screen.findByText('Records: 1')

      // Step 3: 清除資料
      fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }))
      await screen.findByTestId('settings-page')

      fireEvent.click(screen.getByRole('button', { name: 'Reset Data' }))

      // Step 4: 返回 Onboarding
      await screen.findByTestId('onboarding-screen')

      // Step 5: 重新完成 Onboarding
      fireEvent.click(screen.getByRole('button', { name: 'Complete Onboarding' }))

      await screen.findByTestId('dashboard-screen')
      expect(screen.getByText('Age: 30')).toBeInTheDocument()
      const recordsText = await screen.findByText('Records: 0')
      expect(recordsText).toBeInTheDocument()

      // 驗證清除和重新儲存
      expect(mockStorage.clear).toHaveBeenCalled()
      expect(mockGoogleSheetsAPI.clearAllData).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    test('應該處理 localStorage 載入失敗', async () => {
      mockStorage.load.mockReturnValue(null)

      render(<App />)

      const onboardingScreen = await screen.findByTestId('onboarding-screen')
      expect(onboardingScreen).toBeInTheDocument()
    })

    test('應該處理 localStorage 儲存失敗', async () => {
      mockStorage.load.mockReturnValue(null)
      mockStorage.save.mockReturnValue(false)

      render(<App />)

      await screen.findByTestId('onboarding-screen')

      // 即使儲存失敗，應用程式應該繼續運作
      fireEvent.click(screen.getByRole('button', { name: 'Complete Onboarding' }))

      const dashboardScreen = await screen.findByTestId('dashboard-screen')
      expect(dashboardScreen).toBeInTheDocument()
    })

    test('應該處理雲端 API 完全失敗', async () => {
      mockStorage.load.mockReturnValue(null)
      mockGoogleSheetsAPI.isConfigured.mockReturnValue(true)
      mockGoogleSheetsAPI.getAll.mockRejectedValue(new Error('Complete API failure'))
      mockGoogleSheetsAPI.saveUserData.mockRejectedValue(new Error('Save failed'))
      mockGoogleSheetsAPI.saveRecord.mockRejectedValue(new Error('Save failed'))

      render(<App />)

      await screen.findByTestId('onboarding-screen')

      // 應用程式應該能正常運作
      fireEvent.click(screen.getByRole('button', { name: 'Complete Onboarding' }))

      await screen.findByTestId('dashboard-screen')

      // 新增記錄也應該能運作（即使雲端失敗）
      fireEvent.click(screen.getByRole('button', { name: 'Add Record' }))

      const recordsText = await screen.findByText('Records: 1')
      expect(recordsText).toBeInTheDocument()
    })

    test('應該處理損壞的 localStorage 資料', async () => {
      mockStorage.load.mockImplementation((key: string) => {
        if (key === 'userData') {
          return {
            // 缺少必要欄位
            age: 30,
          }
        }
        return null
      })

      render(<App />)

      // 應該補充缺少的欄位或進入 onboarding
      await waitFor(
        () => {
          const dashboardScreen = screen.queryByTestId('dashboard-screen')
          const onboardingScreen = screen.queryByTestId('onboarding-screen')
          expect(dashboardScreen || onboardingScreen).toBeTruthy()
        },
        { timeout: 2000 }
      )
    })
  })
})
