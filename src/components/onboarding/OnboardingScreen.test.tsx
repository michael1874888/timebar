/**
 * OnboardingScreen Component Tests
 *
 * 測試範圍:
 * - 按鈕文字在不同步驟的顯示
 * - 步驟導航流程
 * - 完成 onboarding 的回調
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { OnboardingScreen } from './OnboardingScreen'

describe('OnboardingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Button Text Display', () => {
    test('按鈕文字應該在前兩步顯示「繼續」，最後一步顯示「開始使用」', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // Step 0: 應該顯示「繼續」
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('繼續')

      // 點擊進入 Step 1
      fireEvent.click(button)

      // 等待動畫完成（300ms）
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // Step 1: 確認仍然顯示「繼續」
      expect(button).toHaveTextContent('繼續')

      // 點擊進入 Step 2（最後一步）
      fireEvent.click(button)

      // 等待動畫完成
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // Step 2: 確認顯示「開始使用」
      expect(button).toHaveTextContent('開始使用')

      // 點擊「開始使用」應該調用 onComplete
      fireEvent.click(button)

      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      expect(mockOnComplete).toHaveBeenCalled()
    })

    test('步驟 0 和 1 應該顯示「繼續」', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // Step 0: 確認顯示「繼續」
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('繼續')
      expect(button).not.toHaveTextContent('開始使用')

      // 進入 Step 1
      fireEvent.click(button)

      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // Step 1: 確認仍然顯示「繼續」
      expect(button).toHaveTextContent('繼續')
      expect(button).not.toHaveTextContent('開始使用')
    })

    test('步驟 2 應該顯示「開始使用」', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const button = screen.getByRole('button')

      // 點擊進入 Step 1
      fireEvent.click(button)
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // 點擊進入 Step 2
      fireEvent.click(button)
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // Step 2: 確認顯示「開始使用」
      expect(button).toHaveTextContent('開始使用')
      expect(button).not.toHaveTextContent('繼續')
    })
  })

  describe('Onboarding Flow', () => {
    test('完成所有步驟後應該調用 onComplete 並傳遞用戶資料', async () => {
      const mockOnComplete = vi.fn()
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const button = screen.getByRole('button')

      // 完成 3 個步驟
      fireEvent.click(button)
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      fireEvent.click(button)
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      fireEvent.click(button)
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

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

      const button = screen.getByRole('button')

      // 完成所有步驟
      for (let i = 0; i < 3; i++) {
        fireEvent.click(button)
        await act(async () => {
          vi.advanceTimersByTime(300)
        })
      }

      // 驗證 monthlySavings = salary × 0.2
      expect(mockOnComplete).toHaveBeenCalled()
      const userData = mockOnComplete.mock.calls[0][0]
      expect(userData.monthlySavings).toBe(Math.round(userData.salary * 0.2))
    })
  })
})
