# TimeBar v4.0 ⏱️💰

> 把每一筆消費轉換成「退休時間成本」，幫助你做出更明智的財務決策。

---

## 🎉 v4.0 更新重點

### 🏗️ 四層架構重構
- **Layer 1 (Data)**: 數據層 - 資料模型、儲存邏輯
- **Layer 2 (Domain)**: 領域層 - 核心計算引擎（財務計算、GPS、軌跡偏差）
- **Layer 3 (Business)**: 業務層 - React Hooks、狀態管理
- **Layer 4 (UI)**: 介面層 - 頁面、功能模組、共用元件

### 📊 退休 GPS 導航系統
- **時間成本邏輯**：每筆儲蓄/消費都有「時間成本」，累積影響退休年齡
- **即時 GPS Badge**：Header 顯示「+3.1年」或「-5天」等即時狀態
- **雙向一致性**：主畫面與歷史頁面 GPS 數值完全同步

### 🎯 儲蓄進度追蹤
- **週目標系統**：將月儲蓄目標拆分為週單位，穩定追蹤進度
- **進度可視化**：進度條顯示「實際 vs 目標」累積儲蓄
- **公式透明化**：可查看完整計算公式

### 🔄 計算邏輯統一
- 修復 GPS 計算不一致問題（主畫面 vs 歷史頁面）
- GPS 狀態基於 `timeCost` 累積，而非目標達成率
- 新用戶無記錄時預設顯示「準時」狀態

---

## 🧮 計算邏輯說明（給使用者）

### 時間成本 (Time Cost)
每筆金額都會被轉換為「工作時間」：

```
時間成本 = 金額的未來價值 ÷ 時薪

對於一次性金額：
  未來價值 = 金額 × (1 + 實質報酬率)^距離退休年數

對於每月固定支出：
  未來價值 = 金額 × 年金終值因子
```

**範例**：
- 月薪 50,000 → 時薪 ≈ 284 元
- 儲蓄 5,000 元，30 年後複利 → 未來價值 ≈ 26 萬 → 時間成本 ≈ 917 小時 ≈ **3.06 年**

### 退休 GPS 狀態
```
淨時間影響 = 總消費時數 - 總儲蓄時數

- 淨影響 < -8 小時 → 🟢 領先（ahead）
- 淨影響 > +8 小時 → 🟠 落後（behind）
- 其他 → ⚪ 準時（onTrack）
```

### 儲蓄進度追蹤
```
目標儲蓄 = (月儲蓄目標 ÷ 4) × (經過週數 + 1)
實際儲蓄 = 所有 type='save' 記錄的金額總和
進度 = 實際儲蓄 ÷ 目標儲蓄 × 100%
```

---

## ✨ 核心功能

### 🏠 主畫面（home）
- **時間成本計算**：輸入金額，立即顯示「這會花掉你 X 天的自由時間」
- **GPS Header Badge**：即時顯示退休進度狀態（+3.1年 / 0天 / -5天）
- **累積儲蓄進度**：顯示目標 vs 實際累積儲蓄的進度條
- **快速決策**：大尺寸的「💸 我買了」和「💪 我忍住了」按鈕
- **消費備註**：選擇分類後可選填備註（漸進式展開 UI）

### 📊 歷史頁面
- **退休 GPS 儀表板**：目標年齡 vs 預估年齡的視覺化對比
- **時間帳本**：每筆記錄顯示金額和對應時間成本（如 +5,000 → 3.06年）
- **完整編輯**：查看、編輯、刪除過往記錄

### ⚙️ 設定頁面
- **個人化參數**：年齡、月薪、目標退休年齡、通膨率、投資報酬率、月儲蓄目標
- **退休計算機**：預覽不同情境下的退休基金
- **雲端同步**：Google Sheets 自動備份（可選）

---

## 🏗️ 技術架構（給開發者）

### 四層架構

```
src/layers/
├── 1-data/           # 資料層
│   ├── models/       # 資料模型定義
│   ├── storage/      # 本地儲存實現
│   └── sync/         # 雲端同步邏輯
│
├── 2-domain/         # 領域層（純計算，無副作用）
│   ├── calculators/
│   │   ├── FinanceCalculator.ts   # 財務計算（複利、年金）
│   │   ├── TrajectoryCalculator.ts # 軌跡偏差計算
│   │   ├── GPSCalculator.ts       # GPS 狀態計算
│   │   └── TimeCalculator.ts      # 時間格式化
│   ├── types/        # 領域類型定義
│   └── constants.ts  # 常數（工作時數等）
│
├── 3-business/       # 業務層（React Hooks）
│   └── hooks/
│       ├── useGPS.ts      # GPS 狀態管理（核心 Hook）
│       ├── useFinance.ts  # 財務計算 Hook
│       ├── useRecords.ts  # 記錄 CRUD Hook
│       └── useSync.ts     # 同步狀態 Hook
│
└── 4-ui/             # 介面層
    ├── pages/
    │   └── HomePage/       # 主頁面組件
    ├── features/
    │   ├── retirement-gps/
    │   │   └── GPSHeaderBadge.tsx  # GPS 狀態 Badge
    │   ├── savings-progress/
    │   │   └── SavingsProgressCard.tsx # 儲蓄進度卡片
    │   └── ...
    └── shared/       # 共用 UI 元件
```

