# TimeBar 階段二重構指南

> 將單一 HTML 檔案重構為現代化 Vite + React + TypeScript 專案

---

## 📋 目錄

1. [重構概覽](#1-重構概覽)
2. [前置條件](#2-前置條件)
3. [檔案架構對比](#3-檔案架構對比)
4. [階段 2.1：Vite + React 基礎架構](#4-階段-21vite--react-基礎架構)
5. [階段 2.2：TypeScript 遷移](#5-階段-22typescript-遷移)
6. [階段 2.3：測試完善](#6-階段-23測試完善)
7. [階段 2.4：GitHub Actions CI/CD](#7-階段-24github-actions-cicd)
8. [部署流程](#8-部署流程)
9. [遷移檢查清單](#9-遷移檢查清單)

---

## 1. 重構概覽

### 1.1 目標

| 目標 | 說明 |
|------|------|
| 模組化 | 將 1,259 行單檔拆分為多個元件 |
| 效能提升 | 移除瀏覽器端 Babel 編譯 |
| 開發體驗 | 熱重載 (HMR)、TypeScript 自動補全 |
| 可測試性 | 現代測試框架 (Vitest) |
| 自動部署 | Push 後自動測試 + 部署 |

### 1.2 不變的部分

| 項目 | 說明 |
|------|------|
| Google Apps Script | `Code.gs` 完全不變 |
| 資料儲存 | localStorage + Google Sheets |
| 部署平台 | 仍使用 GitHub Pages |
| 功能 | 所有現有功能維持不變 |

### 1.3 子階段依賴關係

```
┌─────────────────────────────────────────────────────────────┐
│                        階段二                                │
├──────────────┬──────────────┬──────────────┬───────────────┤
│     2.1      │     2.2      │     2.3      │      2.4      │
│  Vite+React  │  TypeScript  │   測試完善    │    CI/CD      │
│   基礎架構   │     遷移     │              │   自動部署     │
├──────────────┼──────────────┼──────────────┼───────────────┤
│   必須先做   │  依賴 2.1    │   依賴 2.1   │   依賴 2.1    │
│   3-4 小時   │  1-2 小時    │   2-3 小時   │   0.5-1 小時  │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

---

## 2. 前置條件

### 2.1 環境需求

```bash
# Node.js 18+ (建議 20 LTS)
node --version  # v20.x.x

# npm 9+
npm --version   # 9.x.x

# Git
git --version
```

### 2.2 建議的 VS Code 擴充套件

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

---

## 3. 檔案架構對比

### 3.1 現有架構（階段一完成後）

```
timebar/
├── 📁 .git/
├── 📁 google-apps-script/
│   └── Code.gs                 # GAS 後端
├── index.html                  # 65KB 單一檔案（包含所有 React 元件）
├── financeCalc.js              # 核心計算模組
├── financeCalc.test.js         # 單元測試
├── package.json
└── README.md
```

### 3.2 重構後架構

```
timebar/
├── 📁 .git/
├── 📁 .github/
│   └── 📁 workflows/
│       └── deploy.yml          # 🆕 GitHub Actions 自動部署
│
├── 📁 google-apps-script/      # ✅ 維持不變
│   └── Code.gs
│
├── 📁 src/                     # 🆕 前端原始碼
│   ├── 📁 components/          # React 元件
│   │   ├── 📁 Onboarding/
│   │   │   └── OnboardingScreen.tsx
│   │   ├── 📁 Tracker/
│   │   │   └── MainTracker.tsx
│   │   ├── 📁 History/
│   │   │   └── HistoryPage.tsx
│   │   ├── 📁 Settings/
│   │   │   └── SettingsPage.tsx
│   │   └── 📁 common/          # 共用元件
│   │       ├── Slider.tsx
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   │
│   ├── 📁 hooks/               # 自訂 Hooks
│   │   ├── useLocalStorage.ts
│   │   └── useGoogleSheets.ts
│   │
│   ├── 📁 services/            # API 服務
│   │   └── googleSheets.ts
│   │
│   ├── 📁 utils/               # 工具函數
│   │   └── financeCalc.ts      # 從 financeCalc.js 遷移
│   │
│   ├── 📁 types/               # TypeScript 類型定義
│   │   └── index.ts
│   │
│   ├── 📁 constants/           # 常數
│   │   └── index.ts
│   │
│   ├── App.tsx                 # 主應用程式
│   ├── main.tsx                # 入口點
│   └── index.css               # 全域樣式（Tailwind）
│
├── 📁 tests/                   # 🆕 測試檔案
│   ├── 📁 unit/
│   │   └── financeCalc.test.ts
│   ├── 📁 integration/
│   │   └── MainTracker.test.tsx
│   └── setup.ts
│
├── 📁 dist/                    # 🆕 Build 產物（在 .gitignore）
│   ├── index.html
│   └── assets/
│       ├── index-[hash].js
│       └── index-[hash].css
│
├── index.html                  # 🆕 Vite 開發入口
├── vite.config.ts              # 🆕 Vite 設定
├── tsconfig.json               # 🆕 TypeScript 設定
├── tailwind.config.js          # 🆕 Tailwind 設定
├── postcss.config.js           # 🆕 PostCSS 設定
├── .eslintrc.cjs               # 🆕 ESLint 設定
├── .prettierrc                 # 🆕 Prettier 設定
├── .gitignore                  # 更新
├── package.json                # 更新
└── README.md                   # 更新
```

---

## 4. 階段 2.1：Vite + React 基礎架構

### 4.1 初始化專案

```bash
# 在現有專案目錄執行（不要建新資料夾）
npm create vite@latest . -- --template react

# 如果提示目錄非空，選擇「Ignore files and continue」
```

### 4.2 安裝依賴

```bash
# 基本依賴
npm install

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 其他工具
npm install -D eslint prettier eslint-plugin-react eslint-config-prettier
```

### 4.3 設定 Tailwind CSS

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自訂動畫（從原 index.html 複製） */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #374151;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### 4.4 設定 Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/timebar/',  // ⚠️ 改成你的 repo 名稱
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### 4.5 建立入口檔案

```html
<!-- index.html（專案根目錄） -->
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#111827" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>TimeBar - 退休時間計算器</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 4.6 遷移核心模組

```typescript
// src/utils/financeCalc.ts
// 直接從 financeCalc.js 複製，加上 TypeScript 類型

export const CONSTANTS = {
  DEFAULT_INFLATION_RATE: 2.5,
  DEFAULT_ROI_RATE: 6,
  WORKING_DAYS_PER_MONTH: 22,
  WORKING_HOURS_PER_DAY: 8,
  WORKING_HOURS_PER_YEAR: 22 * 8 * 12,  // 2112
} as const;

export const FinanceCalc = {
  realRate(inflation: number, roi: number): number {
    return (1 + roi / 100) / (1 + inflation / 100) - 1;
  },
  
  futureValue(pv: number, rate: number, years: number): number {
    return pv * Math.pow(1 + rate, years);
  },
  
  // ... 其他方法
};

export const Formatters = {
  formatTime(workingHours: number) {
    // ... 實作
  },
  
  formatCurrency(amount: number): string {
    // ... 實作
  },
};

export const GPSCalc = {
  calculateEstimatedAge(targetRetireAge: number, records: Record[]) {
    // ... 實作
  },
};
```

### 4.7 遷移 Google Sheets API

```typescript
// src/services/googleSheets.ts

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_URL || '';

export const GoogleSheetsAPI = {
  isConfigured(): boolean {
    return !!GAS_WEB_APP_URL;
  },

  async getAll() {
    if (!this.isConfigured()) {
      return { success: false, userData: null, records: [] };
    }
    
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getAll`);
      const result = await response.json();
      return {
        success: true,
        userData: result.userData,
        records: result.records || [],
      };
    } catch (e) {
      console.error('getAll error:', e);
      return { success: false, userData: null, records: [] };
    }
  },

  async saveRecord(record: Record) {
    if (!this.isConfigured()) return { success: false };
    
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addRecord', data: record }),
      });
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  async saveUserData(userData: UserData) {
    // ... 實作
  },

  async clearAllData() {
    // ... 實作
  },
};
```

### 4.8 環境變數設定

```bash
# .env.local（本地開發，不提交到 git）
VITE_GAS_URL=https://script.google.com/macros/s/你的ID/exec
```

```bash
# .env.example（範例，提交到 git）
VITE_GAS_URL=
```

### 4.9 拆分 React 元件

```tsx
// src/App.tsx
import { useState, useEffect } from 'react';
import { OnboardingScreen } from './components/Onboarding/OnboardingScreen';
import { MainTracker } from './components/Tracker/MainTracker';
import { HistoryPage } from './components/History/HistoryPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { GoogleSheetsAPI } from './services/googleSheets';
import { Storage } from './utils/storage';
import { CONSTANTS } from './utils/financeCalc';
import type { UserData, Record, Screen } from './types';

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS;

function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // 載入資料：優先從雲端讀取
  useEffect(() => {
    const loadData = async () => {
      const localUserData = Storage.load('userData');
      const localRecords = Storage.load('records', []);

      if (GoogleSheetsAPI.isConfigured()) {
        setSyncStatus('syncing');
        try {
          const cloudData = await GoogleSheetsAPI.getAll();
          if (cloudData.success && cloudData.userData) {
            setUserData(cloudData.userData);
            setRecords(cloudData.records || []);
            Storage.save('userData', cloudData.userData);
            Storage.save('records', cloudData.records || []);
            setSyncStatus('synced');
            setScreen('main');
            return;
          }
        } catch (e) {
          console.error('Cloud sync failed:', e);
        }
        setSyncStatus('offline');
      }

      if (localUserData) {
        setUserData({
          ...localUserData,
          inflationRate: localUserData.inflationRate ?? DEFAULT_INFLATION_RATE,
          roiRate: localUserData.roiRate ?? DEFAULT_ROI_RATE,
        });
        setRecords(localRecords);
        setScreen('main');
      } else {
        setScreen('onboarding');
      }
    };

    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

  // ... 其他 handlers

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-4xl font-black text-white mb-4">
          Time<span className="text-emerald-400">Bar</span>
        </div>
        <div className="spinner mb-4" />
        <div className="text-gray-500 text-sm">
          {syncStatus === 'syncing' ? '☁️ 正在同步雲端資料...' : '載入中...'}
        </div>
      </div>
    );
  }

  return (
    <div>
      {screen === 'onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}
      {screen === 'main' && userData && (
        <MainTracker
          userData={userData}
          records={records}
          onAddRecord={handleAddRecord}
          onOpenHistory={() => setScreen('history')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'history' && userData && (
        <HistoryPage
          records={records}
          userData={userData}
          onClose={() => setScreen('main')}
        />
      )}
      {screen === 'settings' && userData && (
        <SettingsPage
          userData={userData}
          onUpdateUser={handleUpdateUser}
          onClose={() => setScreen('main')}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default App;
```

```tsx
// src/components/Tracker/MainTracker.tsx
import { useState, useCallback, useMemo } from 'react';
import { FinanceCalc, Formatters, GPSCalc, CONSTANTS } from '../../utils/financeCalc';
import type { UserData, Record } from '../../types';

interface MainTrackerProps {
  userData: UserData;
  records: Record[];
  onAddRecord: (record: Record) => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export function MainTracker({
  userData,
  records,
  onAddRecord,
  onOpenHistory,
  onOpenSettings,
}: MainTrackerProps) {
  const [mode, setMode] = useState<'spend' | 'save'>('spend');
  const [amount, setAmount] = useState(1000);
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { age, retireAge, salary, currentSavings, monthlySavings, inflationRate, roiRate } = userData;
  
  const yearsToRetire = retireAge - age;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);

  // GPS 計算
  const { totalSaved, totalSpent } = useMemo(
    () => GPSCalc.calculateTotals(records),
    [records]
  );

  const gpsResult = useMemo(
    () => GPSCalc.calculateEstimatedAge(retireAge, records),
    [retireAge, records]
  );

  const { estimatedAge, ageDiff, isAhead, isBehind, isOnTrack } = gpsResult;
  const diffDisplay = Formatters.formatAgeDiff(ageDiff);

  // 計算當前輸入的時間成本
  const timeCost = useMemo(
    () => FinanceCalc.calculateTimeCost(amount, isRecurring, hourlyRate, realRate, yearsToRetire),
    [amount, isRecurring, hourlyRate, realRate, yearsToRetire]
  );

  const timeFormatted = Formatters.formatTime(timeCost);

  const handleSubmit = async () => {
    if (amount <= 0) return;
    setIsSaving(true);

    const record: Record = {
      id: Date.now().toString(),
      type: mode,
      amount,
      isRecurring,
      timeCost,
      category: category || '一般消費',
      note,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('zh-TW'),
    };

    await onAddRecord(record);
    setIsSaving(false);
    setNote('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* ... JSX 內容（從原 index.html 複製） */}
    </div>
  );
}
```

### 4.10 類型定義

```typescript
// src/types/index.ts

export interface UserData {
  age: number;
  salary: number;
  retireAge: number;
  currentSavings: number;
  monthlySavings: number;
  inflationRate: number;
  roiRate: number;
  targetRetirementFund?: number;
}

export interface Record {
  id: string;
  type: 'spend' | 'save';
  amount: number;
  isRecurring: boolean;
  timeCost: number;
  category: string;
  note: string;
  timestamp: string;
  date: string;
}

export type Screen = 'loading' | 'onboarding' | 'main' | 'history' | 'settings';

export interface GPSResult {
  estimatedAge: number;
  ageDiff: number;
  ageDiffDays: number;
  isAhead: boolean;
  isBehind: boolean;
  isOnTrack: boolean;
  totalSavedHours: number;
  totalSpentHours: number;
}

export interface TimeFormatted {
  value: number;
  unit: string;
  color: string;
}
```

### 4.11 更新 package.json

```json
{
  "name": "timebar",
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jsdom": "^23.0.0"
  }
}
```

### 4.12 更新 .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/
```

---

## 5. 階段 2.2：TypeScript 遷移

### 5.1 TypeScript 設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 5.2 檔案重新命名

```bash
# 將 .js/.jsx 改為 .ts/.tsx
mv src/utils/financeCalc.js src/utils/financeCalc.ts
mv src/App.jsx src/App.tsx
mv src/main.jsx src/main.tsx
# ... 其他檔案
```

### 5.3 加入類型註解

所有函數都要加上參數和回傳類型，參考 4.10 的類型定義。

---

## 6. 階段 2.3：測試完善

### 6.1 Vitest 設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
```

### 6.2 單元測試（遷移現有測試）

```typescript
// tests/unit/financeCalc.test.ts
import { describe, it, expect } from 'vitest';
import { CONSTANTS, FinanceCalc, Formatters, GPSCalc } from '../../src/utils/financeCalc';

describe('CONSTANTS', () => {
  it('應該有正確的預設通膨率', () => {
    expect(CONSTANTS.DEFAULT_INFLATION_RATE).toBe(2.5);
  });

  it('每年工作小時應該是 2112', () => {
    expect(CONSTANTS.WORKING_HOURS_PER_YEAR).toBe(2112);
  });
});

describe('FinanceCalc.realRate', () => {
  it('通膨2.5%、報酬6%，實質報酬率應約3.41%', () => {
    const rate = FinanceCalc.realRate(2.5, 6);
    expect(rate).toBeCloseTo(0.0341, 3);
  });

  it('通膨高於報酬時，實質報酬率應為負', () => {
    const rate = FinanceCalc.realRate(8, 5);
    expect(rate).toBeLessThan(0);
  });
});

describe('FinanceCalc.futureValue', () => {
  it('100元、10%利率、2年，終值應為121', () => {
    const fv = FinanceCalc.futureValue(100, 0.1, 2);
    expect(fv).toBeCloseTo(121, 2);
  });
});

// ... 更多測試（從 financeCalc.test.js 遷移）
```

### 6.3 整合測試（元件測試）

```typescript
// tests/integration/MainTracker.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainTracker } from '../../src/components/Tracker/MainTracker';

const mockUserData = {
  age: 30,
  salary: 50000,
  retireAge: 65,
  currentSavings: 100000,
  monthlySavings: 10000,
  inflationRate: 2.5,
  roiRate: 6,
};

describe('MainTracker', () => {
  it('應該正確顯示 GPS 目標年齡', () => {
    render(
      <MainTracker
        userData={mockUserData}
        records={[]}
        onAddRecord={vi.fn()}
        onOpenHistory={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText('65 歲')).toBeInTheDocument();
  });

  it('輸入金額後應該顯示時間成本', () => {
    render(
      <MainTracker
        userData={mockUserData}
        records={[]}
        onAddRecord={vi.fn()}
        onOpenHistory={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    // 預設金額 1000，應該顯示時間成本
    expect(screen.getByText(/延後|提前/)).toBeInTheDocument();
  });

  it('切換到儲蓄模式應該改變顯示文字', async () => {
    render(
      <MainTracker
        userData={mockUserData}
        records={[]}
        onAddRecord={vi.fn()}
        onOpenHistory={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const saveButton = screen.getByText('儲蓄');
    fireEvent.click(saveButton);

    expect(screen.getByText(/這次要存/)).toBeInTheDocument();
  });
});
```

### 6.4 測試覆蓋率

```bash
# 執行測試並產生覆蓋率報告
npm run test -- --coverage
```

---

## 7. 階段 2.4：GitHub Actions CI/CD

### 7.1 建立 Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # 測試 Job
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

  # Build Job
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_GAS_URL: ${{ secrets.VITE_GAS_URL }}

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  # Deploy Job（僅在 main branch push 時執行）
  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 7.2 設定 GitHub Secrets

到 Repo → **Settings** → **Secrets and variables** → **Actions**：

| Secret 名稱 | 值 |
|-------------|-----|
| `VITE_GAS_URL` | `https://script.google.com/macros/s/你的ID/exec` |

### 7.3 設定 GitHub Pages

到 Repo → **Settings** → **Pages**：

| 設定項 | 值 |
|--------|-----|
| Source | **GitHub Actions** |

### 7.4 Workflow 執行流程

```
Pull Request:
  └── test → build（不部署）

Push to main:
  └── test → build → deploy
        │      │        │
        │      │        └── 部署到 GitHub Pages
        │      └── 產生 dist/
        └── 測試 + Lint
```

---

## 8. 部署流程

### 8.1 本地開發

```bash
# 啟動開發伺服器
npm run dev

# 開啟瀏覽器
# http://localhost:5173/timebar/
```

### 8.2 本地測試 Build

```bash
# 執行測試
npm test

# Build
npm run build

# 預覽 Build 結果
npm run preview
```

### 8.3 部署到 GitHub Pages

```bash
# 只需要 push 到 main branch
git add .
git commit -m "feat: 新功能"
git push origin main

# GitHub Actions 會自動：
# 1. 執行測試
# 2. Build
# 3. 部署
```

### 8.4 檢查部署狀態

- 到 Repo → **Actions** 查看 Workflow 執行狀態
- 綠色 ✅ = 部署成功
- 紅色 ❌ = 測試或 Build 失敗（不會部署）

---

## 9. 遷移檢查清單

### 階段 2.1：Vite + React

- [ ] 初始化 Vite 專案
- [ ] 安裝 Tailwind CSS
- [ ] 設定 vite.config.ts（base path）
- [ ] 建立 src/ 目錄結構
- [ ] 遷移 financeCalc.js → src/utils/financeCalc.ts
- [ ] 遷移 GoogleSheetsAPI → src/services/googleSheets.ts
- [ ] 拆分元件：OnboardingScreen
- [ ] 拆分元件：MainTracker
- [ ] 拆分元件：HistoryPage
- [ ] 拆分元件：SettingsPage
- [ ] 建立 App.tsx
- [ ] 設定環境變數 (.env.local)
- [ ] 更新 .gitignore
- [ ] 本地測試 `npm run dev`
- [ ] 本地測試 `npm run build`

### 階段 2.2：TypeScript

- [ ] 建立 tsconfig.json
- [ ] 建立 src/types/index.ts
- [ ] 所有 .js → .ts
- [ ] 所有 .jsx → .tsx
- [ ] 加入類型註解
- [ ] 修復 TypeScript 錯誤
- [ ] 確認 Build 成功

### 階段 2.3：測試

- [ ] 安裝 Vitest + Testing Library
- [ ] 建立 vitest.config.ts
- [ ] 遷移單元測試
- [ ] 新增元件整合測試
- [ ] 確認測試全部通過
- [ ] 檢查測試覆蓋率

### 階段 2.4：CI/CD

- [ ] 建立 .github/workflows/deploy.yml
- [ ] 設定 GitHub Secret (VITE_GAS_URL)
- [ ] 修改 GitHub Pages 設定為 GitHub Actions
- [ ] Push 測試自動部署
- [ ] 確認網站正常運作

---

## 附錄

### A. 常見問題

**Q: Build 後網站空白？**
A: 檢查 `vite.config.ts` 的 `base` 是否正確設定為 `/timebar/`（你的 repo 名稱）

**Q: 環境變數沒讀到？**
A: Vite 環境變數必須以 `VITE_` 開頭，且要重啟 dev server

**Q: GitHub Actions 失敗？**
A: 檢查 Actions 頁面的錯誤訊息，通常是測試失敗或 Build 錯誤

### B. 有用的指令

```bash
# 開發
npm run dev           # 啟動開發伺服器
npm run build         # 打包
npm run preview       # 預覽打包結果

# 測試
npm test              # 執行一次測試
npm run test:watch    # Watch 模式
npm test -- --coverage # 測試覆蓋率

# 其他
npm run lint          # 程式碼檢查
npx tsc --noEmit      # TypeScript 類型檢查
```

### C. 參考資源

- [Vite 官方文件](https://vitejs.dev/)
- [React 官方文件](https://react.dev/)
- [TypeScript 官方文件](https://www.typescriptlang.org/)
- [Vitest 官方文件](https://vitest.dev/)
- [Tailwind CSS 官方文件](https://tailwindcss.com/)
- [GitHub Pages 部署](https://vitejs.dev/guide/static-deploy.html#github-pages)
