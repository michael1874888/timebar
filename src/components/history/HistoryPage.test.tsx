/**
 * HistoryPage Integration Tests
 *
 * 測試範圍:
 * - 初始渲染與GPS概覽顯示
 * - 無記錄時的空白狀態
 * - 記錄依月份分組顯示
 * - GPS狀態顯示（領先/落後/符合計畫）
 * - 時間成本格式化與顏色
 * - 記錄類型指示器（儲蓄 vs 支出）
 * - 記錄細節（金額、分類、備註、時間成本）
 * - 月份分組與排序
 * - 返回導航功能
 * - 不同GPS狀態基於記錄的計算
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryPage } from './HistoryPage'
import { UserData, Record } from '@/types'
import { GPSCalc, Formatters, CONSTANTS } from '@/utils/financeCalc'

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS
const { formatTime, formatCurrency, formatAgeDiff } = Formatters

describe('HistoryPage', () => {
  let mockUserData: UserData
  let mockOnClose: ReturnType<typeof vi.fn>

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

    // Mock 回調函數
    mockOnClose = vi.fn()

    // 重置所有 mock
    vi.clearAllMocks()
  })

  // Helper function to render component with default props
  const renderHistoryPage = (
    userData = mockUserData,
    records: Record[] = [],
    onClose = mockOnClose
  ) => {
    return render(
      <HistoryPage
        userData={userData}
        records={records}
        onClose={onClose}
      />
    )
  }

  describe('Initial Render', () => {
    test('應該顯示標題「歷史紀錄」', () => {
      renderHistoryPage()

      expect(screen.getByText('歷史紀錄')).toBeInTheDocument()
    })

    test('應該顯示返回按鈕', () => {
      renderHistoryPage()

      const backButton = screen.getByRole('button', { name: '' })
      expect(backButton).toBeInTheDocument()

      // 驗證SVG圖示存在
      const svg = backButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('應該顯示GPS摘要區塊', () => {
      renderHistoryPage()

      expect(screen.getByText('累積儲蓄')).toBeInTheDocument()
      expect(screen.getByText('累積花費')).toBeInTheDocument()
      expect(screen.getByText('退休 GPS')).toBeInTheDocument()
    })

    test('應該顯示目標退休年齡', () => {
      renderHistoryPage()

      expect(screen.getByText('🎯 目標')).toBeInTheDocument()
      expect(screen.getByText('65 歲')).toBeInTheDocument()
    })

    test('應該顯示預估退休年齡', () => {
      renderHistoryPage()

      expect(screen.getByText('📍 預估')).toBeInTheDocument()
      expect(screen.getByText('65.0 歲')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    test('無記錄時應該顯示空白狀態', () => {
      renderHistoryPage()

      expect(screen.getByText('還沒有任何紀錄')).toBeInTheDocument()
      expect(screen.getByText('開始記錄你的第一筆吧！')).toBeInTheDocument()
    })

    test('無記錄時應該顯示空白圖示', () => {
      renderHistoryPage()

      expect(screen.getByText('📝')).toBeInTheDocument()
    })

    test('無記錄時累積儲蓄應該為 0', () => {
      renderHistoryPage()

      const savedElements = screen.getAllByText('0')
      expect(savedElements.length).toBeGreaterThanOrEqual(1)
    })

    test('無記錄時累積花費應該為 0', () => {
      renderHistoryPage()

      const spentElements = screen.getAllByText('0')
      expect(spentElements.length).toBeGreaterThanOrEqual(1)
    })

    test('無記錄時應該顯示「符合計畫」狀態', () => {
      renderHistoryPage()

      expect(screen.getByText('✅ 完美！目前剛好符合計畫')).toBeInTheDocument()
    })
  })

  describe('GPS Overview', () => {
    test('應該計算並顯示累積儲蓄總額', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'save',
          amount: 3000,
          isRecurring: false,
          timeCost: 150,
          category: '副業收入',
          note: '',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const totals = GPSCalc.calculateTotals(records)
      const formattedSaved = formatCurrency(totals.totalSaved)

      expect(screen.getByText(formattedSaved)).toBeInTheDocument()
    })

    test('應該計算並顯示累積花費總額', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 2000,
          isRecurring: false,
          timeCost: 100,
          category: '飲食',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'spend',
          amount: 1500,
          isRecurring: false,
          timeCost: 75,
          category: '交通',
          note: '',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const totals = GPSCalc.calculateTotals(records)
      const formattedSpent = formatCurrency(totals.totalSpent)

      expect(screen.getByText(formattedSpent)).toBeInTheDocument()
    })

    test('應該正確計算混合記錄的儲蓄和花費', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '獎金',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'spend',
          amount: 3000,
          isRecurring: false,
          timeCost: 150,
          category: '飲食',
          note: '',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const totals = GPSCalc.calculateTotals(records)

      expect(screen.getByText(formatCurrency(totals.totalSaved))).toBeInTheDocument()
      expect(screen.getByText(formatCurrency(totals.totalSpent))).toBeInTheDocument()
    })
  })

  describe('GPS Status Display', () => {
    test('無記錄時應該顯示「符合計畫」並使用灰色樣式', () => {
      const { container } = renderHistoryPage()

      expect(screen.getByText('✅ 完美！目前剛好符合計畫')).toBeInTheDocument()

      const statusBar = container.querySelector('.bg-gray-700')
      expect(statusBar).toBeInTheDocument()
    })

    test('有儲蓄記錄應該顯示「領先」狀態', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '獎金',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, records)

      if (gpsResult.isAhead) {
        const diffDisplay = formatAgeDiff(gpsResult.ageDiff)
        expect(screen.getByText(new RegExp(`比目標提早 ${diffDisplay.value} ${diffDisplay.unit}`))).toBeInTheDocument()
      }
    })

    test('有支出記錄應該顯示「落後」狀態', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '購物',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, records)

      if (gpsResult.isBehind) {
        const diffDisplay = formatAgeDiff(gpsResult.ageDiff)
        expect(screen.getByText(new RegExp(`需要再努力 ${diffDisplay.value} ${diffDisplay.unit}`))).toBeInTheDocument()
      }
    })

    test('領先狀態應該顯示綠色進度條', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '獎金',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      const { container } = renderHistoryPage(mockUserData, records)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, records)

      if (gpsResult.isAhead) {
        const progressBar = container.querySelector('.bg-emerald-500')
        expect(progressBar).toBeInTheDocument()
      }
    })

    test('落後狀態應該顯示橘色進度條', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '購物',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      const { container } = renderHistoryPage(mockUserData, records)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, records)

      if (gpsResult.isBehind) {
        const progressBar = container.querySelector('.bg-orange-500')
        expect(progressBar).toBeInTheDocument()
      }
    })

    test('應該顯示正確的預估退休年齡', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 5000,
          isRecurring: false,
          timeCost: 250,
          category: '購物',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, records)
      const estimatedAge = gpsResult.estimatedAge.toFixed(1)

      expect(screen.getByText(`${estimatedAge} 歲`)).toBeInTheDocument()
    })
  })

  describe('Records Display', () => {
    test('應該顯示所有記錄', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '年終獎金',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('午餐')).toBeInTheDocument()
      expect(screen.getByText('年終獎金')).toBeInTheDocument()
    })

    test('記錄應該按時間倒序排列（最新的在前）', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '第一筆',
          timestamp: new Date('2025-01-01').toISOString(),
          date: '2025-01-01',
        },
        {
          id: '2',
          type: 'spend',
          amount: 2000,
          isRecurring: false,
          timeCost: 100,
          category: '購物',
          note: '第二筆',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '3',
          type: 'save',
          amount: 3000,
          isRecurring: false,
          timeCost: 150,
          category: '獎金',
          note: '第三筆',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
      ]

      const { container } = renderHistoryPage(mockUserData, records)

      const noteElements = container.querySelectorAll('.text-white.font-medium')
      const notes = Array.from(noteElements).map(el => el.textContent)

      // 最新的應該在最前面
      expect(notes[0]).toBe('第三筆')
      expect(notes[1]).toBe('第二筆')
      expect(notes[2]).toBe('第一筆')
    })

    test('支出記錄應該顯示橘色金額', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      // Check that the record shows with correct note
      expect(screen.getByText('午餐')).toBeInTheDocument()
      // Amount appears in both month summary and record detail
      const amounts = screen.getAllByText('-1,000')
      expect(amounts.length).toBeGreaterThan(0)
    })

    test('儲蓄記錄應該顯示綠色金額', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '獎金',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      // Check that the record shows with correct note
      expect(screen.getByText('獎金')).toBeInTheDocument()
      // Amount appears in both month summary and record detail
      const amounts = screen.getAllByText('+5,000')
      expect(amounts.length).toBeGreaterThan(0)
    })

    test('支出記錄應該顯示💸圖示', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('💸')).toBeInTheDocument()
    })

    test('儲蓄記錄應該顯示💰圖示', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '獎金',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('💰')).toBeInTheDocument()
    })

    test('應該顯示記錄的時間成本', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const formatted = formatTime(50)
      expect(screen.getByText(`-${formatted.value}${formatted.unit}`)).toBeInTheDocument()
    })

    test('固定支出記錄應該顯示🔄圖示', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 500,
          isRecurring: true,
          timeCost: 1000,
          category: '訂閱',
          note: 'Netflix',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText(/🔄/)).toBeInTheDocument()
    })

    test('無備註時應該顯示分類名稱', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('飲食')).toBeInTheDocument()
    })

    test('無備註且無分類時支出應該顯示「消費」', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('消費')).toBeInTheDocument()
    })

    test('無備註且無分類時儲蓄應該顯示「儲蓄」', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '',
          note: '',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('儲蓄')).toBeInTheDocument()
    })

    test('應該顯示記錄的日期（月/日）', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('1/15')).toBeInTheDocument()
    })
  })

  describe('Month Grouping', () => {
    test('應該按月份分組記錄', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '一月記錄',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '二月記錄',
          timestamp: new Date('2025-02-20').toISOString(),
          date: '2025-02-20',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('2025年1月')).toBeInTheDocument()
      expect(screen.getByText('2025年2月')).toBeInTheDocument()
    })

    test('應該顯示每月的儲蓄和花費總額', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '儲蓄1',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'save',
          amount: 3000,
          isRecurring: false,
          timeCost: 150,
          category: '獎金',
          note: '儲蓄2',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
        {
          id: '3',
          type: 'spend',
          amount: 2000,
          isRecurring: false,
          timeCost: 100,
          category: '飲食',
          note: '花費1',
          timestamp: new Date('2025-01-25').toISOString(),
          date: '2025-01-25',
        },
      ]

      const { container } = renderHistoryPage(mockUserData, records)

      // Check month summary has correct totals
      const monthSummary = container.querySelector('.flex.justify-between.items-center.mb-3')
      expect(monthSummary).toBeInTheDocument()
      expect(monthSummary?.textContent).toContain('+8,000')
      expect(monthSummary?.textContent).toContain('-2,000')
    })

    test('同月份的記錄應該顯示在同一組內', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '記錄1',
          timestamp: new Date('2025-01-01').toISOString(),
          date: '2025-01-01',
        },
        {
          id: '2',
          type: 'spend',
          amount: 2000,
          isRecurring: false,
          timeCost: 100,
          category: '購物',
          note: '記錄2',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '3',
          type: 'save',
          amount: 3000,
          isRecurring: false,
          timeCost: 150,
          category: '獎金',
          note: '記錄3',
          timestamp: new Date('2025-01-31').toISOString(),
          date: '2025-01-31',
        },
      ]

      renderHistoryPage(mockUserData, records)

      // 應該只有一個月份標題
      const monthHeaders = screen.getAllByText('2025年1月')
      expect(monthHeaders).toHaveLength(1)

      // 所有記錄都應該存在
      expect(screen.getByText('記錄1')).toBeInTheDocument()
      expect(screen.getByText('記錄2')).toBeInTheDocument()
      expect(screen.getByText('記錄3')).toBeInTheDocument()
    })

    test('跨年的記錄應該正確分組', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '2024年記錄',
          timestamp: new Date('2024-12-15').toISOString(),
          date: '2024-12-15',
        },
        {
          id: '2',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '2025年記錄',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('2024年12月')).toBeInTheDocument()
      expect(screen.getByText('2025年1月')).toBeInTheDocument()
    })

    test('月份只有儲蓄時花費應該顯示 0', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '獎金儲蓄',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      const { container } = renderHistoryPage(mockUserData, records)

      // Check month summary
      const monthSummary = container.querySelector('.flex.justify-between.items-center.mb-3')
      expect(monthSummary).toBeInTheDocument()
      expect(monthSummary?.textContent).toContain('+5,000')
      expect(monthSummary?.textContent).toContain('-0')
    })

    test('月份只有支出時儲蓄應該顯示 0', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 3000,
          isRecurring: false,
          timeCost: 150,
          category: '飲食',
          note: '聚餐支出',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      const { container } = renderHistoryPage(mockUserData, records)

      // Check month summary
      const monthSummary = container.querySelector('.flex.justify-between.items-center.mb-3')
      expect(monthSummary).toBeInTheDocument()
      expect(monthSummary?.textContent).toContain('+0')
      expect(monthSummary?.textContent).toContain('-3,000')
    })
  })

  describe('Back Navigation', () => {
    test('點擊返回按鈕應該呼叫 onClose', () => {
      renderHistoryPage()

      const backButton = screen.getByRole('button', { name: '' })
      fireEvent.click(backButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Different Scenarios', () => {
    test('只有儲蓄記錄時應該顯示領先狀態', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 10000,
          isRecurring: false,
          timeCost: 500,
          category: '獎金',
          note: '年終獎金',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 250,
          category: '副業收入',
          note: '接案收入',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, records)

      expect(gpsResult.isAhead).toBe(true)
      expect(screen.getByText(formatCurrency(15000))).toBeInTheDocument()
      // When there's no spending, formatCurrency(0) returns "0"
      const zeroElements = screen.getAllByText('0')
      expect(zeroElements.length).toBeGreaterThan(0)
    })

    test('只有支出記錄時應該顯示落後狀態', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 8000,
          isRecurring: false,
          timeCost: 400,
          category: '購物',
          note: '買電腦',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'spend',
          amount: 2000,
          isRecurring: false,
          timeCost: 100,
          category: '飲食',
          note: '聚餐',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, records)

      expect(gpsResult.isBehind).toBe(true)
      // When there's no saving, formatCurrency(0) returns "0"
      const zeroElements = screen.getAllByText('0')
      expect(zeroElements.length).toBeGreaterThan(0)
      expect(screen.getByText(formatCurrency(10000))).toBeInTheDocument()
    })

    test('儲蓄和支出平衡時應該接近符合計畫', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 250,
          category: '獎金',
          note: '獎金',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'spend',
          amount: 5000,
          isRecurring: false,
          timeCost: 250,
          category: '購物',
          note: '購物',
          timestamp: new Date('2025-01-20').toISOString(),
          date: '2025-01-20',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const gpsResult = GPSCalc.calculateEstimatedAge(mockUserData.retireAge, records)

      // 應該非常接近目標年齡
      expect(Math.abs(gpsResult.ageDiff)).toBeLessThan(0.1)
    })

    test('大量記錄應該能正確顯示', () => {
      const records: Record[] = Array.from({ length: 50 }, (_, i) => ({
        id: `record-${i}`,
        type: i % 2 === 0 ? 'spend' : 'save',
        amount: 1000 + i * 100,
        isRecurring: i % 5 === 0,
        timeCost: 50 + i * 5,
        category: i % 2 === 0 ? '飲食' : '獎金',
        note: `記錄 ${i}`,
        timestamp: new Date(2025, 0, (i % 28) + 1).toISOString(),
        date: new Date(2025, 0, (i % 28) + 1).toISOString().split('T')[0],
      })) as Record[]

      renderHistoryPage(mockUserData, records)

      const totals = GPSCalc.calculateTotals(records)

      expect(screen.getByText(formatCurrency(totals.totalSaved))).toBeInTheDocument()
      expect(screen.getByText(formatCurrency(totals.totalSpent))).toBeInTheDocument()
    })

    test('跨多個月份的記錄應該正確分組', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '一月',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '二月',
          timestamp: new Date('2025-02-15').toISOString(),
          date: '2025-02-15',
        },
        {
          id: '3',
          type: 'spend',
          amount: 2000,
          isRecurring: false,
          timeCost: 100,
          category: '購物',
          note: '三月',
          timestamp: new Date('2025-03-15').toISOString(),
          date: '2025-03-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('2025年1月')).toBeInTheDocument()
      expect(screen.getByText('2025年2月')).toBeInTheDocument()
      expect(screen.getByText('2025年3月')).toBeInTheDocument()
    })
  })

  describe('Time Cost Formatting', () => {
    test('應該正確格式化小時成本', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 2.5, // 2.5 小時
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const formatted = formatTime(2.5)
      expect(screen.getByText(`-${formatted.value}${formatted.unit}`)).toBeInTheDocument()
    })

    test('應該正確格式化天數成本', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 50000,
          isRecurring: false,
          timeCost: 240, // 10 天
          category: '購物',
          note: '大採購',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const formatted = formatTime(240)
      expect(screen.getByText(`-${formatted.value}${formatted.unit}`)).toBeInTheDocument()
    })

    test('應該正確格式化月數成本', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 100000,
          isRecurring: false,
          timeCost: 1440, // 60 天 = 2 個月
          category: '購物',
          note: '買車',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const formatted = formatTime(1440)
      expect(screen.getByText(`-${formatted.value}${formatted.unit}`)).toBeInTheDocument()
    })

    test('儲蓄的時間成本應該顯示正號', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '獎金',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const formatted = formatTime(200)
      expect(screen.getByText(`+${formatted.value}${formatted.unit}`)).toBeInTheDocument()
    })

    test('支出的時間成本應該顯示負號', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      const formatted = formatTime(50)
      expect(screen.getByText(`-${formatted.value}${formatted.unit}`)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('應該處理極小金額', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1,
          isRecurring: false,
          timeCost: 0.01,
          category: '飲食',
          note: '極小金額',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('極小金額')).toBeInTheDocument()
      // Amount appears in both month summary and record detail
      const amounts = screen.getAllByText('-1')
      expect(amounts.length).toBeGreaterThan(0)
    })

    test('應該處理極大金額', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 1000000,
          isRecurring: false,
          timeCost: 50000,
          category: '投資收益',
          note: '極大金額',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('極大金額')).toBeInTheDocument()
      // formatCurrency displays 1000000 as "100萬"
      // There may be multiple instances (record amount + month summary)
      const amounts = screen.getAllByText('+100萬')
      expect(amounts.length).toBeGreaterThan(0)
    })

    test('應該處理固定支出的高時間成本', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 500,
          isRecurring: true,
          timeCost: 10000,
          category: '訂閱',
          note: 'Netflix訂閱',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('Netflix訂閱')).toBeInTheDocument()
      expect(screen.getByText(/🔄/)).toBeInTheDocument()

      const formatted = formatTime(10000)
      expect(screen.getByText(`-${formatted.value}${formatted.unit}`)).toBeInTheDocument()
    })

    test('應該處理同一天的多筆記錄', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 100,
          isRecurring: false,
          timeCost: 5,
          category: '飲食',
          note: '早餐',
          timestamp: new Date('2025-01-15T08:00:00').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '2',
          type: 'spend',
          amount: 150,
          isRecurring: false,
          timeCost: 7,
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15T12:00:00').toISOString(),
          date: '2025-01-15',
        },
        {
          id: '3',
          type: 'spend',
          amount: 200,
          isRecurring: false,
          timeCost: 10,
          category: '飲食',
          note: '晚餐',
          timestamp: new Date('2025-01-15T18:00:00').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText('早餐')).toBeInTheDocument()
      expect(screen.getByText('午餐')).toBeInTheDocument()
      expect(screen.getByText('晚餐')).toBeInTheDocument()
    })

    test('應該處理長備註', () => {
      const longNote = '這是一個非常長的備註內容，用來測試UI是否能正確處理長文字的情況，包括換行和截斷等功能'

      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: longNote,
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText(longNote)).toBeInTheDocument()
    })

    test('應該處理特殊字元在備註中', () => {
      const specialNote = '特殊字元測試: @#$%^&*()_+-={}[]|:;<>?,./'

      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: specialNote,
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      renderHistoryPage(mockUserData, records)

      expect(screen.getByText(specialNote)).toBeInTheDocument()
    })
  })

  describe('UI Styling', () => {
    test('支出記錄應該有橘色背景圖示', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          isRecurring: false,
          timeCost: 50,
          category: '飲食',
          note: '午餐',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      const { container } = renderHistoryPage(mockUserData, records)

      const iconBg = container.querySelector('.bg-orange-500\\/20')
      expect(iconBg).toBeInTheDocument()
    })

    test('儲蓄記錄應該有綠色背景圖示', () => {
      const records: Record[] = [
        {
          id: '1',
          type: 'save',
          amount: 5000,
          isRecurring: false,
          timeCost: 200,
          category: '獎金',
          note: '獎金',
          timestamp: new Date('2025-01-15').toISOString(),
          date: '2025-01-15',
        },
      ]

      const { container } = renderHistoryPage(mockUserData, records)

      const iconBg = container.querySelector('.bg-emerald-500\\/20')
      expect(iconBg).toBeInTheDocument()
    })

    test('頁面應該有正確的背景漸層', () => {
      const { container } = renderHistoryPage()

      const mainDiv = container.querySelector('.bg-gradient-to-b.from-gray-900')
      expect(mainDiv).toBeInTheDocument()
    })

    test('GPS摘要區塊應該有圓角和邊框', () => {
      const { container } = renderHistoryPage()

      const summaryCard = container.querySelector('.rounded-3xl.border.border-gray-700\\/50')
      expect(summaryCard).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('返回按鈕應該可被訪問', () => {
      renderHistoryPage()

      const backButton = screen.getByRole('button', { name: '' })
      expect(backButton).toBeInTheDocument()
    })

    test('頁面標題應該正確顯示', () => {
      renderHistoryPage()

      const heading = screen.getByText('歷史紀錄')
      expect(heading).toBeInTheDocument()
    })
  })
})
