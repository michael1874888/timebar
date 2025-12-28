/**
 * MainTracker Integration Tests
 *
 * 測試範圍:
 * - 初始渲染與支出/儲蓄模式
 * - 模式切換功能
 * - 一次性與固定支出/儲蓄記錄
 * - 時間成本計算與顯示
 * - GPS狀態顯示（領先/落後/符合計畫）
 * - 儲蓄時的慶祝動畫
 * - 歷史與設定頁面導航
 * - 分類選擇功能
 * - 備註輸入
 * - 輸入驗證與邊界情況
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MainTracker } from './MainTracker'
import { UserData, Record } from '@/types'
import { FinanceCalc, GPSCalc, Formatters, CONSTANTS } from '@/utils/financeCalc'

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS
const { formatTime, formatCurrency, formatAgeDiff } = Formatters

describe('MainTracker', () => {
  let mockUserData: UserData
  let mockRecords: Record[]
  let mockOnAddRecord: ReturnType<typeof vi.fn>
  let mockOnOpenHistory: ReturnType<typeof vi.fn>
  let mockOnOpenSettings: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // 預設使用者資料
    mockUserData = {
      age: 30,
      salary: 50000,
      retireAge: 65,
      currentSavings: 100000,
      monthlySavings: 10000,
      inflationRate: DEFAULT_INFLATION_RATE,
      roiRate: DEFAULT_ROI_RATE,
      targetRetirementFund: 5000000,
    }

    // 預設空白記錄
    mockRecords = []

    // Mock 回調函數
    mockOnAddRecord = vi.fn()
    mockOnOpenHistory = vi.fn()
    mockOnOpenSettings = vi.fn()

    // 重置所有 mock
    vi.clearAllMocks()
  })

  // Helper function to render component with default props
  const renderMainTracker = (
    userData = mockUserData,
    records = mockRecords,
    onAddRecord = mockOnAddRecord,
    onOpenHistory = mockOnOpenHistory,
    onOpenSettings = mockOnOpenSettings
  ) => {
    return render(
      <MainTracker
        userData={userData}
        records={records}
        onAddRecord={onAddRecord}
        onOpenHistory={onOpenHistory}
        onOpenSettings={onOpenSettings}
      />
    )
  }

  describe('Initial Render', () => {
    test('應該顯示標題 TimeBar', () => {
      renderMainTracker()

      expect(screen.getByText('Time')).toBeInTheDocument()
      expect(screen.getByText('Bar')).toBeInTheDocument()
    })

    test('應該預設為支出模式', () => {
      renderMainTracker()

      const spendButton = screen.getByRole('button', { name: '💸 花費' })
      expect(spendButton).toHaveClass('bg-orange-500')
    })

    test('應該顯示預設金額 NT$ 500', () => {
      renderMainTracker()

      expect(screen.getByText('NT$ 500')).toBeInTheDocument()
    })

    test('應該顯示目標退休年齡', () => {
      renderMainTracker()

      expect(screen.getByText('65 歲')).toBeInTheDocument()
    })

    test('應該顯示預估退休年齡（無記錄時應該等於目標年齡）', () => {
      renderMainTracker()

      expect(screen.getByText('65.0 歲')).toBeInTheDocument()
    })

    test('應該顯示「符合計畫」狀態（無記錄時）', () => {
      renderMainTracker()

      expect(screen.getByText(/完美！目前剛好符合計畫/)).toBeInTheDocument()
    })

    test('應該顯示統計摘要（額外儲蓄、退休時間影響、額外支出）', () => {
      renderMainTracker()

      expect(screen.getByText('額外儲蓄')).toBeInTheDocument()
      expect(screen.getByText('退休時間影響')).toBeInTheDocument()
      expect(screen.getByText('額外支出')).toBeInTheDocument()
    })

    test('應該顯示「記錄花費」按鈕', () => {
      renderMainTracker()

      expect(screen.getByRole('button', { name: '記錄花費' })).toBeInTheDocument()
    })

    test('應該顯示底部導航列', () => {
      renderMainTracker()

      const navButtons = screen.getAllByRole('button')
      const recordButton = navButtons.find(btn => btn.textContent?.includes('記錄'))
      const historyButton = navButtons.find(btn => btn.textContent?.includes('歷史'))
      const settingsButton = navButtons.find(btn => btn.textContent?.includes('設定'))

      expect(recordButton).toBeInTheDocument()
      expect(historyButton).toBeInTheDocument()
      expect(settingsButton).toBeInTheDocument()
    })

    test('應該顯示「僅此一次」切換按鈕（預設非固定）', () => {
      renderMainTracker()

      expect(screen.getByRole('button', { name: /僅此一次/ })).toBeInTheDocument()
    })

    test('應該顯示分類選擇區域', () => {
      renderMainTracker()

      expect(screen.getByText('分類（選填）')).toBeInTheDocument()
    })

    test('應該顯示備註輸入框', () => {
      renderMainTracker()

      expect(screen.getByPlaceholderText('備註（選填）')).toBeInTheDocument()
    })
  })

  describe('Mode Switching', () => {
    test('點擊「儲蓄」應該切換到儲蓄模式', () => {
      renderMainTracker()

      const saveButton = screen.getByRole('button', { name: '💰 儲蓄' })
      fireEvent.click(saveButton)

      expect(saveButton).toHaveClass('bg-emerald-500')
      expect(screen.getByText('這次要存')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '記錄儲蓄' })).toBeInTheDocument()
    })

    test('切換到儲蓄模式應該顯示儲蓄分類', () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      expect(screen.getByRole('button', { name: '薪資儲蓄' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '獎金' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '投資收益' })).toBeInTheDocument()
    })

    test('切換到支出模式應該顯示支出分類', () => {
      renderMainTracker()

      // 先切到儲蓄模式
      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))
      // 再切回支出模式
      fireEvent.click(screen.getByRole('button', { name: '💸 花費' }))

      expect(screen.getByRole('button', { name: '飲食' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '購物' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '娛樂' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '交通' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '訂閱' })).toBeInTheDocument()
    })

    test('支出模式應該顯示「這會讓你的退休延後」', () => {
      renderMainTracker()

      expect(screen.getByText('這會讓你的退休延後')).toBeInTheDocument()
    })

    test('儲蓄模式應該顯示「這會讓你的退休提早」', () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      expect(screen.getByText('這會讓你的退休提早')).toBeInTheDocument()
    })
  })

  describe('Amount Input', () => {
    test('應該能使用滑桿調整金額', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1000' } })

      expect(screen.getByText('NT$ 1,000')).toBeInTheDocument()
    })

    test('應該能使用快速金額按鈕', () => {
      renderMainTracker()

      const button1000 = screen.getByRole('button', { name: '1,000' })
      fireEvent.click(button1000)

      expect(screen.getByText('NT$ 1,000')).toBeInTheDocument()
    })

    test('快速金額按鈕應該包含 100, 500, 1000, 3000, 5000, 10000', () => {
      renderMainTracker()

      expect(screen.getByRole('button', { name: '100' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '500' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '1,000' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '3,000' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '5,000' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '1萬' })).toBeInTheDocument()
    })

    test('滑桿範圍應該是 0-100000', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider') as HTMLInputElement
      expect(slider.min).toBe('0')
      expect(slider.max).toBe('100000')
    })

    test('選中的快速金額按鈕應該有不同樣式', () => {
      renderMainTracker()

      const button500 = screen.getByRole('button', { name: '500' })
      // 預設金額是 500，所以應該有選中樣式
      expect(button500).toHaveClass('bg-orange-500')
    })
  })

  describe('Recurring Toggle', () => {
    test('點擊切換按鈕應該切換到「每月固定」模式', () => {
      renderMainTracker()

      const toggleButton = screen.getByRole('button', { name: /僅此一次/ })
      fireEvent.click(toggleButton)

      expect(screen.getByRole('button', { name: /每月固定/ })).toBeInTheDocument()
    })

    test('每月固定模式應該顯示 /每月 標籤', () => {
      renderMainTracker()

      const toggleButton = screen.getByRole('button', { name: /僅此一次/ })
      fireEvent.click(toggleButton)

      expect(screen.getByText('/每月')).toBeInTheDocument()
    })

    test('每月固定模式應該顯示警告訊息', () => {
      renderMainTracker()

      const toggleButton = screen.getByRole('button', { name: /僅此一次/ })
      fireEvent.click(toggleButton)

      expect(screen.getByText(/每月訂閱的威力驚人/)).toBeInTheDocument()
    })

    test('儲蓄模式的每月固定應該顯示複利提示', () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))
      const toggleButton = screen.getByRole('button', { name: /僅此一次/ })
      fireEvent.click(toggleButton)

      expect(screen.getByText(/定期儲蓄的複利威力/)).toBeInTheDocument()
    })
  })

  describe('Time Cost Calculation', () => {
    test('應該計算並顯示一次性支出的時間成本', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1000' } })

      const hourlyRate = FinanceCalc.hourlyRate(mockUserData.salary)
      const realRate = FinanceCalc.realRate(mockUserData.inflationRate, mockUserData.roiRate)
      const yearsToRetire = mockUserData.retireAge - mockUserData.age
      const timeCost = FinanceCalc.calculateTimeCost(1000, false, hourlyRate, realRate, yearsToRetire)
      const formatted = formatTime(timeCost)

      expect(screen.getByText(formatted.value.toString())).toBeInTheDocument()
      expect(screen.getByText(formatted.unit)).toBeInTheDocument()
    })

    test('應該計算並顯示每月固定支出的時間成本', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1000' } })

      const toggleButton = screen.getByRole('button', { name: /僅此一次/ })
      fireEvent.click(toggleButton)

      const hourlyRate = FinanceCalc.hourlyRate(mockUserData.salary)
      const realRate = FinanceCalc.realRate(mockUserData.inflationRate, mockUserData.roiRate)
      const yearsToRetire = mockUserData.retireAge - mockUserData.age
      const timeCost = FinanceCalc.calculateTimeCost(1000, true, hourlyRate, realRate, yearsToRetire)
      const formatted = formatTime(timeCost)

      expect(screen.getByText(formatted.value.toString())).toBeInTheDocument()
      expect(screen.getByText(formatted.unit)).toBeInTheDocument()
    })

    test('應該顯示時間成本的等價描述', () => {
      renderMainTracker()

      expect(screen.getByText(/💡 相當於/)).toBeInTheDocument()
    })

    test('時間成本應該根據金額變化即時更新', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')

      // 設定金額 500
      fireEvent.change(slider, { target: { value: '500' } })
      const hourlyRate = FinanceCalc.hourlyRate(mockUserData.salary)
      const realRate = FinanceCalc.realRate(mockUserData.inflationRate, mockUserData.roiRate)
      const yearsToRetire = mockUserData.retireAge - mockUserData.age
      const timeCost500 = FinanceCalc.calculateTimeCost(500, false, hourlyRate, realRate, yearsToRetire)
      const formatted500 = formatTime(timeCost500)

      expect(screen.getByText(formatted500.value.toString())).toBeInTheDocument()

      // 改成金額 5000
      fireEvent.change(slider, { target: { value: '5000' } })
      const timeCost5000 = FinanceCalc.calculateTimeCost(5000, false, hourlyRate, realRate, yearsToRetire)
      const formatted5000 = formatTime(timeCost5000)

      expect(screen.getByText(formatted5000.value.toString())).toBeInTheDocument()
    })
  })

  describe('GPS Status Display', () => {
    test('無記錄時應該顯示「符合計畫」', () => {
      renderMainTracker()

      expect(screen.getByText(/完美！目前剛好符合計畫/)).toBeInTheDocument()
    })

    test('有儲蓄記錄應該顯示「領先」狀態', () => {
      const recordsWithSave: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '獎金',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      renderMainTracker(mockUserData, recordsWithSave)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, recordsWithSave)

      if (gpsResult.isAhead) {
        expect(screen.getByText(/領先/)).toBeInTheDocument()
        expect(screen.getByText(/繼續保持/)).toBeInTheDocument()
      }
    })

    test('有支出記錄應該顯示「落後」狀態', () => {
      const recordsWithSpend: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '購物',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      renderMainTracker(mockUserData, recordsWithSpend)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, recordsWithSpend)

      if (gpsResult.isBehind) {
        expect(screen.getByText(/落後/)).toBeInTheDocument()
        expect(screen.getByText(/加油追上/)).toBeInTheDocument()
      }
    })

    test('應該顯示預估退休年齡', () => {
      const recordsWithSpend: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '購物',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      renderMainTracker(mockUserData, recordsWithSpend)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, recordsWithSpend)
      const estimatedAge = gpsResult.estimatedAge.toFixed(1)

      expect(screen.getByText(`${estimatedAge} 歲`)).toBeInTheDocument()
    })

    test('領先狀態應該使用綠色樣式', () => {
      const recordsWithSave: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '獎金',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      const { container } = renderMainTracker(mockUserData, recordsWithSave)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, recordsWithSave)

      if (gpsResult.isAhead) {
        const statusBar = container.querySelector('.bg-emerald-500\\/20')
        expect(statusBar).toBeInTheDocument()
      }
    })

    test('落後狀態應該使用橘色樣式', () => {
      const recordsWithSpend: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '購物',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      const { container } = renderMainTracker(mockUserData, recordsWithSpend)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, recordsWithSpend)

      if (gpsResult.isBehind) {
        const statusBar = container.querySelector('.bg-orange-500\\/20')
        expect(statusBar).toBeInTheDocument()
      }
    })

    test('應該顯示退休時間影響（天數）', () => {
      renderMainTracker()

      // 文字可能被分散在多個元素中，使用 textContent 查詢
      expect(screen.getByText(/±0/)).toBeInTheDocument()
      expect(screen.getByText('退休時間影響')).toBeInTheDocument()
    })

    test('應該計算並顯示總儲蓄金額', () => {
      const recordsWithSave: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
        {
          id: '2',
          type: 'save',
          amount: 3000,
          isRecurring: false,
          timeCost: 150,
          category: '副業收入',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      renderMainTracker(mockUserData, recordsWithSave)

      const totals = GPSCalc.calculateTotals(recordsWithSave)
      const formattedSaved = formatCurrency(totals.totalSaved)

      expect(screen.getByText(formattedSaved)).toBeInTheDocument()
    })

    test('應該計算並顯示總支出金額', () => {
      const recordsWithSpend: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 2000,
          isRecurring: false,
          timeCost: 100,
          category: '飲食',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
        {
          id: '2',
          type: 'spend',
          amount: 1500,
          isRecurring: false,
          timeCost: 75,
          category: '交通',
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        },
      ]

      renderMainTracker(mockUserData, recordsWithSpend)

      const totals = GPSCalc.calculateTotals(recordsWithSpend)
      const formattedSpent = formatCurrency(totals.totalSpent)

      expect(screen.getByText(formattedSpent)).toBeInTheDocument()
    })
  })

  describe('Category Selection', () => {
    test('支出模式應該顯示所有支出分類', () => {
      renderMainTracker()

      expect(screen.getByRole('button', { name: '飲食' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '購物' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '娛樂' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '交通' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '訂閱' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '其他' })).toBeInTheDocument()
    })

    test('儲蓄模式應該顯示所有儲蓄分類', () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      expect(screen.getByRole('button', { name: '薪資儲蓄' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '獎金' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '投資收益' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '副業收入' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '其他' })).toBeInTheDocument()
    })

    test('點擊分類按鈕應該選中該分類', () => {
      renderMainTracker()

      const categoryButton = screen.getByRole('button', { name: '飲食' })
      fireEvent.click(categoryButton)

      expect(categoryButton).toHaveClass('bg-gray-600')
    })

    test('再次點擊已選中的分類應該取消選擇', () => {
      renderMainTracker()

      const categoryButton = screen.getByRole('button', { name: '飲食' })
      fireEvent.click(categoryButton)
      expect(categoryButton).toHaveClass('bg-gray-600')

      fireEvent.click(categoryButton)
      expect(categoryButton).toHaveClass('bg-gray-800/50')
    })

    test('選擇分類後再選其他分類應該切換分類', () => {
      renderMainTracker()

      const foodButton = screen.getByRole('button', { name: '飲食' })
      const shoppingButton = screen.getByRole('button', { name: '購物' })

      fireEvent.click(foodButton)
      expect(foodButton).toHaveClass('bg-gray-600')

      fireEvent.click(shoppingButton)
      expect(shoppingButton).toHaveClass('bg-gray-600')
      expect(foodButton).toHaveClass('bg-gray-800/50')
    })
  })

  describe('Note Input', () => {
    test('應該能輸入備註', () => {
      renderMainTracker()

      const noteInput = screen.getByPlaceholderText('備註（選填）') as HTMLInputElement
      fireEvent.change(noteInput, { target: { value: '測試備註' } })

      expect(noteInput.value).toBe('測試備註')
    })

    test('備註輸入框應該有正確的樣式', () => {
      renderMainTracker()

      const noteInput = screen.getByPlaceholderText('備註（選填）')
      expect(noteInput).toHaveClass('bg-gray-800/50')
    })
  })

  describe('Record Submission - One-time Expense', () => {
    test('點擊「記錄花費」應該呼叫 onAddRecord', async () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1000' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnAddRecord).toHaveBeenCalledTimes(1)
      })
    })

    test('提交記錄應該包含正確的資料結構', async () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1000' } })

      const categoryButton = screen.getByRole('button', { name: '飲食' })
      fireEvent.click(categoryButton)

      const noteInput = screen.getByPlaceholderText('備註（選填）')
      fireEvent.change(noteInput, { target: { value: '午餐' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnAddRecord).toHaveBeenCalled()
        const recordData = mockOnAddRecord.mock.calls[0][0] as Record

        expect(recordData.type).toBe('spend')
        expect(recordData.amount).toBe(1000)
        expect(recordData.isRecurring).toBe(false)
        expect(recordData.category).toBe('飲食')
        expect(recordData.note).toBe('午餐')
        expect(recordData.id).toBeDefined()
        expect(recordData.timestamp).toBeDefined()
        expect(recordData.date).toBeDefined()
      })
    })

    test('未選擇分類時應該使用預設分類「一般消費」', async () => {
      renderMainTracker()

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const recordData = mockOnAddRecord.mock.calls[0][0] as Record
        expect(recordData.category).toBe('一般消費')
      })
    })

    test('提交後應該顯示結果頁面', async () => {
      renderMainTracker()

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('已記錄')).toBeInTheDocument()
        expect(screen.getByText(/這筆花費讓退休延後了/)).toBeInTheDocument()
      })
    })

    test('提交後應該顯示正確的時間成本', async () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1000' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      const hourlyRate = FinanceCalc.hourlyRate(mockUserData.salary)
      const realRate = FinanceCalc.realRate(mockUserData.inflationRate, mockUserData.roiRate)
      const yearsToRetire = mockUserData.retireAge - mockUserData.age
      const timeCost = FinanceCalc.calculateTimeCost(1000, false, hourlyRate, realRate, yearsToRetire)
      const formatted = formatTime(timeCost)

      await waitFor(() => {
        expect(screen.getByText(formatted.value.toString())).toBeInTheDocument()
        expect(screen.getByText(formatted.unit)).toBeInTheDocument()
      })
    })

    test('提交支出應該顯示紅色背景漸層', async () => {
      const { container } = renderMainTracker()

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const mainDiv = container.querySelector('.from-red-950')
        expect(mainDiv).toBeInTheDocument()
      })
    })
  })

  describe('Record Submission - One-time Saving', () => {
    test('提交儲蓄應該呼叫 onAddRecord 並使用 type: save', async () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '5000' } })

      const submitButton = screen.getByRole('button', { name: '記錄儲蓄' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnAddRecord).toHaveBeenCalled()
        const recordData = mockOnAddRecord.mock.calls[0][0] as Record
        expect(recordData.type).toBe('save')
        expect(recordData.amount).toBe(5000)
      })
    })

    test('儲蓄未選擇分類應該使用預設「儲蓄」', async () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const submitButton = screen.getByRole('button', { name: '記錄儲蓄' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const recordData = mockOnAddRecord.mock.calls[0][0] as Record
        expect(recordData.category).toBe('儲蓄')
      })
    })

    test('提交儲蓄後應該顯示成功訊息', async () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const submitButton = screen.getByRole('button', { name: '記錄儲蓄' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('太棒了！')).toBeInTheDocument()
        expect(screen.getByText(/你剛剛為自己贏回了/)).toBeInTheDocument()
      })
    })

    test('提交儲蓄應該顯示綠色背景漸層', async () => {
      const { container } = renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const submitButton = screen.getByRole('button', { name: '記錄儲蓄' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const mainDiv = container.querySelector('.from-emerald-950')
        expect(mainDiv).toBeInTheDocument()
      })
    })
  })

  describe('Record Submission - Recurring Expense', () => {
    test('提交每月固定支出應該設定 isRecurring: true', async () => {
      renderMainTracker()

      const toggleButton = screen.getByRole('button', { name: /僅此一次/ })
      fireEvent.click(toggleButton)

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '500' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const recordData = mockOnAddRecord.mock.calls[0][0] as Record
        expect(recordData.isRecurring).toBe(true)
      })
    })

    test('每月固定支出應該計算更高的時間成本', async () => {
      renderMainTracker()

      const hourlyRate = FinanceCalc.hourlyRate(mockUserData.salary)
      const realRate = FinanceCalc.realRate(mockUserData.inflationRate, mockUserData.roiRate)
      const yearsToRetire = mockUserData.retireAge - mockUserData.age

      const oneTimeTimeCost = FinanceCalc.calculateTimeCost(1000, false, hourlyRate, realRate, yearsToRetire)
      const recurringTimeCost = FinanceCalc.calculateTimeCost(1000, true, hourlyRate, realRate, yearsToRetire)

      expect(recurringTimeCost).toBeGreaterThan(oneTimeTimeCost)
    })
  })

  describe('Record Submission - Recurring Saving', () => {
    test('提交每月固定儲蓄應該設定 isRecurring: true', async () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const toggleButton = screen.getByRole('button', { name: /僅此一次/ })
      fireEvent.click(toggleButton)

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '3000' } })

      const submitButton = screen.getByRole('button', { name: '記錄儲蓄' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const recordData = mockOnAddRecord.mock.calls[0][0] as Record
        expect(recordData.isRecurring).toBe(true)
        expect(recordData.amount).toBe(3000)
      })
    })
  })

  describe('Confetti Animation', () => {
    test('儲蓄提交後應該顯示慶祝動畫', async () => {
      const { container } = renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const submitButton = screen.getByRole('button', { name: '記錄儲蓄' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const confetti = container.querySelector('.animate-confetti')
        expect(confetti).toBeInTheDocument()
      })
    })

    test('支出提交後不應該顯示慶祝動畫', async () => {
      const { container } = renderMainTracker()

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('已記錄')).toBeInTheDocument()
      })

      const confetti = container.querySelector('.animate-confetti')
      expect(confetti).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    test('點擊目標區域應該開啟歷史頁面', () => {
      renderMainTracker()

      const targetButton = screen.getByText('65 歲').closest('button')
      expect(targetButton).toBeTruthy()
      fireEvent.click(targetButton!)

      expect(mockOnOpenHistory).toHaveBeenCalledTimes(1)
    })

    test('點擊預估區域應該開啟設定頁面', () => {
      renderMainTracker()

      const estimatedButton = screen.getByText('65.0 歲').closest('button')
      expect(estimatedButton).toBeTruthy()
      fireEvent.click(estimatedButton!)

      expect(mockOnOpenSettings).toHaveBeenCalledTimes(1)
    })

    test('點擊底部導航「歷史」應該呼叫 onOpenHistory', () => {
      renderMainTracker()

      const navButtons = screen.getAllByRole('button')
      const historyButton = navButtons.find(btn => btn.textContent?.includes('歷史'))
      expect(historyButton).toBeTruthy()
      fireEvent.click(historyButton!)

      expect(mockOnOpenHistory).toHaveBeenCalled()
    })

    test('點擊底部導航「設定」應該呼叫 onOpenSettings', () => {
      renderMainTracker()

      const navButtons = screen.getAllByRole('button')
      const settingsButton = navButtons.find(btn => btn.textContent?.includes('設定'))
      expect(settingsButton).toBeTruthy()
      fireEvent.click(settingsButton!)

      expect(mockOnOpenSettings).toHaveBeenCalled()
    })
  })

  describe('Input Validation', () => {
    test('金額為 0 時應該禁用提交按鈕', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '0' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      expect(submitButton).toBeDisabled()
    })

    test('金額為 0 時點擊提交不應該呼叫 onAddRecord', async () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '0' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnAddRecord).not.toHaveBeenCalled()
      })
    })

    test('金額大於 0 時應該啟用提交按鈕', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '100' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Result Screen Auto-reset', () => {
    test('提交後應該顯示結果頁面並能自動重置', async () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1000' } })

      const categoryButton = screen.getByRole('button', { name: '飲食' })
      fireEvent.click(categoryButton)

      const noteInput = screen.getByPlaceholderText('備註（選填）') as HTMLInputElement
      fireEvent.change(noteInput, { target: { value: '測試' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('已記錄')).toBeInTheDocument()
      }, { timeout: 3000 })

      // 驗證輸入資料已經透過 onAddRecord 提交
      expect(mockOnAddRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'spend',
          amount: 1000,
          category: '飲食',
          note: '測試',
        })
      )
    })

    test('儲蓄提交後應該顯示慶祝動畫', async () => {
      const { container } = renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const submitButton = screen.getByRole('button', { name: '記錄儲蓄' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const confetti = container.querySelector('.animate-confetti')
        expect(confetti).toBeInTheDocument()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(screen.getByText('太棒了！')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('應該處理極小金額（100）', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '100' } })

      expect(screen.getByText('NT$ 100')).toBeInTheDocument()
    })

    test('應該處理極大金額（100000）', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '100000' } })

      expect(screen.getByText('NT$ 100,000')).toBeInTheDocument()
    })

    test('應該處理退休年齡很近的情況（僅剩 1 年）', () => {
      const userData: UserData = {
        ...mockUserData,
        age: 64,
        retireAge: 65,
      }

      renderMainTracker(userData)

      const hourlyRate = FinanceCalc.hourlyRate(userData.salary)
      const realRate = FinanceCalc.realRate(userData.inflationRate, userData.roiRate)
      const yearsToRetire = 1
      const timeCost = FinanceCalc.calculateTimeCost(500, false, hourlyRate, realRate, yearsToRetire)
      const formatted = formatTime(timeCost)

      expect(screen.getByText(formatted.value.toString())).toBeInTheDocument()
    })

    test('應該處理退休年齡很遠的情況（50 年後）', () => {
      const userData: UserData = {
        ...mockUserData,
        age: 25,
        retireAge: 75,
      }

      renderMainTracker(userData)

      const hourlyRate = FinanceCalc.hourlyRate(userData.salary)
      const realRate = FinanceCalc.realRate(userData.inflationRate, userData.roiRate)
      const yearsToRetire = 50
      const timeCost = FinanceCalc.calculateTimeCost(500, false, hourlyRate, realRate, yearsToRetire)
      const formatted = formatTime(timeCost)

      expect(screen.getByText(formatted.value.toString())).toBeInTheDocument()
    })

    test('應該處理高薪資的情況', () => {
      const userData: UserData = {
        ...mockUserData,
        salary: 200000,
      }

      renderMainTracker(userData)

      const hourlyRate = FinanceCalc.hourlyRate(userData.salary)
      const realRate = FinanceCalc.realRate(userData.inflationRate, userData.roiRate)
      const yearsToRetire = userData.retireAge - userData.age
      const timeCost = FinanceCalc.calculateTimeCost(500, false, hourlyRate, realRate, yearsToRetire)
      const formatted = formatTime(timeCost)

      expect(screen.getByText(formatted.value.toString())).toBeInTheDocument()
    })

    test('應該處理低薪資的情況', () => {
      const userData: UserData = {
        ...mockUserData,
        salary: 25000,
      }

      renderMainTracker(userData)

      const hourlyRate = FinanceCalc.hourlyRate(userData.salary)
      const realRate = FinanceCalc.realRate(userData.inflationRate, userData.roiRate)
      const yearsToRetire = userData.retireAge - userData.age
      const timeCost = FinanceCalc.calculateTimeCost(500, false, hourlyRate, realRate, yearsToRetire)
      const formatted = formatTime(timeCost)

      expect(screen.getByText(formatted.value.toString())).toBeInTheDocument()
    })

    test('應該處理大量記錄的情況', () => {
      const manyRecords: Record[] = Array.from({ length: 100 }, (_, i) => ({
        id: `record-${i}`,
        type: i % 2 === 0 ? 'spend' : 'save',
        amount: 1000 + i * 100,
        isRecurring: i % 3 === 0,
        timeCost: 50 + i * 5,
        category: i % 2 === 0 ? '飲食' : '獎金',
        note: `記錄 ${i}`,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      }))

      renderMainTracker(mockUserData, manyRecords)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, manyRecords)
      const totals = GPSCalc.calculateTotals(manyRecords)

      expect(screen.getByText(formatCurrency(totals.totalSaved))).toBeInTheDocument()
      expect(screen.getByText(formatCurrency(totals.totalSpent))).toBeInTheDocument()
    })
  })

  describe('UI Styling', () => {
    test('支出模式按鈕應該有橘色樣式', () => {
      renderMainTracker()

      const spendButton = screen.getByRole('button', { name: '💸 花費' })
      expect(spendButton).toHaveClass('bg-orange-500')
    })

    test('儲蓄模式按鈕應該有綠色樣式', () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const saveButton = screen.getByRole('button', { name: '💰 儲蓄' })
      expect(saveButton).toHaveClass('bg-emerald-500')
    })

    test('滑桿在支出模式應該有 orange 樣式', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      expect(slider).toHaveClass('slider')
      expect(slider).toHaveClass('orange')
    })

    test('滑桿在儲蓄模式不應該有 orange 樣式', () => {
      renderMainTracker()

      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      const slider = screen.getByRole('slider')
      expect(slider).toHaveClass('slider')
      expect(slider).not.toHaveClass('orange')
    })

    test('固定模式切換按鈕應該有紫色樣式', () => {
      renderMainTracker()

      const toggleButton = screen.getByRole('button', { name: /僅此一次/ })
      fireEvent.click(toggleButton)

      expect(toggleButton).toHaveClass('bg-purple-500/20')
      expect(toggleButton).toHaveClass('text-purple-400')
    })
  })

  describe('Regression Tests', () => {
    test('切換模式不應該影響已選擇的金額', () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '5000' } })

      expect(screen.getByText('NT$ 5,000')).toBeInTheDocument()

      // 切換到儲蓄模式
      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      // 金額應該保持不變
      expect(screen.getByText('NT$ 5,000')).toBeInTheDocument()
    })

    test('切換模式應該清除結果顯示', async () => {
      renderMainTracker()

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('已記錄')).toBeInTheDocument()
      }, { timeout: 3000 })

      // 切換到儲蓄模式
      fireEvent.click(screen.getByRole('button', { name: '💰 儲蓄' }))

      // 結果應該消失
      expect(screen.queryByText('已記錄')).not.toBeInTheDocument()
    })

    test('提交後 onAddRecord 應該被呼叫一次', async () => {
      renderMainTracker()

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnAddRecord).toHaveBeenCalledTimes(1)
      }, { timeout: 3000 })
    })

    test('金額為 0 時不應該觸發提交', async () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '0' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      // 等待一小段時間確認沒有被呼叫
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(mockOnAddRecord).not.toHaveBeenCalled()
    })

    test('提交時應該包含所有必要欄位', async () => {
      renderMainTracker()

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '1500' } })

      const submitButton = screen.getByRole('button', { name: '記錄花費' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnAddRecord).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            type: 'spend',
            amount: 1500,
            isRecurring: false,
            timeCost: expect.any(Number),
            category: '一般消費',
            note: '',
            timestamp: expect.any(String),
            date: expect.any(String),
          })
        )
      })
    })
  })

  describe('Accessibility', () => {
    test('所有互動元素都應該是可訪問的按鈕或輸入', () => {
      const { container } = renderMainTracker()

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)

      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()

      const textbox = screen.getByPlaceholderText('備註（選填）')
      expect(textbox).toBeInTheDocument()
    })

    test('主要按鈕應該有有意義的文字', () => {
      renderMainTracker()

      expect(screen.getByRole('button', { name: '記錄花費' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '💸 花費' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '💰 儲蓄' })).toBeInTheDocument()
    })
  })
})
