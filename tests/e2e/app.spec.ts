import { test, expect } from '@playwright/test';

test.describe('TimeBar E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage 確保每次測試從頭開始
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('完整onboarding流程', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 等待載入完成
    await expect(page.getByText('載入中...')).toBeVisible({ timeout: 2000 });

    // 應該進入 onboarding
    await expect(page.getByText(/開始計算你的/)).toBeVisible({ timeout: 5000 });

    // 填寫年齡
    await page.getByPlaceholder(/你今年/i).fill('30');
    await page.getByRole('button', { name: /下一步|繼續/i }).click();

    // 填寫月薪
    await page.getByPlaceholder(/月薪/i).fill('50000');
    await page.getByRole('button', { name: /下一步|繼續/i }).click();

    // 填寫退休年齡
    await page.getByPlaceholder(/退休年齡/i).fill('65');
    await page.getByRole('button', { name: /下一步|繼續/i }).click();

    // 填寫目前存款
    await page.getByPlaceholder(/目前存款/i).fill('0');
    await page.getByRole('button', { name: /下一步|繼續/i }).click();

    // 填寫每月儲蓄
    await page.getByPlaceholder(/每月儲蓄/i).fill('10000');
    await page.getByRole('button', { name: /完成|開始使用/i }).click();

    // 應該進入主畫面
    await expect(page.getByText(/這個東西值多少/)).toBeVisible({ timeout: 5000 });
  });

  test('生命成本計算器流程', async ({ page }) => {
    // 先完成 onboarding（簡化版）
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.setItem('userData', JSON.stringify({
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: 2.5,
        roiRate: 6,
      }));
    });
    await page.reload();

    // 等待主畫面載入
    await expect(page.getByText(/這個東西值多少/)).toBeVisible({ timeout: 5000 });

    // 輸入金額
    await page.getByPlaceholder(/NT\$/i).fill('1000');

    // 應該顯示生命成本
    await expect(page.getByText(/工作時間|生命成本/i)).toBeVisible();

    // 點擊「我不買了」
    await page.getByRole('button', { name: /我不買了/i }).click();

    // 應該觸發慶祝動畫
    await expect(page.getByText(/很棒|太棒|積少成多/i)).toBeVisible({ timeout: 3000 });
  });

  test('Dashboard 導航', async ({ page }) => {
    // 先設置用戶數據
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.setItem('userData', JSON.stringify({
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: 2.5,
        roiRate: 6,
      }));
    });
    await page.reload();

    // 等待主畫面
    await expect(page.getByText(/這個東西值多少/)).toBeVisible({ timeout: 5000 });

    // 點擊 Dashboard 圖標
    const dashboardButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await dashboardButton.click();

    // 應該看到自由儀表板
    await expect(page.getByText(/自由儀表板/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/你已經買回/i)).toBeVisible();
    await expect(page.getByText(/你的生命電量/i)).toBeVisible();
  });

  test('詳細統計收合功能', async ({ page }) => {
    // 先設置用戶數據和一些記錄
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.setItem('userData', JSON.stringify({
        age: 30,
        salary: 50000,
        retireAge: 65,
        currentSavings: 0,
        monthlySavings: 10000,
        inflationRate: 2.5,
        roiRate: 6,
      }));
      localStorage.setItem('records', JSON.stringify([
        {
          id: '1',
          type: 'spend',
          amount: 1000,
          category: '飲食',
          isRecurring: false,
          timeCost: 0,
          note: '',
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0]
        }
      ]));
    });
    await page.reload();

    // 進入 Dashboard
    const dashboardButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await dashboardButton.click();

    await expect(page.getByText(/自由儀表板/i)).toBeVisible();

    // 點擊詳細統計按鈕
    await page.getByText(/📊 詳細統計/i).click();

    // 應該顯示 SpendingBreakdown
    await expect(page.getByText(/💸 支出分析/i)).toBeVisible({ timeout: 2000 });

    // 再次點擊應該收合
    await page.getByText(/📊 詳細統計/i).click();
    await expect(page.getByText(/💸 支出分析/i)).not.toBeVisible({ timeout: 2000 });
  });

  test('Error Boundary 測試', async ({ page }) => {
    // 這個測試需要模擬錯誤情況
    // 可以通過注入錯誤代碼來測試
    await page.goto('http://localhost:5173');

    // 如果 App 正常載入，Error Boundary 應該不會顯示
    await expect(page.getByText(/哎呀，出錯了/i)).not.toBeVisible({ timeout: 5000 });
  });
});
