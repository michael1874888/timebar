/**
 * App Component Basic Tests (Phase 0 Refactor)
 *
 * 測試新架構的核心功能:
 * - LifeCostCalculator 整合
 * - CelebrationSystem 整合
 * - Dashboard 導航
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { Storage } from '@/utils/storage'
import { GoogleSheetsAPI } from '@/services/googleSheets'
import { UserData } from '@/types'
import { CONSTANTS } from '@/utils/financeCalc'

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS

// Mock modules
vi.mock('@/utils/storage')
vi.mock('@/services/googleSheets')
vi.mock('@/constants', () => ({
  GAS_WEB_APP_URL: '',
}))

// Mock child components
vi.mock('./onboarding/OnboardingScreen', () => ({
  OnboardingScreen: ({ onComplete }: { onComplete: (data: UserData) => void }) => (
    <div data-testid="onboarding-screen">
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
        Complete
      </button>
    </div>
  ),
}))

vi.mock('./calculator/LifeCostCalculator', () => ({
  LifeCostCalculator: ({
    userData,
    onDecision,
  }: {
    userData: UserData
    onDecision: (action: 'buy' | 'save', amount: number) => void
  }) => (
    <div data-testid="life-cost-calculator">
      <button onClick={() => onDecision('save', 1000)}>Save</button>
    </div>
  ),
}))

vi.mock('./freedom/FreedomTracker', () => ({
  FreedomTracker: () => <div data-testid="freedom-tracker">Freedom Tracker</div>,
}))

vi.mock('./visualization/LifeBattery', () => ({
  LifeBattery: () => <div data-testid="life-battery">Life Battery</div>,
}))

vi.mock('./feedback/CelebrationSystem', () => ({
  CelebrationSystem: ({ trigger }: { trigger: boolean }) =>
    trigger ? <div data-testid="celebration">Celebration</div> : null,
}))

vi.mock('./history/HistoryPage', () => ({
  HistoryPage: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="history-page">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

vi.mock('./settings/SettingsPage', () => ({
  SettingsPage: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="settings-page">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

describe('App Component - Phase 0 Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Storage
    ;(Storage.save as any) = vi.fn()
    ;(Storage.load as any) = vi.fn().mockReturnValue(null)
    ;(Storage.clear as any) = vi.fn()

    // Mock GoogleSheetsAPI
    ;(GoogleSheetsAPI.isConfigured as any) = vi.fn().mockReturnValue(false)
    ;(GoogleSheetsAPI.getAll as any) = vi.fn().mockResolvedValue({ success: false })
    ;(GoogleSheetsAPI.saveUserData as any) = vi.fn().mockResolvedValue({ success: true })
    ;(GoogleSheetsAPI.saveRecord as any) = vi.fn().mockResolvedValue({ success: true })
    ;(GoogleSheetsAPI.clearAllData as any) = vi.fn().mockResolvedValue({ success: true })
  })

  test('應該顯示 Onboarding 並完成後進入 LifeCostCalculator', async () => {
    render(<App />)

    // 等待載入完成
    await waitFor(() => {
      expect(screen.queryByText('載入中...')).not.toBeInTheDocument()
    })

    // 應該顯示 Onboarding
    expect(screen.getByTestId('onboarding-screen')).toBeInTheDocument()

    // 完成 Onboarding
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }))

    await waitFor(() => {
      expect(screen.getByTestId('life-cost-calculator')).toBeInTheDocument()
    })
  })

  test('應該能夠觸發 CelebrationSystem', async () => {
    ;(Storage.load as any) = vi.fn((key) => {
      if (key === 'userData') {
        return {
          age: 30,
          salary: 50000,
          retireAge: 65,
          currentSavings: 0,
          monthlySavings: 10000,
          inflationRate: DEFAULT_INFLATION_RATE,
          roiRate: DEFAULT_ROI_RATE,
        }
      }
      return []
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('life-cost-calculator')).toBeInTheDocument()
    })

    // 點擊儲蓄按鈕
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByTestId('celebration')).toBeInTheDocument()
    })
  })

  test('應該能夠導航到 Dashboard', async () => {
    ;(Storage.load as any) = vi.fn((key) => {
      if (key === 'userData') {
        return {
          age: 30,
          salary: 50000,
          retireAge: 65,
          currentSavings: 0,
          monthlySavings: 10000,
          inflationRate: DEFAULT_INFLATION_RATE,
          roiRate: DEFAULT_ROI_RATE,
        }
      }
      return []
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('life-cost-calculator')).toBeInTheDocument()
    })

    // 找到並點擊 Dashboard 按鈕（SVG icon）
    const dashboardButton = screen.getAllByRole('button')[0]
    fireEvent.click(dashboardButton)

    await waitFor(() => {
      expect(screen.getByTestId('freedom-tracker')).toBeInTheDocument()
      expect(screen.getByTestId('life-battery')).toBeInTheDocument()
    })
  })
})
