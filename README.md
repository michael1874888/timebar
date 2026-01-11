# TimeBar v3.2 ⏱️💰

> 把每一筆消費轉換成「退休時間成本」，幫助你做出更明智的財務決策。

---

## 🎉 v3.2 更新重點

### 🎨 UI/UX 大幅簡化
- **5 個核心畫面**：從 9 個畫面精簡為 loading, onboarding, home, history, settings
- **Onboarding 簡化**：從 5 步驟簡化為 3 步驟（年齡、月薪、退休年齡），30 秒完成設定
- **退休進度條**：取代 Life Battery，更直觀的 GPS 視覺化，清晰顯示領先/落後狀態
- **設定頁扁平化**：所有子頁面改為 Modal 或 Collapsible，導航深度減少 50%

### 🔓 漸進式揭露系統
- **新用戶友善**：首次使用只看到核心功能，降低認知負荷
- **自動解鎖**：根據使用天數和記錄數量，進階功能自動解鎖
  - Day 1: 核心記帳功能
  - Day 2-3: 快速記帳按鈕（記錄 ≥ 3 筆後解鎖）
  - Day 7+: 遊戲化功能、進階設定
- **慶祝通知**：解鎖新功能時顯示彩帶動畫和說明

### 🧪 精簡測試策略
- **93 個測試**：專注於核心業務邏輯和關鍵用戶流程
- **100% 通過率**：移除內部實作細節測試，保持測試穩定性
- 測試文件：
  - `financeCalc.test.ts` (56 tests) - 核心計算邏輯
  - `App.test.tsx` (32 tests) - E2E 用戶流程
  - `OnboardingScreen.test.tsx` (5 tests) - Onboarding 按鈕文字驗證

---

## ✨ 核心功能

### 🏠 主畫面（home）
- **時間成本計算**：輸入金額，立即顯示「這會花掉你 X 天的自由時間」
- **生動比喻**：轉換為「一週薪水」、「延後退休 X 天」等有感單位
- **快速決策**：大尺寸的「💸 我買了」和「💪 我忍住了」按鈕
- **慶祝克制**：選擇「忍住不買」會觸發彩帶動畫，正向反饋機制

### 📊 歷史頁面
- **時間帳本**：用「天數」而非金額顯示累計影響
- **視覺化統計**：總省下 vs 總花費的直觀對比，圓餅圖顯示消費分布
- **完整編輯**：查看、編輯、刪除過往記錄

### ⚙️ 設定頁面
- **個人化參數**：年齡、月薪、目標退休年齡、通膨率、投資報酬率
- **退休計算機**：預覽不同情境下的退休基金與可領金額
- **進階設定**（Collapsible）：
  - 快速記帳按鈕管理
  - 消費分類管理
  - 訂閱管理
- **遊戲化設定**（可關閉）：
  - 每日挑戰設定
  - 時間沙商店
- **雲端同步**：Google Sheets 自動備份（可選）

---

## 🏗️ 技術架構

### 技術棧
- **Frontend**: React 18 + TypeScript + Vite 5
- **UI**: Tailwind CSS + 自訂動畫系統
- **測試**: Vitest (93 tests, 100% pass rate)
- **Backend**: Google Apps Script（可選雲端同步）
- **部署**: GitHub Pages

### 核心模組
- **financeCalc.ts** - 時間成本計算引擎（複利、年金、實質報酬率）
- **SettingsSystem** - 統一設定管理（DI 架構，debounced cloud sync）
- **CategorySystem** - 分類管理（8 個預設分類 + 自訂分類）
- **progressiveDisclosure.ts** - 漸進式揭露邏輯

### 數據流
```
用戶操作
    ↓
本地存儲（立即）
    ↓
Debouncer（1秒延遲）
    ↓
雲端同步（Google Sheets）
```

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
npm test:coverage

# 監聽模式
npm test:watch

# 運行特定測試
npm test -- financeCalc    # 56 tests
npm test -- App            # 32 tests
```

---

## 📁 專案結構

```
src/
├── components/           # UI 組件
│   ├── onboarding/       # 初始設定流程（3 步驟）
│   ├── dashboard/        # 主畫面（home screen）
│   │   ├── RetirementProgress.tsx  # 退休進度條
│   │   ├── CategorySelectModal.tsx # 分類選擇
│   │   └── ...
│   ├── history/          # 歷史頁面
│   ├── settings/         # 設定頁面
│   └── common/           # 共用組件
│       ├── Modal.tsx
│       ├── Collapsible.tsx
│       └── UnlockNotification.tsx
├── utils/                # 核心邏輯
│   ├── financeCalc.ts    # 財務計算引擎
│   ├── settingsSystem.ts # 設定管理（DI 架構）
│   ├── categorySystem.ts # 分類管理
│   ├── progressiveDisclosure.ts  # 漸進式揭露
│   ├── interfaces.ts     # 接口定義
│   └── adapters.ts       # 適配器實現
├── services/             # 外部服務
│   └── googleSheets.ts   # Google Sheets API
├── types/                # TypeScript 類型
│   └── index.ts
├── styles/               # 樣式
│   ├── index.css
│   └── animations.css
├── tests/                # 測試
│   ├── financeCalc.test.ts
│   └── App.test.tsx
└── App.tsx               # 應用入口
```

---

## 📚 文件資源

- **[CLAUDE.md](CLAUDE.md)** - 給 Claude Code 的專案指南
- **[CHANGELOG.md](CHANGELOG.md)** - 版本更新記錄
- **[UI-UX-ANALYSIS-AND-REDESIGN.md](UI-UX-ANALYSIS-AND-REDESIGN.md)** - UI/UX 改版分析與計劃
- **[REFACTORING-PLAN.md](REFACTORING-PLAN.md)** - 未來架構演進計劃（v4.0）

---

## 🔧 雲端同步設定（可選）

TimeBar 支援透過 Google Sheets 進行跨裝置同步：

1. 複製 `google-apps-script/Code.gs` 到你的 Google Apps Script 專案
2. 設定 `SPREADSHEET_ID`
3. 部署為 Web App
4. 設定環境變數：`VITE_GAS_URL=你的部署URL`

詳見 [google-apps-script/README.md](google-apps-script/README.md)

---

## 📊 測試覆蓋

| 模組 | 測試數 | 說明 |
|------|--------|------|
| `financeCalc` | 56 | 核心計算邏輯、邊界條件、精度測試 |
| `App E2E` | 32 | 完整用戶流程：onboarding → home → history → settings |
| `OnboardingScreen` | 5 | 按鈕文字顯示、onboarding 流程驗證 |
| **總計** | **93** | **100% 通過率** |

**精簡測試策略**：只測試核心業務邏輯和關鍵用戶流程，不測試 UI 實作細節。

---

## 🛣️ Roadmap

### v3.2（當前版本）✅
- [x] UI/UX 簡化（9 → 5 畫面）
- [x] Onboarding 簡化（5 → 3 步驟）
- [x] 漸進式揭露系統
- [x] 精簡測試策略

### v4.0（規劃中）
- [ ] 四層架構重構（layers/1-data, 2-domain, 3-business, 4-ui）
- [ ] Design Tokens 系統
- [ ] Atomic Design 組件化
- [ ] Storybook 組件文檔
- [ ] E2E 測試（Playwright）

詳見 [REFACTORING-PLAN.md](REFACTORING-PLAN.md)

---

## 📄 License

MIT License

---

> 「每一分錢都是你未來自由的磚塊」🧱
> v3.2 致力於讓決策更快、更簡單、更有感。