### 核心 Hooks

#### `useGPS` - GPS 狀態計算
```typescript
const {
  estimatedAge,      // 預估退休年齡
  ageDiff,           // 與目標的年齡差距
  status,            // 'ahead' | 'onTrack' | 'behind'
  totalSavedHours,   // 總儲蓄時數
  totalSpentHours,   // 總消費時數
  targetAccumulatedSavings,  // 目標累積儲蓄
  actualAccumulatedSavings,  // 實際累積儲蓄
} = useGPS({ userData, records });
```

**GPS 計算邏輯**：
1. 計算 `savedHours` 和 `spentHours`（從每筆記錄的 `timeCost`）
2. `netHoursImpact = spentHours - savedHours`
3. 根據 `netHoursImpact` 計算 `estimatedAge` 和 `status`

### 計算引擎

#### `TrajectoryCalculator` - 儲蓄目標追蹤
- 計算週目標儲蓄量（穩定 UI 顯示）
- 計算偏差金額和時間成本

#### `FinanceCalculator` - 財務計算
- 複利終值、年金終值
- 實質報酬率
- 時間成本轉換

### 技術棧
- **Frontend**: React 18 + TypeScript + Vite 5
- **UI**: Tailwind CSS（`darkMode: 'selector'`）+ 自訂動畫系統
- **測試**: Vitest
- **Backend**: Google Apps Script（可選雲端同步）
- **部署**: GitHub Pages

---

## 🚀 快速開始

### 環境需求
- Node.js 18+
- npm 9+

### 安裝與啟動

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm run dev
# 開啟 http://localhost:5173/timebar/

# 3. 建置生產版本
npm run build

# 4. 預覽建置結果
npm run preview
```

### 測試

```bash
# 運行所有測試
npm test

# 測試覆蓋率報告
npm run test:coverage

# 監聽模式
npm run test:watch
```

---

## 📁 完整專案結構

```
src/
├── layers/               # 四層架構（v4.0 新增）
│   ├── 1-data/           # 資料層
│   ├── 2-domain/         # 領域層（計算引擎）
│   ├── 3-business/       # 業務層（Hooks）
│   └── 4-ui/             # 介面層（頁面、元件）
│
├── components/           # 舊版元件（逐步遷移中）
│   ├── onboarding/       # 初始設定流程
│   ├── history/          # 歷史頁面
│   └── settings/         # 設定頁面
│
├── utils/                # 核心邏輯
│   ├── financeCalc.ts    # 財務計算引擎（GPSCalc）
│   ├── settingsSystem.ts # 設定管理
│   └── categorySystem.ts # 分類管理
│
├── services/             # 外部服務
│   └── googleSheets.ts   # Google Sheets API
│
├── types/                # TypeScript 類型
│   └── index.ts
│
└── tests/                # 測試
    ├── financeCalc.test.ts
    └── TrajectoryCalculator.test.ts
```

---

## 🔧 雲端同步設定（可選）

TimeBar 支援透過 Google Sheets 進行跨裝置同步：

1. 複製 `google-apps-script/Code.gs` 到你的 Google Apps Script 專案
2. 設定 `SPREADSHEET_ID`
3. 部署為 Web App
4. 設定環境變數：`VITE_GAS_URL=你的部署URL`

詳見 [google-apps-script/README.md](google-apps-script/README.md)

---

## 🛣️ Roadmap

### v4.2（當前版本）✅
- [x] 消費備註功能（選填，漸進式展開 UI）
- [x] Dark Mode 策略修正（`darkMode: 'selector'`，避免 OS 深色模式滲漏）
- [x] 歷史頁面備註顯示（分類名 + 備註分行顯示）

### v4.1 ✅
- [x] Goal Trajectory Deviation Model
- [x] 儲蓄進度追蹤（週目標系統）
- [x] RetirementProgress 累積儲蓄進度條

### v4.0 ✅
- [x] 四層架構重構（layers/1-data, 2-domain, 3-business, 4-ui）
- [x] GPS 計算邏輯統一（基於 timeCost）
- [x] GPS Header Badge 即時顯示
- [x] 新用戶友善預設值

### 規劃中
- [ ] Design Tokens 系統
- [ ] Atomic Design 組件化
- [ ] E2E 測試（Playwright）

---

## 📄 License

MIT License

---

> 「每一分錢都是你未來自由的磚塊」🧱
> v4.0 實現了四層架構與統一的 GPS 計算邏輯。
