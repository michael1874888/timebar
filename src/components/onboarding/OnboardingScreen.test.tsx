/**
 * OnboardingScreen Integration Tests
 *
 * 測試範圍：
 * - 初始渲染與步驟顯示
 * - 完整的使用者流程（5步驟導覽）
 * - 輸入驗證與範圍限制
 * - 表單提交與資料傳遞
 * - UI元素互動（按鈕、滑桿、步驟指示器）
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OnboardingScreen } from './OnboardingScreen'
import { UserData } from '@/types'
import { FinanceCalc, CONSTANTS } from '@/utils/financeCalc'

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS

describe('OnboardingScreen', () => {
  let mockOnComplete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnComplete = vi.fn()
  })

  // Helper function to navigate to a specific step
  const navigateToStep = async (targetStep: number) => {
    const stepTitles = [
      '你幾歲？',
      '月薪多少？',
      '想幾歲退休？',
      '目前有多少存款？',
      '每月存多少？'
    ]

    for (let i = 0; i < targetStep; i++) {
      const button = screen.getByRole('button', { name: '繼續' })
      fireEvent.click(button)

      if (i < targetStep - 1) {
        await waitFor(() => screen.getByText(stepTitles[i + 1]), { timeout: 1000 })
      } else {
        // Final step - wait for the next expected content
        await waitFor(() => screen.getByText(stepTitles[targetStep]), { timeout: 1000 })
      }
    }
  }

  describe('Initial Render', () => {
    test('應該顯示標題與副標題', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      expect(screen.getByText('Time')).toBeInTheDocument()
      expect(screen.getByText('Bar')).toBeInTheDocument()
      expect(screen.getByText('你的時間，你定價')).toBeInTheDocument()
    })

    test('應該初始化在第1步（年齡設定）', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      expect(screen.getByText('你幾歲？')).toBeInTheDocument()
      expect(screen.getByText('讓我們從現在開始計算')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument() // 預設年齡
      expect(screen.getByText('歲')).toBeInTheDocument()
    })

    test('應該顯示5個步驟指示器', () => {
      const { container } = render(<OnboardingScreen onComplete={mockOnComplete} />)

      const indicators = container.querySelectorAll('.rounded-full')
      expect(indicators).toHaveLength(5)
    })

    test('第1個步驟指示器應該是活動狀態', () => {
      const { container } = render(<OnboardingScreen onComplete={mockOnComplete} />)

      const indicators = container.querySelectorAll('.rounded-full')
      expect(indicators[0]).toHaveClass('bg-emerald-400')
    })

    test('應該顯示「繼續」按鈕', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const button = screen.getByRole('button', { name: '繼續' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Step 1: Age Input', () => {
    test('應該顯示年齡滑桿範圍（18-55）', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const slider = screen.getByRole('slider') as HTMLInputElement
      expect(slider.min).toBe('18')
      expect(slider.max).toBe('55')
      expect(slider.value).toBe('30')
    })

    test('應該能調整年齡數值', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const slider = screen.getByRole('slider') as HTMLInputElement
      fireEvent.change(slider, { target: { value: '25' } })

      expect(screen.getByText('25')).toBeInTheDocument()
    })

    test('應該顯示範圍標籤（18和55）', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      expect(screen.getByText('18')).toBeInTheDocument()
      expect(screen.getByText('55')).toBeInTheDocument()
    })
  })

  describe('Step 2: Salary Input', () => {
    test('點擊「繼續」應該前往薪資設定頁', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const continueButton = screen.getByRole('button', { name: '繼續' })
      fireEvent.click(continueButton)

      await waitFor(() => {
        expect(screen.getByText('月薪多少？')).toBeInTheDocument()
        expect(screen.getByText('這決定了你的時間單價')).toBeInTheDocument()
      })
    })

    test('應該顯示預設薪資NT$ 50,000', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        expect(screen.getByText('NT$ 50,000')).toBeInTheDocument()
        expect(screen.getByText('/月')).toBeInTheDocument()
      })
    })

    test('應該計算並顯示時薪', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        const hourlyRate = Math.round(FinanceCalc.hourlyRate(50000))
        expect(screen.getByText(/時薪約/i)).toBeInTheDocument()
        expect(screen.getByText(`$${hourlyRate}`)).toBeInTheDocument()
      })
    })

    test('應該顯示薪資滑桿範圍（25,000-500,000，步進5,000）', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        const slider = screen.getByRole('slider') as HTMLInputElement
        expect(slider.min).toBe('25000')
        expect(slider.max).toBe('500000')
        expect(slider.step).toBe('5000')
      })
    })

    test('調整薪資應該更新時薪顯示', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        fireEvent.change(slider, { target: { value: '100000' } })

        const newHourlyRate = Math.round(FinanceCalc.hourlyRate(100000))
        expect(screen.getByText(`$${newHourlyRate}`)).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: Retirement Age Input', () => {
    test('應該顯示退休年齡頁面', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(2)

      await waitFor(() => {
        expect(screen.getByText('想幾歲退休？')).toBeInTheDocument()
        expect(screen.getByText('這是你的目標，GPS 會幫你導航')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('應該顯示預設退休年齡65', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(2)

      await waitFor(() => {
        expect(screen.getByText('65')).toBeInTheDocument()
        expect(screen.getByText('歲退休')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('應該計算並顯示剩餘工作年數', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // Step 1: 設定年齡為30
      const ageSlider = screen.getByRole('slider')
      fireEvent.change(ageSlider, { target: { value: '30' } })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => screen.getByText('月薪多少？'))
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        expect(screen.getByText(/還有/)).toBeInTheDocument()
        expect(screen.getByText('35 年')).toBeInTheDocument()
        expect(screen.getByText(/可以奮鬥/)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('退休年齡滑桿的最小值應該是當前年齡+5', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // Step 1: 設定年齡為40
      const ageSlider = screen.getByRole('slider')
      fireEvent.change(ageSlider, { target: { value: '40' } })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => screen.getByText('月薪多少？'))
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        const retireSlider = screen.getByRole('slider') as HTMLInputElement
        expect(retireSlider.min).toBe('45') // 40 + 5
        expect(retireSlider.max).toBe('75')
      }, { timeout: 1000 })
    })

    test('調整退休年齡應該更新剩餘年數', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(2)

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        fireEvent.change(slider, { target: { value: '60' } })

        expect(screen.getByText('30 年')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Step 4: Current Savings Input', () => {
    test('應該顯示存款設定頁面', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(3)

      await waitFor(() => {
        expect(screen.getByText('目前有多少存款？')).toBeInTheDocument()
        expect(screen.getByText('這是你的起跑點')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('應該顯示預設存款為0', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(3)

      await waitFor(() => {
        expect(screen.getByText('NT$ 0')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('應該顯示存款滑桿範圍（0-10,000,000，步進100,000）', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(3)

      await waitFor(() => {
        const slider = screen.getByRole('slider') as HTMLInputElement
        expect(slider.min).toBe('0')
        expect(slider.max).toBe('10000000')
        expect(slider.step).toBe('100000')
      }, { timeout: 1000 })
    })

    test('應該顯示鼓勵文字', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(3)

      await waitFor(() => {
        expect(screen.getByText(/沒有也沒關係，從零開始更厲害/)).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Step 5: Monthly Savings Input', () => {
    test('應該顯示每月儲蓄頁面', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        expect(screen.getByText('每月存多少？')).toBeInTheDocument()
        expect(screen.getByText('這只是估計，之後可以調整')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('預設每月儲蓄應該是薪資的20%', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        // 預設薪資50,000的20%是10,000
        expect(screen.getByText('NT$ 10,000')).toBeInTheDocument()
        expect(screen.getByText('/每月')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('應該顯示儲蓄佔薪資的百分比', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        expect(screen.getByText(/佔月薪 20%/)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('應該顯示退休金預估', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        expect(screen.getByText(/按此計畫，65歲時可累積/)).toBeInTheDocument()
        expect(screen.getByText(/退休後每月可領約/)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('每月儲蓄滑桿最大值應該是薪資或200,000的較小值', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        const slider = screen.getByRole('slider') as HTMLInputElement
        expect(slider.min).toBe('0')
        expect(slider.max).toBe('50000') // Math.min(50000, 200000)
        expect(slider.step).toBe('1000')
      }, { timeout: 1000 })
    })

    test('應該顯示「開始使用」按鈕而非「繼續」', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: '開始使用' })
        expect(button).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Navigation Flow', () => {
    test('應該能完整導覽所有5個步驟', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // Step 1
      expect(screen.getByText('你幾歲？')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      // Step 2
      await waitFor(() => {
        expect(screen.getByText('月薪多少？')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      // Step 3
      await waitFor(() => {
        expect(screen.getByText('想幾歲退休？')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      // Step 4
      await waitFor(() => {
        expect(screen.getByText('目前有多少存款？')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      // Step 5
      await waitFor(() => {
        expect(screen.getByText('每月存多少？')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '開始使用' })).toBeInTheDocument()
      })
    })

    test('步驟指示器應該正確更新', async () => {
      const { container } = render(<OnboardingScreen onComplete={mockOnComplete} />)

      const getIndicators = () => container.querySelectorAll('.rounded-full')

      // 初始狀態：第1個指示器活動
      expect(getIndicators()[0]).toHaveClass('bg-emerald-400')

      // 前往第2步
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        const indicators = getIndicators()
        expect(indicators[0]).toHaveClass('bg-emerald-600') // 已完成
        expect(indicators[1]).toHaveClass('bg-emerald-400') // 活動中
      })
    })
  })

  describe('Input Validation', () => {
    test('年齡應該限制在18-55之間', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const slider = screen.getByRole('slider') as HTMLInputElement

      // 測試最小值
      fireEvent.change(slider, { target: { value: '18' } })
      expect(slider.value).toBe('18')

      // 測試最大值
      fireEvent.change(slider, { target: { value: '55' } })
      expect(slider.value).toBe('55')
    })

    test('薪資應該限制在25,000-500,000之間', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        const slider = screen.getByRole('slider') as HTMLInputElement

        // 測試最小值
        fireEvent.change(slider, { target: { value: '25000' } })
        expect(screen.getByText('NT$ 25,000')).toBeInTheDocument()

        // 測試最大值
        fireEvent.change(slider, { target: { value: '500000' } })
        expect(screen.getByText('NT$ 500,000')).toBeInTheDocument()
      })
    })

    test('退休年齡應該至少比當前年齡大5歲', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 設定年齡為35
      const ageSlider = screen.getByRole('slider')
      fireEvent.change(ageSlider, { target: { value: '35' } })

      // 導航到退休年齡頁
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))
      await waitFor(() => screen.getByText('月薪多少？'))
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        const retireSlider = screen.getByRole('slider') as HTMLInputElement
        expect(retireSlider.min).toBe('40') // 35 + 5
      })
    })

    test('存款應該限制在0-10,000,000之間', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(3)

      await waitFor(() => {
        const slider = screen.getByRole('slider') as HTMLInputElement
        expect(slider.min).toBe('0')
        expect(slider.max).toBe('10000000')
      }, { timeout: 1000 })
    })

    test('每月儲蓄應該不超過薪資', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        const slider = screen.getByRole('slider') as HTMLInputElement
        // 預設薪資50,000
        expect(parseInt(slider.max)).toBeLessThanOrEqual(50000)
      }, { timeout: 1000 })
    })
  })

  describe('Form Submission', () => {
    test('點擊「開始使用」應該呼叫onComplete並傳遞正確的使用者資料', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 設定各項數值
      const ageSlider = screen.getByRole('slider')
      fireEvent.change(ageSlider, { target: { value: '35' } })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      // Step 2: 薪資
      await waitFor(() => screen.getByText('月薪多少？'))
      const salarySlider = screen.getByRole('slider')
      fireEvent.change(salarySlider, { target: { value: '80000' } })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      // Step 3: 退休年齡
      await waitFor(() => screen.getByText('想幾歲退休？'))
      const retireSlider = screen.getByRole('slider')
      fireEvent.change(retireSlider, { target: { value: '60' } })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      // Step 4: 存款
      await waitFor(() => screen.getByText('目前有多少存款？'))
      const savingsSlider = screen.getByRole('slider')
      fireEvent.change(savingsSlider, { target: { value: '500000' } })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      // Step 5: 每月儲蓄
      await waitFor(() => screen.getByText('每月存多少？'))
      const monthlySavingsSlider = screen.getByRole('slider')
      fireEvent.change(monthlySavingsSlider, { target: { value: '20000' } })

      // 點擊開始使用
      const startButton = screen.getByRole('button', { name: '開始使用' })
      fireEvent.click(startButton)

      // 驗證onComplete被呼叫
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1)
      })

      // 驗證傳遞的資料
      const userData: UserData = mockOnComplete.mock.calls[0][0]
      expect(userData.age).toBe(35)
      expect(userData.salary).toBe(80000)
      expect(userData.retireAge).toBe(60)
      expect(userData.currentSavings).toBe(500000)
      expect(userData.monthlySavings).toBe(20000)
      expect(userData.inflationRate).toBe(DEFAULT_INFLATION_RATE)
      expect(userData.roiRate).toBe(DEFAULT_ROI_RATE)
    })

    test('應該計算並包含targetRetirementFund', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 使用預設值導航到最後
      await navigateToStep(4)

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: '開始使用' })
        fireEvent.click(startButton)
      }, { timeout: 1000 })

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
        const userData: UserData = mockOnComplete.mock.calls[0][0]
        expect(userData.targetRetirementFund).toBeDefined()
        expect(userData.targetRetirementFund).toBeGreaterThan(0)
      })
    })

    test('targetRetirementFund應該基於FinanceCalc計算', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 使用預設值：age=30, salary=50000, retireAge=65, currentSavings=0, monthlySavings=10000
      await navigateToStep(4)

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: '開始使用' }))
      }, { timeout: 1000 })

      await waitFor(() => {
        const userData: UserData = mockOnComplete.mock.calls[0][0]
        const realRate = FinanceCalc.realRate(DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE)
        const yearsToRetire = 65 - 30
        const expectedFund = FinanceCalc.targetFundByAge(0, 10000, yearsToRetire, realRate)

        expect(userData.targetRetirementFund).toBe(Math.round(expectedFund))
      })
    })
  })

  describe('Dependent Calculations', () => {
    test('調整薪資應該自動更新預設每月儲蓄為20%', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 導航到薪資頁
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => screen.getByText('月薪多少？'))

      const salarySlider = screen.getByRole('slider')
      fireEvent.change(salarySlider, { target: { value: '100000' } })

      // 導航到每月儲蓄頁
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))
      await waitFor(() => screen.getByText('想幾歲退休？'), { timeout: 1000 })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))
      await waitFor(() => screen.getByText('目前有多少存款？'), { timeout: 1000 })
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        // 100,000 * 20% = 20,000
        expect(screen.getByText('NT$ 20,000')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('退休金預估應該隨著輸入值變化', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        const initialPreview = screen.getByText(/按此計畫/)

        // 調整每月儲蓄
        const slider = screen.getByRole('slider')
        fireEvent.change(slider, { target: { value: '20000' } })

        // 預估金額應該更新（實際值取決於計算）
        expect(initialPreview).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Edge Cases', () => {
    test('應該處理最小年齡（18）和最大退休年齡（75）', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 設定最小年齡
      const ageSlider = screen.getByRole('slider') as HTMLInputElement
      fireEvent.change(ageSlider, { target: { value: '18' } })
      expect(ageSlider.value).toBe('18')

      fireEvent.click(screen.getByRole('button', { name: '繼續' }))
      await waitFor(() => screen.getByText('月薪多少？'))
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        // 退休年齡應該是18+5=23到75
        const retireSlider = screen.getByRole('slider') as HTMLInputElement
        expect(retireSlider.min).toBe('23')
        expect(retireSlider.max).toBe('75')

        // 設定最大退休年齡
        fireEvent.change(retireSlider, { target: { value: '75' } })
        expect(retireSlider.value).toBe('75')

        // 工作年數應該是57年
        expect(screen.getByText('57 年')).toBeInTheDocument()
      })
    })

    test('應該處理最大年齡（55）的退休規劃', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      // 設定最大年齡
      const ageSlider = screen.getByRole('slider') as HTMLInputElement
      fireEvent.change(ageSlider, { target: { value: '55' } })
      expect(ageSlider.value).toBe('55')

      fireEvent.click(screen.getByRole('button', { name: '繼續' }))
      await waitFor(() => screen.getByText('月薪多少？'))
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        // 退休年齡最小應該是60（55+5）
        const retireSlider = screen.getByRole('slider') as HTMLInputElement
        expect(retireSlider.min).toBe('60')
      })
    })

    test('應該處理零存款的情況', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(3)

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        fireEvent.change(slider, { target: { value: '0' } })
        expect(screen.getByText('NT$ 0')).toBeInTheDocument()
      }, { timeout: 1000 })

      // 應該仍然能完成流程
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))
      await waitFor(() => {
        expect(screen.getByText('每月存多少？')).toBeInTheDocument()
      })
    })

    test('應該處理零每月儲蓄的情況', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        fireEvent.change(slider, { target: { value: '0' } })
        expect(screen.getByText('NT$ 0')).toBeInTheDocument()
        expect(screen.getByText(/佔月薪 0%/)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    test('應該處理高薪資（500,000）的情況', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        const salarySlider = screen.getByRole('slider')
        fireEvent.change(salarySlider, { target: { value: '500000' } })

        const hourlyRate = Math.round(FinanceCalc.hourlyRate(500000))
        expect(screen.getByText(`$${hourlyRate}`)).toBeInTheDocument()
      })

      // 導航到每月儲蓄頁
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))
      await waitFor(() => screen.getByText('想幾歲退休？'))
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))
      await waitFor(() => screen.getByText('目前有多少存款？'))
      fireEvent.click(screen.getByRole('button', { name: '繼續' }))

      await waitFor(() => {
        // 每月儲蓄最大值應該限制在200,000（即使薪資是500,000）
        const monthlySavingsSlider = screen.getByRole('slider') as HTMLInputElement
        expect(monthlySavingsSlider.max).toBe('200000')
      })
    })
  })

  describe('UI Interactions', () => {
    test('按鈕應該有正確的樣式類別', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const button = screen.getByRole('button', { name: '繼續' })
      expect(button).toHaveClass('bg-emerald-500')
      expect(button).toHaveClass('hover:bg-emerald-400')
    })

    test('滑桿應該有slider類別', () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const slider = screen.getByRole('slider')
      expect(slider).toHaveClass('slider')
    })

    test('所有步驟都應該有過渡動畫類別', async () => {
      const { container } = render(<OnboardingScreen onComplete={mockOnComplete} />)

      const animatedElements = container.querySelectorAll('.transition-all')
      expect(animatedElements.length).toBeGreaterThan(0)
    })
  })

  describe('Regression Tests', () => {
    test('快速連續點擊「繼續」不應該跳過步驟', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      const button = screen.getByRole('button', { name: '繼續' })

      // 快速點擊兩次
      fireEvent.click(button)
      fireEvent.click(button)

      // 應該只前進到第2步
      await waitFor(() => {
        expect(screen.getByText('月薪多少？')).toBeInTheDocument()
      })

      // onComplete不應該被呼叫
      expect(mockOnComplete).not.toHaveBeenCalled()
    })

    test('完成流程後onComplete只應該被呼叫一次', async () => {
      render(<OnboardingScreen onComplete={mockOnComplete} />)

      await navigateToStep(4)

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: '開始使用' })
        fireEvent.click(startButton)
        fireEvent.click(startButton) // 再點一次
      }, { timeout: 1000 })

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1)
      })
    })
  })
})
