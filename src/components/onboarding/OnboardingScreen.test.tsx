/**
 * OnboardingScreen Component Tests
 *
 * 測試範圍:
 * - 按鈕文字在不同步驟的顯示
 * - 步驟導航流程
 * - 完成 onboarding 的回調
 */

import { render, screen, fireEvent, act } from '@testing-library/react'
import { OnboardingScreen } from './OnboardingScreen'

const ANIMATION_DELAY = 300

describe('OnboardingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  // 輔助函數：點擊按鈕並等待動畫完成
  const clickAndWait = async () => {
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await act(async () => {
      vi.advanceTimersByTime(ANIMATION_DELAY)
    })
  }

  describe('Button Text Display', () => {
    test('按鈕文字應該在前兩步顯示「繼續」，最後一步顯示「開始使用」', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const button = screen.getByRole('button')

      // Step 0: 應該顯示「繼續」
      expect(button).toHaveTextContent('繼續')

      // Step 1: 確認仍然顯示「繼續」
      await clickAndWait()
      expect(button).toHaveTextContent('繼續')

      // Step 2: 確認顯示「開始使用」
      await clickAndWait()
      expect(button).toHaveTextContent('開始使用')

      // 點擊「開始使用」應該調用 onComplete
      await clickAndWait()
      expect(mockOnComplete).toHaveBeenCalled()
    })

    test('步驟 0 和 1 應該顯示「繼續」', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const button = screen.getByRole('button')

      // Step 0: 確認顯示「繼續」
      expect(button).toHaveTextContent('繼續')
      expect(button).not.toHaveTextContent('開始使用')

      // Step 1: 確認仍然顯示「繼續」
      await clickAndWait()
      expect(button).toHaveTextContent('繼續')
      expect(button).not.toHaveTextContent('開始使用')
    })

    test('步驟 2 應該顯示「開始使用」', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 導航到 Step 2
      await clickAndWait() // Step 0 → 1
      await clickAndWait() // Step 1 → 2

      // Step 2: 確認顯示「開始使用」
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('開始使用')
      expect(button).not.toHaveTextContent('繼續')
    })
  })

  describe('Onboarding Flow', () => {
    test('完成所有步驟後應該調用 onComplete 並傳遞用戶資料', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 完成 3 個步驟
      await clickAndWait()
      await clickAndWait()
      await clickAndWait()

      // 驗證 onComplete 被調用且包含必要欄位
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          age: expect.any(Number),
          salary: expect.any(Number),
          retireAge: expect.any(Number),
          currentSavings: 0, // Phase 5: 自動設為 0
          monthlySavings: expect.any(Number),
          inflationRate: expect.any(Number),
          roiRate: expect.any(Number),
          targetRetirementFund: expect.any(Number),
          createdAt: expect.any(String), // Phase 1: 記錄完成時間
        })
      )
    })

    test('每月儲蓄應該為薪水的 20%', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 完成所有步驟
      for (let i = 0; i < 3; i++) {
        await clickAndWait()
      }

      // 驗證 monthlySavings = salary × 0.2
      expect(mockOnComplete).toHaveBeenCalled()
      const userData = mockOnComplete.mock.calls[0][0]
      expect(userData.monthlySavings).toBe(Math.round(userData.salary * 0.2))
    })
  })
})
