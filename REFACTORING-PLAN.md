# TimeBar 重構計劃

> **版本**: v1.0
> **日期**: 2026-01-07
> **目標**: 建立可維護、可擴展、易測試的架構，支持未來 UI/UX 迭代而無需大幅重構

---

## 📋 執行摘要

### 重構核心原則

本次重構不僅是 UI/UX 改版，更是建立一個**長期可維護的架構體系**：

1. **關注點分離** - UI、業務邏輯、數據層完全解耦
2. **組件化設計** - 可復用、可組合、可測試的組件體系
3. **漸進式遷移** - 新舊系統共存，逐步替換，零停機
4. **設計系統** - 統一的 Design Tokens，UI 修改只需調整配置
5. **測試優先** - 每個層次都有對應的測試策略

### 改進指標

| 維度 | 當前狀態 | 目標狀態 |
|------|---------|---------|
| **架構層次** | 耦合混亂 | 清晰分層（4層） |
| **組件復用率** | < 20% | > 60% |
| **UI 修改成本** | 需改多個檔案 | 只改 Design Tokens |
| **測試覆蓋率** | 34%（120/350測試點） | > 80% |
| **建置時間** | ~45秒 | < 20秒（模組化） |
| **新功能開發** | 3-5天 | 1-2天（組件化） |

---

## 第一部分：架構設計

## 1. 新架構分層

### 1.1 四層架構體系

```
┌─────────────────────────────────────┐
│  Layer 4: UI Components (展示層)     │
│  - Pages (頁面組合)                  │
│  - Features (功能組件)               │
│  - Composites (複合組件)             │
│  - Atoms (原子組件)                  │
└─────────────────────────────────────┘
              ↓ Props & Callbacks
┌─────────────────────────────────────┐
│  Layer 3: Business Logic (業務層)    │
│  - Hooks (useFinance, useRecords)   │
│  - State Management (狀態管理)       │
│  - Validators (驗證邏輯)             │
│  - Formatters (格式化)               │
└─────────────────────────────────────┘
              ↓ Pure Functions
┌─────────────────────────────────────┐
│  Layer 2: Domain Logic (領域層)      │
│  - Calculators (計算引擎)            │
│  - Systems (系統服務)                │
│  - Utils (工具函數)                  │
│  - Types (類型定義)                  │
└─────────────────────────────────────┘
              ↓ Data Models
┌─────────────────────────────────────┐
│  Layer 1: Data Access (數據層)       │
│  - Storage (本地存儲)                │
│  - API (雲端同步)                    │
│  - Adapters (適配器)                 │
│  - Migrations (數據遷移)             │
└─────────────────────────────────────┘
```

### 1.2 依賴規則

**嚴格的單向依賴：**
- Layer 4 只依賴 Layer 3
- Layer 3 只依賴 Layer 2
- Layer 2 只依賴 Layer 1
- Layer 1 無外部依賴（只依賴標準庫）

**禁止的依賴：**
- ❌ UI 組件直接調用 Storage
- ❌ Domain Logic 依賴 React
- ❌ 跨層引用（Layer 4 → Layer 2）

### 1.3 目錄結構設計

```
src/
├── 📁 layers/
│   ├── 📁 1-data/                    # Layer 1: 數據層
│   │   ├── storage/
│   │   │   ├── LocalStorage.ts       # 本地存儲抽象
│   │   │   ├── SessionStorage.ts
│   │   │   └── IndexedDB.ts         # 未來支援
│   │   ├── api/
│   │   │   ├── GoogleSheetsAPI.ts
│   │   │   └── BaseAPI.ts           # API 基類
│   │   ├── adapters/
│   │   │   ├── StorageAdapter.ts
│   │   │   └── CloudSyncAdapter.ts
│   │   └── migrations/
│   │       ├── v3.0-to-v3.1.ts
│   │       └── MigrationRunner.ts
│   │
│   ├── 📁 2-domain/                  # Layer 2: 領域層
│   │   ├── calculators/
│   │   │   ├── FinanceCalculator.ts  # 純函數計算
│   │   │   ├── GPSCalculator.ts
│   │   │   └── TimeCalculator.ts
│   │   ├── systems/
│   │   │   ├── SettingsSystem.ts
│   │   │   ├── CategorySystem.ts
│   │   │   ├── PointsSystem.ts
│   │   │   └── RecordSystem.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── helpers.ts
│   │   └── types/
│   │       ├── entities.ts          # 實體類型
│   │       ├── valueObjects.ts      # 值對象
│   │       └── interfaces.ts
│   │
│   ├── 📁 3-business/                # Layer 3: 業務層
│   │   ├── hooks/
│   │   │   ├── useFinance.ts        # 財務相關邏輯
│   │   │   ├── useRecords.ts        # 記錄管理
│   │   │   ├── useSettings.ts       # 設定管理
│   │   │   └── useSync.ts           # 同步邏輯
│   │   ├── state/
│   │   │   ├── GlobalState.ts       # 全局狀態
│   │   │   ├── RecordsState.ts
│   │   │   └── UIState.ts           # UI 狀態
│   │   ├── services/
│   │   │   ├── NavigationService.ts
│   │   │   ├── NotificationService.ts
│   │   │   └── AnalyticsService.ts
│   │   └── validators/
│   │       ├── FormValidators.ts
│   │       └── BusinessRules.ts
│   │
│   └── 📁 4-ui/                      # Layer 4: UI 層
│       ├── design-system/
│       │   ├── tokens/
│       │   │   ├── colors.ts        # 顏色系統
│       │   │   ├── typography.ts    # 字體系統
│       │   │   ├── spacing.ts       # 間距系統
│       │   │   └── animations.ts    # 動畫配置
│       │   ├── atoms/               # 原子組件
│       │   │   ├── Button/
│       │   │   ├── Input/
│       │   │   ├── Badge/
│       │   │   └── Icon/
│       │   ├── molecules/           # 分子組件
│       │   │   ├── FormField/
│       │   │   ├── Card/
│       │   │   └── Modal/
│       │   └── organisms/           # 有機體組件
│       │       ├── Header/
│       │       ├── Navigation/
│       │       └── Forms/
│       ├── features/                # 功能組件
│       │   ├── retirement-progress/
│       │   │   ├── RetirementProgress.tsx
│       │   │   ├── ProgressBar.tsx
│       │   │   └── StatusBadge.tsx
│       │   ├── amount-input/
│       │   ├── time-cost-display/
│       │   └── decision-buttons/
│       ├── pages/                   # 頁面組件
│       │   ├── HomePage/
│       │   ├── HistoryPage/
│       │   ├── SettingsPage/
│       │   └── OnboardingPage/
│       └── layouts/                 # 佈局組件
│           ├── MainLayout.tsx
│           ├── ModalLayout.tsx
│           └── EmptyLayout.tsx
│
├── 📁 tests/
│   ├── unit/                        # 單元測試
│   ├── integration/                 # 集成測試
│   └── e2e/                         # E2E 測試
│
└── 📁 config/
    ├── vite.config.ts
    ├── vitest.config.ts
    └── tailwind.config.js
```

---

## 2. 設計系統建立

### 2.1 Design Tokens 架構

**目標**：所有視覺變更只需修改 tokens，無需改動組件代碼

```typescript
// src/layers/4-ui/design-system/tokens/colors.ts

export const ColorTokens = {
  // Semantic Colors (語義化顏色)
  semantic: {
    primary: {
      DEFAULT: '#10b981',  // emerald-500
      hover: '#059669',    // emerald-600
      active: '#047857',   // emerald-700
    },
    success: { /* ... */ },
    warning: { /* ... */ },
    error: { /* ... */ },
  },

  // State Colors (狀態顏色)
  state: {
    ahead: {
      bar: '#10b981',
      dot: '#34d399',
      badge: '#10b981',
      icon: '🚀',
    },
    onTrack: { /* ... */ },
    behind: { /* ... */ },
  },

  // Component Colors (組件專用)
  components: {
    button: {
      primary: 'semantic.primary',     // 引用語義色
      secondary: 'neutral.600',
    },
    input: { /* ... */ },
  },
};

// 使用方式
import { resolveToken } from '@/design-system/tokens';

const buttonColor = resolveToken('components.button.primary');
// 自動解析為 #10b981
```

### 2.2 組件化分級

**Atomic Design 原則：**

```
Atoms (原子)
  ↓ 組合
Molecules (分子)
  ↓ 組合
Organisms (有機體)
  ↓ 組合
Features (功能模組)
  ↓ 組合
Pages (頁面)
```

**範例：RetirementProgress 分解**

```
RetirementProgress (Feature)
  ├─ ProgressBar (Organism)
  │   ├─ ProgressTrack (Molecule)
  │   │   ├─ ProgressSegment (Atom)
  │   │   └─ ProgressDot (Atom)
  │   └─ ProgressLabel (Molecule)
  │       ├─ Text (Atom)
  │       └─ Icon (Atom)
  ├─ StatusBadge (Molecule)
  │   ├─ Badge (Atom)
  │   └─ Icon (Atom)
  └─ DetailModal (Organism)
      ├─ Modal (Molecule)
      ├─ StatsList (Molecule)
      └─ Button (Atom)
```

### 2.3 主題系統

**支持未來的多主題切換：**

```typescript
// src/layers/4-ui/design-system/themes/

interface Theme {
  colors: typeof ColorTokens;
  typography: typeof TypographyTokens;
  spacing: typeof SpacingTokens;
  animations: typeof AnimationTokens;
}

export const LightTheme: Theme = { /* ... */ };
export const DarkTheme: Theme = { /* ... */ };
export const HighContrastTheme: Theme = { /* ... */ };

// 主題切換無需改組件
<ThemeProvider theme={currentTheme}>
  <App />
</ThemeProvider>
```

---

## 3. 狀態管理策略

### 3.1 狀態分類

**三種狀態，三種管理方式：**

| 狀態類型 | 管理方式 | 範例 |
|---------|---------|------|
| **Server State** | React Query / SWR | 雲端資料、記錄列表 |
| **Global State** | Context + Reducer | 用戶設定、主題 |
| **Local State** | useState / useReducer | 表單輸入、Modal 開關 |

### 3.2 狀態架構

```typescript
// src/layers/3-business/state/

// 全局狀態
interface GlobalState {
  user: {
    data: UserData | null;
    isLoading: boolean;
    error: Error | null;
  };
  settings: {
    theme: Theme;
    language: Language;
  };
  ui: {
    currentScreen: Screen;
    modals: ModalState;
  };
}

// 使用 React Query 管理服務端狀態
const { data: records, isLoading } = useQuery({
  queryKey: ['records'],
  queryFn: fetchRecords,
  staleTime: 5 * 60 * 1000, // 5分鐘
});

// 使用 Context 管理全局狀態
const { userData, updateUserData } = useGlobalState();
```

### 3.3 數據流設計

```
User Action (UI)
    ↓
Event Handler (Business Layer)
    ↓
State Update / API Call
    ↓
Re-render (React)
    ↓
UI Update
```

**單向數據流，易於追蹤和測試**

---

## 4. 測試策略

### 4.1 測試金字塔

```
        /\
       /  \      E2E Tests (10%)
      /    \     - 關鍵用戶流程
     /------\
    /        \   Integration Tests (30%)
   /          \  - 功能模組測試
  /------------\
 /              \ Unit Tests (60%)
/________________\ - 純函數、工具函數
```

### 4.2 各層測試策略

| Layer | 測試類型 | 測試工具 | 覆蓋率目標 |
|-------|---------|---------|-----------|
| **Layer 1 (Data)** | 單元測試 | Vitest | 90% |
| **Layer 2 (Domain)** | 單元測試 | Vitest | 95% |
| **Layer 3 (Business)** | 集成測試 | Vitest + Testing Library | 80% |
| **Layer 4 (UI)** | 快照測試 + E2E | Vitest + Playwright | 60% |

### 4.3 測試目錄結構

```
tests/
├── unit/
│   ├── calculators/
│   │   ├── FinanceCalculator.test.ts
│   │   └── GPSCalculator.test.ts
│   ├── systems/
│   │   └── SettingsSystem.test.ts
│   └── utils/
│       └── formatters.test.ts
│
├── integration/
│   ├── hooks/
│   │   ├── useFinance.test.ts
│   │   └── useRecords.test.ts
│   └── features/
│       └── retirement-progress.test.tsx
│
├── e2e/
│   ├── onboarding.spec.ts
│   ├── record-expense.spec.ts
│   └── sync.spec.ts
│
└── fixtures/
    ├── mockData.ts
    └── testHelpers.ts
```

### 4.4 測試示例

**Layer 2 純函數測試（易於測試）：**
```typescript
// tests/unit/calculators/FinanceCalculator.test.ts

describe('FinanceCalculator', () => {
  describe('calculateTimeCost', () => {
    it('應正確計算一次性消費的時間成本', () => {
      const result = FinanceCalculator.calculateTimeCost({
        amount: 5000,
        isRecurring: false,
        hourlyRate: 500,
        realRate: 0.0341,
        yearsToRetire: 35,
      });

      expect(result).toBeCloseTo(31.2, 1); // 約31.2小時
    });
  });
});
```

**Layer 3 Hook 測試（使用 renderHook）：**
```typescript
// tests/integration/hooks/useFinance.test.ts

describe('useFinance', () => {
  it('應正確計算並返回時間成本', () => {
    const { result } = renderHook(() => useFinance({
      userData: mockUserData,
      amount: 1000,
    }));

    expect(result.current.timeCost).toBeDefined();
    expect(result.current.vividComparison).toContain('天');
  });
});
```

**Layer 4 組件快照測試：**
```typescript
// tests/integration/features/retirement-progress.test.tsx

describe('RetirementProgress', () => {
  it('應正確渲染領先狀態', () => {
    const { container } = render(
      <RetirementProgress
        targetAge={65}
        estimatedAge={63.2}
        status="ahead"
      />
    );

    expect(container).toMatchSnapshot();
    expect(screen.getByText(/領先/)).toBeInTheDocument();
  });
});
```

---

## 第二部分：重構執行計劃

## 5. Phase 0: 準備階段（1 週）

**目標**：建立基礎設施，不影響現有功能

### 5.1 Task 0.1: 建立新目錄結構

**檢查點：**
- [ ] 創建 `src/layers/` 目錄結構
- [ ] 設置 TypeScript path alias
  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "paths": {
        "@data/*": ["src/layers/1-data/*"],
        "@domain/*": ["src/layers/2-domain/*"],
        "@business/*": ["src/layers/3-business/*"],
        "@ui/*": ["src/layers/4-ui/*"]
      }
    }
  }
  ```
- [ ] 配置 ESLint 規則禁止跨層引用
  ```javascript
  // .eslintrc.js
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Layer 4 只能引用 Layer 3
          {
            target: './src/layers/4-ui',
            from: './src/layers/2-domain',
          },
          // 其他限制...
        ],
      },
    ],
  }
  ```

### 5.2 Task 0.2: 建立 Design System 基礎

**檢查點：**
- [ ] 定義 Design Tokens
  - 顏色系統（ColorTokens）
  - 字體系統（TypographyTokens）
  - 間距系統（SpacingTokens）
  - 動畫系統（AnimationTokens）
- [ ] 建立 Token Resolver
  ```typescript
  resolveToken('components.button.primary')
  // → 自動解析為實際顏色值
  ```
- [ ] 配置 Tailwind 使用 Design Tokens
  ```javascript
  // tailwind.config.js
  theme: {
    extend: {
      colors: ColorTokens.semantic,
      // 從 tokens 動態生成
    },
  }
  ```
- [ ] 建立 Storybook（可選）
  - 文檔化所有 Design Tokens
  - 可視化組件庫

**驗收標準：**
- ✅ 所有 tokens 定義完成並有文檔
- ✅ 可以透過 `resolveToken()` 取得任何 token 值
- ✅ ESLint 規則生效（跨層引用會報錯）

### 5.3 Task 0.3: 建立測試基礎設施

**檢查點：**
- [ ] 配置 Vitest 支援多層測試
  ```typescript
  // vitest.config.ts
  export default defineConfig({
    test: {
      coverage: {
        include: ['src/layers/**/*.{ts,tsx}'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
        },
      },
    },
  });
  ```
- [ ] 安裝 Playwright (E2E 測試)
- [ ] 建立測試工具函數
  - `renderWithProviders()` - 包含所有 Provider
  - `createMockUserData()` - 生成測試數據
  - `waitForSync()` - 等待異步操作
- [ ] 建立 CI 流程
  ```yaml
  # .github/workflows/test.yml
  - name: Run Tests
    run: npm test -- --coverage
  - name: Check Coverage
    run: npm run test:coverage
  ```

**驗收標準：**
- ✅ `npm test` 可成功運行
- ✅ 測試覆蓋率報告正常生成
- ✅ CI 流程可自動運行測試

---

## 6. Phase 1: Layer 2 重構（2 週）

**目標**：提取純函數，建立穩固的領域層

### 6.1 原則

**為什麼先做 Layer 2？**
1. Layer 2 是純函數，最容易測試
2. 不依賴任何外部狀態，重構風險最低
3. 一旦穩定，上層可以安心依賴

### 6.2 Task 1.1: 提取計算引擎

**目標檔案：**
- `src/utils/financeCalc.ts` → `src/layers/2-domain/calculators/FinanceCalculator.ts`
- `src/utils/lifeCostCalc.ts` → `src/layers/2-domain/calculators/TimeCalculator.ts`

**重構策略：**
```typescript
// 舊代碼（UMD 包裹）
(function(root, factory) {
  if (typeof module === 'object') {
    module.exports = factory();
  } else {
    root.TimeBarFinance = factory();
  }
}(this, function() {
  const FinanceCalc = { /* ... */ };
  return { FinanceCalc };
}));

// 新代碼（ES Module，純函數類別）
export class FinanceCalculator {
  // 所有方法都是 static pure function
  static calculateTimeCost(params: TimeCostParams): number {
    // 純函數，無副作用
  }

  static calculateFutureValue(params: FVParams): number {
    // ...
  }
}
```

**檢查點：**
- [ ] 所有計算函數提取為純函數
- [ ] 移除 UMD 包裹
- [ ] 每個函數都有完整的 TypeScript 類型
- [ ] 撰寫單元測試（目標覆蓋率 95%+）
- [ ] 舊檔案保留，新檔案建立（共存期）
- [ ] 在新檔案中重新導出舊 API（向後兼容）
  ```typescript
  // src/utils/financeCalc.ts (保留)
  export { FinanceCalculator as FinanceCalc } from '@domain/calculators/FinanceCalculator';
  // 現有代碼仍可使用 import { FinanceCalc } from '@/utils/financeCalc'
  ```

**驗收標準：**
- ✅ 所有計算測試通過（原有 56 個 + 新增測試）
- ✅ 無任何外部依賴（只依賴 Math 等標準庫）
- ✅ 現有代碼仍可正常運作（透過重新導出）

### 6.3 Task 1.2: 重構系統服務

**目標檔案：**
- `SettingsSystem` → 純化為類別實例
- `CategorySystem` → 純化為類別實例
- `PointsSystem` → 純化為類別實例
- `RecordSystem` → 純化為類別實例

**重構策略：**
```typescript
// 舊代碼（混合了數據存取）
export const SettingsSystem = {
  saveSetting(key, value) {
    localStorage.setItem(key, JSON.stringify(value)); // ❌ 直接存取 Storage
    cloudSync.save(value); // ❌ 直接存取 API
  }
};

// 新代碼（依賴注入，純業務邏輯）
export class SettingsService {
  constructor(
    private storage: IStorage,  // 依賴注入
    private sync: ICloudSync,   // 依賴注入
  ) {}

  saveSetting(key: string, value: unknown): SettingsSaveResult {
    // 純業務邏輯，不直接操作 I/O
    const validated = this.validate(key, value);
    return {
      localSave: () => this.storage.save(key, validated),
      cloudSync: () => this.sync.save(validated),
    };
  }
}

// 向後兼容的靜態導出
export const SettingsSystem = {
  saveSetting: (key, value) => defaultInstance.saveSetting(key, value),
};
```

**檢查點：**
- [ ] 將所有 I/O 操作抽離到 Layer 1
- [ ] 使用依賴注入
- [ ] 保留靜態導出以向後兼容
- [ ] 撰寫單元測試（mock I/O 層）

**驗收標準：**
- ✅ 原有測試通過（settingsSystem.test.ts: 9個）
- ✅ 新增邊界測試（異常處理、驗證邏輯）
- ✅ 無直接調用 `localStorage` 或 `fetch`

### 6.4 Task 1.3: 統一類型定義

**目標檔案：**
- `src/types/index.ts` → 拆分為多個文件

**重構策略：**
```
src/layers/2-domain/types/
├── entities.ts           # 實體類型
│   ├── UserData
│   ├── Record
│   └── Category
├── valueObjects.ts       # 值對象
│   ├── Money
│   ├── TimeSpan
│   └── Age
├── enums.ts             # 枚舉
│   ├── Screen
│   ├── RecordType
│   └── CategoryType
└── interfaces.ts        # 接口定義
    ├── IStorage
    ├── ICloudSync
    └── ICalculator
```

**Value Object 範例：**
```typescript
// valueObjects.ts
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string = 'TWD'
  ) {
    if (amount < 0) throw new Error('金額不能為負');
  }

  static create(amount: number): Money {
    return new Money(amount);
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  format(): string {
    return `$${this.amount.toLocaleString()}`;
  }
}

// 使用
const price = Money.create(5000);
const total = price.add(Money.create(150));
console.log(total.format()); // "$5,150"
```

**檢查點：**
- [ ] 將大型類型拆分為小文件
- [ ] 使用 Value Object 封裝業務邏輯
- [ ] 所有類型都有 JSDoc 註釋
- [ ] 建立類型匯出入口（barrel export）
  ```typescript
  // src/layers/2-domain/types/index.ts
  export * from './entities';
  export * from './valueObjects';
  export * from './enums';
  export * from './interfaces';
  ```

**驗收標準：**
- ✅ 無重複的類型定義
- ✅ 所有類型都有文檔
- ✅ 通過 `tsc --noEmit` 檢查

---

## 7. Phase 2: Layer 1 重構（1.5 週）

**目標**：建立穩定的數據存取層

### 7.1 Task 2.1: 抽象化存儲層

**目標檔案：**
- `src/utils/storage.ts` → `src/layers/1-data/storage/`

**重構策略：**
```typescript
// 定義統一的存儲接口
export interface IStorage {
  save<T>(key: string, value: T): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// LocalStorage 實作
export class LocalStorageAdapter implements IStorage {
  async save<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      throw new StorageError('Failed to save', { key, error });
    }
  }

  async load<T>(key: string): Promise<T | null> {
    // ...
  }
}

// 未來可以輕鬆替換為 IndexedDB
export class IndexedDBAdapter implements IStorage {
  // 相同的接口，不同的實作
}
```

**檢查點：**
- [ ] 定義 `IStorage` 接口
- [ ] 實作 `LocalStorageAdapter`
- [ ] 實作 `SessionStorageAdapter`（用於臨時數據）
- [ ] 建立 `StorageFactory` 根據配置選擇實作
  ```typescript
  const storage = StorageFactory.create('local'); // or 'session', 'indexeddb'
  ```
- [ ] 錯誤處理與重試機制
- [ ] 單元測試（mock localStorage）

**驗收標準：**
- ✅ 可以輕鬆切換不同的存儲實作
- ✅ 所有錯誤都有適當處理
- ✅ 測試覆蓋率 > 90%

### 7.2 Task 2.2: 抽象化 API 層

**目標檔案：**
- `src/services/googleSheets.ts` → `src/layers/1-data/api/`

**重構策略：**
```typescript
// 定義統一的同步接口
export interface ICloudSync {
  getUserData(): Promise<Result<UserData>>;
  saveUserData(data: UserData): Promise<Result<void>>;
  getRecords(): Promise<Result<Record[]>>;
  saveRecord(record: Record): Promise<Result<void>>;
}

// Google Sheets 實作
export class GoogleSheetsAPI implements ICloudSync {
  constructor(
    private apiUrl: string,
    private retryPolicy: RetryPolicy = defaultRetry,
  ) {}

  async getUserData(): Promise<Result<UserData>> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.apiUrl}?action=getUserData`);
      if (!response.ok) throw new APIError(response);
      return response.json();
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<Result<T>> {
    // 重試邏輯
  }
}

// 未來可以替換為其他後端
export class FirebaseAPI implements ICloudSync {
  // 相同接口，不同實作
}
```

**檢查點：**
- [ ] 定義 `ICloudSync` 接口
- [ ] 實作 `GoogleSheetsAPI`
- [ ] 建立 `Result<T>` 類型處理錯誤
  ```typescript
  type Result<T> =
    | { success: true; data: T }
    | { success: false; error: Error };
  ```
- [ ] 實作重試機制（指數退避）
- [ ] 實作請求去重（debounce）
- [ ] 單元測試（mock fetch）

**驗收標準：**
- ✅ 可以輕鬆切換不同的雲端服務
- ✅ 網路錯誤有自動重試
- ✅ 測試覆蓋率 > 85%

### 7.3 Task 2.3: 數據遷移系統

**目標**：支援跨版本的數據結構變更

**檔案結構：**
```
src/layers/1-data/migrations/
├── Migration.interface.ts
├── MigrationRunner.ts
└── versions/
    ├── v3.0-to-v3.1.ts
    ├── v3.1-to-v3.2.ts
    └── v3.2-to-v4.0.ts (未來)
```

**遷移範例：**
```typescript
// Migration.interface.ts
export interface Migration {
  version: string;
  up(data: unknown): unknown;
  down(data: unknown): unknown;
}

// versions/v3.1-to-v3.2.ts
export const migration_v3_1_to_v3_2: Migration = {
  version: '3.2',

  up(data: any) {
    // 新增 createdAt 欄位
    return {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      // 移除 guiltFree (免罪卡) 相關欄位
      inventory: {
        ...data.inventory,
        guiltFreePass: undefined,
      },
    };
  },

  down(data: any) {
    // 降級邏輯（可選）
    const { createdAt, ...rest } = data;
    return rest;
  },
};

// MigrationRunner.ts
export class MigrationRunner {
  async migrate(data: unknown, targetVersion: string): Promise<unknown> {
    const currentVersion = (data as any).version || '3.0';
    const migrations = this.getMigrationPath(currentVersion, targetVersion);

    let result = data;
    for (const migration of migrations) {
      result = migration.up(result);
    }

    return { ...result, version: targetVersion };
  }
}
```

**檢查點：**
- [ ] 定義 Migration 接口
- [ ] 實作 MigrationRunner
- [ ] 撰寫 v3.1 → v3.2 遷移腳本
- [ ] 在 App 啟動時自動檢查並遷移
- [ ] 單元測試（測試所有遷移腳本）

**驗收標準：**
- ✅ 舊版用戶升級後數據正常
- ✅ 可以安全回退版本（down migration）
- ✅ 測試覆蓋率 > 95%

---

## 8. Phase 3: Layer 3 重構（2 週）

**目標**：建立清晰的業務邏輯層

### 8.1 Task 3.1: 建立 Custom Hooks

**目標**：將組件中的業務邏輯提取為可復用的 Hooks

**Hooks 設計原則：**
- 一個 Hook 只做一件事
- Hook 之間可以組合
- 所有 Hook 都要有測試

**範例：useFinance**
```typescript
// src/layers/3-business/hooks/useFinance.ts

export function useFinance(userData: UserData) {
  const calculator = useMemo(
    () => new FinanceCalculator(userData),
    [userData]
  );

  const calculateTimeCost = useCallback(
    (amount: number, isRecurring: boolean) => {
      return calculator.calculateTimeCost({
        amount,
        isRecurring,
        hourlyRate: calculator.hourlyRate,
        realRate: calculator.realRate,
        yearsToRetire: calculator.yearsToRetire,
      });
    },
    [calculator]
  );

  return {
    hourlyRate: calculator.hourlyRate,
    realRate: calculator.realRate,
    yearsToRetire: calculator.yearsToRetire,
    calculateTimeCost,
    formatTimeCost: (hours: number) => TimeFormatter.format(hours),
  };
}

// 使用
function DashboardScreen() {
  const { calculateTimeCost, formatTimeCost } = useFinance(userData);
  const timeCost = calculateTimeCost(amount, isRecurring);
  const formatted = formatTimeCost(timeCost);
  // ...
}
```

**要建立的 Hooks：**
- [ ] `useFinance` - 財務計算
- [ ] `useRecords` - 記錄管理（CRUD）
- [ ] `useSettings` - 設定管理
- [ ] `useSync` - 雲端同步
- [ ] `useGPS` - GPS 計算
- [ ] `useProgressive` - 漸進式揭露邏輯

**檢查點：**
- [ ] 每個 Hook 都有完整的 TypeScript 類型
- [ ] 每個 Hook 都有單元測試（使用 `renderHook`）
- [ ] Hook 之間的依賴關係清晰
- [ ] 文檔化 Hook 的用法

**驗收標準：**
- ✅ 所有 Hook 測試通過
- ✅ 組件中的業務邏輯減少 70%+
- ✅ Hook 可以在多個組件中復用

### 8.2 Task 3.2: 狀態管理重構

**目標**：統一狀態管理方式

**狀態分類：**

```typescript
// src/layers/3-business/state/

// 1. Server State (使用 React Query)
export function useRecordsQuery() {
  return useQuery({
    queryKey: ['records'],
    queryFn: async () => {
      const api = new GoogleSheetsAPI();
      return api.getRecords();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 2. Global State (使用 Context + Reducer)
interface GlobalState {
  userData: UserData | null;
  theme: Theme;
  currentScreen: Screen;
}

type Action =
  | { type: 'SET_USER_DATA'; payload: UserData }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'NAVIGATE'; payload: Screen };

function globalReducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'SET_USER_DATA':
      return { ...state, userData: action.payload };
    // ...
  }
}

export function GlobalStateProvider({ children }) {
  const [state, dispatch] = useReducer(globalReducer, initialState);
  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// 3. Local State (使用 useState)
// 保留在組件內部，不需要特別處理
```

**檢查點：**
- [ ] 安裝並配置 React Query / SWR
- [ ] 建立 Global State Context
- [ ] 定義所有 Action Types
- [ ] 撰寫 Reducer 函數
- [ ] 建立 `useGlobalState` Hook
- [ ] 遷移現有的狀態管理邏輯

**驗收標準：**
- ✅ 所有服務端數據通過 React Query 管理
- ✅ 全局狀態通過 Context 管理
- ✅ 組件中的 `useState` 減少 50%+

### 8.3 Task 3.3: 表單驗證統一

**目標**：建立可復用的表單驗證系統

**驗證器設計：**
```typescript
// src/layers/3-business/validators/

export class Validator<T> {
  constructor(private rules: ValidationRule<T>[]) {}

  validate(value: T): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      const result = rule(value);
      if (!result.valid) {
        errors.push(result.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// 預定義的規則
export const Rules = {
  required: (message = '此欄位必填') => (value: any) => ({
    valid: value != null && value !== '',
    message,
  }),

  min: (min: number, message?: string) => (value: number) => ({
    valid: value >= min,
    message: message || `最小值為 ${min}`,
  }),

  age: () => Rules.min(18, '年齡至少18歲'),
};

// 使用
const ageValidator = new Validator([
  Rules.required(),
  Rules.age(),
]);

const result = ageValidator.validate(userInput);
if (!result.valid) {
  console.error(result.errors);
}
```

**要建立的驗證器：**
- [ ] `AgeValidator` - 年齡驗證
- [ ] `SalaryValidator` - 薪水驗證
- [ ] `RetirementAgeValidator` - 退休年齡驗證
- [ ] `AmountValidator` - 金額驗證

**檢查點：**
- [ ] 建立 Validator 基類
- [ ] 定義常用的 ValidationRule
- [ ] 撰寫各類驗證器
- [ ] 單元測試（各種邊界情況）

**驗收標準：**
- ✅ 所有表單使用統一的驗證器
- ✅ 驗證邏輯可復用
- ✅ 錯誤訊息統一且清晰

---

## 9. Phase 4: Layer 4 重構（3 週）

**目標**：建立組件化的 UI 層

### 9.1 Task 4.1: 建立原子組件庫

**目標**：建立 20-30 個基礎組件

**Atomic Design 實踐：**

```
src/layers/4-ui/design-system/atoms/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.stories.tsx (Storybook)
│   └── Button.module.css
├── Input/
├── Badge/
├── Icon/
└── ...
```

**Button 組件範例：**
```typescript
// Button.tsx
import { resolveToken } from '@ui/design-system/tokens';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}: ButtonProps) {
  const styles = {
    backgroundColor: resolveToken(`components.button.${variant}`),
    padding: resolveToken(`spacing.${size}`),
  };

  return (
    <button style={styles} onClick={onClick}>
      {children}
    </button>
  );
}
```

**要建立的原子組件：**
- [ ] Button (主要、次要、幽靈、危險)
- [ ] Input (文字、數字、滑桿)
- [ ] Badge (狀態標籤)
- [ ] Icon (統一的圖示系統)
- [ ] Text (不同層級的文字)
- [ ] Card (卡片容器)
- [ ] Divider (分隔線)
- [ ] Spinner (載入動畫)
- [ ] Avatar (頭像)
- [ ] Checkbox / Radio / Switch

**檢查點：**
- [ ] 每個組件都有 TypeScript 類型
- [ ] 每個組件都有快照測試
- [ ] 每個組件都有 Storybook 文檔（可選）
- [ ] 所有樣式使用 Design Tokens
- [ ] 支援 dark mode（透過 theme）
- [ ] 無障礙支援（ARIA 標籤）

**驗收標準：**
- ✅ 至少 20 個原子組件完成
- ✅ 所有組件通過快照測試
- ✅ Storybook 可以查看所有組件

### 9.2 Task 4.2: 建立分子組件

**目標**：組合原子組件為功能性單元

**要建立的分子組件：**
- [ ] FormField (Input + Label + Error)
  ```typescript
  <FormField
    label="月薪"
    error={errors.salary}
  >
    <Input type="number" value={salary} onChange={setSalary} />
  </FormField>
  ```
- [ ] Modal (遮罩 + 內容 + 關閉按鈕)
- [ ] Collapsible (可展開/收合區塊)
- [ ] Toast (通知提示)
- [ ] ProgressBar (進度條)
- [ ] StatCard (統計卡片)
- [ ] ActionSheet (底部操作列)

**檢查點：**
- [ ] 組件可組合性測試
- [ ] 組件狀態管理測試
- [ ] 無障礙測試

**驗收標準：**
- ✅ 至少 15 個分子組件完成
- ✅ 可以靈活組合原子組件
- ✅ 符合 UI/UX 規範

### 9.3 Task 4.3: 建立功能組件

**目標**：建立業務相關的組件

**要建立的功能組件：**
```
src/layers/4-ui/features/
├── retirement-progress/
│   ├── RetirementProgress.tsx      # 主組件
│   ├── ProgressBar.tsx             # 進度條
│   ├── StatusBadge.tsx             # 狀態標籤
│   ├── DetailModal.tsx             # 詳情彈窗
│   └── index.ts
├── amount-input/
│   ├── AmountInput.tsx
│   ├── QuickAmounts.tsx
│   └── RecurringToggle.tsx
├── time-cost-display/
├── decision-buttons/
├── quick-actions/
└── daily-challenge/
```

**RetirementProgress 範例：**
```typescript
// retirement-progress/RetirementProgress.tsx

interface RetirementProgressProps {
  targetAge: number;
  estimatedAge: number;
  onDetailClick?: () => void;
}

export function RetirementProgress({
  targetAge,
  estimatedAge,
  onDetailClick,
}: RetirementProgressProps) {
  const status = useProgressStatus(targetAge, estimatedAge);
  const { icon, color, label } = useStatusConfig(status);

  return (
    <div className="retirement-progress">
      <ProgressBar
        targetAge={targetAge}
        estimatedAge={estimatedAge}
        color={color}
      />
      <StatusBadge
        icon={icon}
        label={label}
        onClick={onDetailClick}
      />
    </div>
  );
}
```

**檢查點：**
- [ ] 組件使用 Hooks 處理業務邏輯
- [ ] 組件只負責展示，不包含計算邏輯
- [ ] 組件可以獨立測試
- [ ] 組件有清晰的 Props 接口

**驗收標準：**
- ✅ 所有功能組件完成
- ✅ 組件之間低耦合
- ✅ 測試覆蓋率 > 70%

### 9.4 Task 4.4: 建立頁面組件

**目標**：組裝功能組件為完整頁面

**頁面組件結構：**
```typescript
// src/layers/4-ui/pages/HomePage/HomePage.tsx

export function HomePage() {
  // 使用 Hooks 獲取數據和邏輯
  const { userData } = useGlobalState();
  const { calculateTimeCost, formatTimeCost } = useFinance(userData);
  const { addRecord } = useRecords();

  // 本地狀態（UI 相關）
  const [amount, setAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // 事件處理
  const handleBought = async () => {
    await addRecord({
      type: 'spend',
      amount,
      // ...
    });
  };

  // 渲染（只組合功能組件）
  return (
    <MainLayout>
      <RetirementProgress {...gpsData} />
      <AmountInput value={amount} onChange={setAmount} />
      <TimeCostDisplay cost={calculateTimeCost(amount)} />
      <DecisionButtons onBought={handleBought} onSkipped={handleSkipped} />
    </MainLayout>
  );
}
```

**要建立的頁面：**
- [ ] HomePage (主畫面)
- [ ] HistoryPage (歷史頁面)
- [ ] SettingsPage (設定頁面)
- [ ] OnboardingPage (引導頁面)

**檢查點：**
- [ ] 頁面組件只負責組合，不包含業務邏輯
- [ ] 頁面組件使用 Hooks 獲取數據
- [ ] 頁面組件可以獨立渲染（用於測試）
- [ ] E2E 測試覆蓋主要流程

**驗收標準：**
- ✅ 所有頁面完成
- ✅ E2E 測試通過（關鍵流程）
- ✅ 頁面載入速度 < 2 秒

---

## 10. Phase 5: 整合與優化（1.5 週）

**目標**：整合所有層次，優化性能

### 10.1 Task 5.1: 漸進式遷移

**策略**：新舊系統共存，逐步切換

**Feature Flag 實作：**
```typescript
// src/config/featureFlags.ts

export const FeatureFlags = {
  useNewHomePage: process.env.VITE_NEW_HOME === 'true',
  useNewSettingsPage: process.env.VITE_NEW_SETTINGS === 'true',
  useNewHistoryPage: process.env.VITE_NEW_HISTORY === 'true',
};

// App.tsx
function App() {
  return (
    <>
      {FeatureFlags.useNewHomePage ? (
        <NewHomePage />
      ) : (
        <OldDashboardScreen />
      )}
    </>
  );
}
```

**遷移步驟：**
1. **Week 1**: 切換 20% 用戶到新版
2. **Week 2**: 如果無重大問題，切換 50%
3. **Week 3**: 切換 100%，移除舊代碼

**檢查點：**
- [ ] Feature Flag 系統就緒
- [ ] 新舊版本數據兼容
- [ ] A/B 測試指標收集
- [ ] 回滾計劃就緒

**驗收標準：**
- ✅ 可以透過環境變數切換新舊版本
- ✅ 新舊版本共存無衝突
- ✅ 關鍵指標無下降

### 10.2 Task 5.2: 性能優化

**優化目標：**
- 首屏載入時間 < 2 秒
- 輸入反應時間 < 100ms
- 頁面切換動畫 60fps

**優化策略：**

**1. 代碼分割（Code Splitting）**
```typescript
// 路由級別分割
const HomePage = lazy(() => import('@ui/pages/HomePage'));
const HistoryPage = lazy(() => import('@ui/pages/HistoryPage'));
const SettingsPage = lazy(() => import('@ui/pages/SettingsPage'));

// 組件級別分割（大型組件）
const Chart = lazy(() => import('@ui/features/chart/CategoryPieChart'));
```

**2. 組件優化**
```typescript
// 使用 memo 避免不必要的重渲染
export const ExpensiveComponent = memo(({ data }) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});

// 使用 useMemo 緩存計算結果
const timeCost = useMemo(() => {
  return calculateTimeCost(amount, isRecurring);
}, [amount, isRecurring]);

// 使用 useCallback 緩存函數
const handleSubmit = useCallback(() => {
  addRecord(record);
}, [record]);
```

**3. 資源優化**
```typescript
// 圖片優化（使用 WebP）
<img
  src="/images/logo.webp"
  alt="TimeBar"
  loading="lazy"
  width={200}
  height={100}
/>

// 字體優化（只載入需要的字重）
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

**檢查點：**
- [ ] 使用 Lighthouse 檢測性能
- [ ] Bundle Size < 200KB (gzipped)
- [ ] 首屏載入 < 2s (3G 網路)
- [ ] Time to Interactive < 3s

**驗收標準：**
- ✅ Lighthouse Score > 90
- ✅ 所有性能指標達標
- ✅ 無性能回歸（與舊版比較）

### 10.3 Task 5.3: E2E 測試完善

**E2E 測試場景：**

```typescript
// tests/e2e/onboarding.spec.ts

test('新用戶完整流程', async ({ page }) => {
  // 1. 訪問應用
  await page.goto('http://localhost:5173/timebar/');

  // 2. 看到 Onboarding
  await expect(page.locator('h1')).toContainText('你幾歲');

  // 3. 填寫資料
  await page.locator('input[type="range"]').fill('30');
  await page.locator('button:has-text("下一步")').click();

  await page.locator('input[type="number"]').fill('50000');
  await page.locator('button:has-text("下一步")').click();

  await page.locator('input[type="range"]').fill('65');
  await page.locator('button:has-text("完成")').click();

  // 4. 進入主畫面
  await expect(page.locator('.retirement-progress')).toBeVisible();

  // 5. 記錄一筆消費
  await page.locator('input[placeholder*="金額"]').fill('500');
  await expect(page.locator('.time-cost')).toContainText('天');
  await page.locator('button:has-text("我買了")').click();

  // 6. 驗證記錄成功
  await expect(page.locator('.toast')).toContainText('已記錄');

  // 截圖（視覺回歸測試）
  await page.screenshot({ path: 'screenshots/onboarding-complete.png' });
});
```

**要測試的流程：**
- [ ] 新用戶 Onboarding
- [ ] 記錄消費
- [ ] 記錄儲蓄
- [ ] 查看歷史
- [ ] 修改設定
- [ ] 雲端同步

**檢查點：**
- [ ] 所有關鍵流程有 E2E 測試
- [ ] 測試穩定（無 flaky tests）
- [ ] CI 可以自動運行 E2E 測試

**驗收標準：**
- ✅ E2E 測試覆蓋 80% 關鍵流程
- ✅ 所有測試通過
- ✅ CI 通過率 > 95%

---

## 11. Phase 6: 文檔與交付（1 週）

**目標**：完善文檔，準備上線

### 11.1 Task 6.1: 技術文檔

**要撰寫的文檔：**

**1. 架構文檔**
```markdown
# TimeBar 架構文檔

## 目錄結構
[詳細說明四層架構]

## 設計原則
[關注點分離、依賴規則]

## 數據流
[從用戶操作到資料存儲的完整流程]

## 組件化設計
[Atomic Design 實踐]

## 測試策略
[單元測試、集成測試、E2E測試]
```

**2. API 文檔**
```markdown
# Layer 2 API 文檔

## FinanceCalculator

### calculateTimeCost

**描述**: 計算金額的時間成本

**參數**:
- `amount: number` - 金額
- `isRecurring: boolean` - 是否為週期性支出
- ...

**返回**: `number` - 時間成本（小時）

**範例**:
\`\`\`typescript
const timeCost = FinanceCalculator.calculateTimeCost({
  amount: 5000,
  isRecurring: false,
  hourlyRate: 500,
  realRate: 0.0341,
  yearsToRetire: 35,
});
// → 31.2 小時
\`\`\`
```

**3. 組件文檔**
```markdown
# Button 組件

## 用法

\`\`\`tsx
import { Button } from '@ui/design-system/atoms/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  點擊我
</Button>
\`\`\`

## Props

| 屬性 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| variant | 'primary' \| 'secondary' \| 'ghost' | 'primary' | 按鈕樣式 |
| size | 'sm' \| 'md' \| 'lg' | 'md' | 按鈕尺寸 |
| ...
```

**4. 貢獻指南**
```markdown
# 貢獻指南

## 開發流程

1. Fork 專案
2. 創建分支: `git checkout -b feature/my-feature`
3. 開發並測試
4. 提交 PR

## 代碼規範

- 使用 ESLint 規則
- 所有新功能需要測試
- 遵循四層架構

## 測試要求

- 單元測試覆蓋率 > 80%
- 所有 E2E 測試通過
```

**檢查點：**
- [ ] 架構文檔完成
- [ ] API 文檔完成
- [ ] 組件文檔完成
- [ ] 貢獻指南完成
- [ ] 所有文檔審核通過

### 11.2 Task 6.2: 遷移指南

**為現有用戶撰寫升級指南：**

```markdown
# TimeBar v4.0 升級指南

## 破壞性變更

### 1. 免罪卡功能移除

**原因**: 使用率低（< 5%），概念難懂

**影響**: 現有免罪卡數據會被保留但不顯示

**替代方案**: 無（可在專家模式中恢復）

### 2. 3-mode 計算機簡化

**原因**: 只有「依年齡」模式被使用（> 90%）

**影響**: 「依金額」和「依生活品質」模式隱藏

**替代方案**: 在專家模式中恢復

## 新功能

### 1. 漸進式揭露

新用戶首次使用時，只會看到核心功能。進階功能會根據使用天數自動解鎖。

### 2. 新的退休進度條

替換原有的 Life Battery，更直觀地顯示領先/落後狀態。

## 數據遷移

所有數據會自動遷移，無需手動操作。如果遇到問題，請聯繫支援。

## 專家模式

如果您習慣舊版的所有功能，可以開啟「專家模式」：

設定 > 進階設定 > 啟用專家模式

## 常見問題

**Q: 我的記錄會不會丟失？**
A: 不會，所有記錄都會完整保留。

**Q: 可以回到舊版嗎？**
A: 可以，我們會保留舊版2週。
```

**檢查點：**
- [ ] 列出所有破壞性變更
- [ ] 說明數據遷移策略
- [ ] 提供回滾方案
- [ ] FAQ 涵蓋常見問題

### 11.3 Task 6.3: 上線檢查清單

**上線前檢查：**

**功能檢查：**
- [ ] 所有 Phase 1-5 的任務完成
- [ ] 所有測試通過（單元 + 集成 + E2E）
- [ ] 測試覆蓋率 > 80%
- [ ] Lighthouse Score > 90
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 錯誤

**數據檢查：**
- [ ] 數據遷移測試通過
- [ ] 舊版數據可以正常讀取
- [ ] 雲端同步正常

**性能檢查：**
- [ ] 首屏載入 < 2s
- [ ] Bundle Size < 200KB
- [ ] 無內存洩漏

**安全檢查：**
- [ ] 無敏感資訊洩漏
- [ ] API Key 安全存儲
- [ ] HTTPS 正常運作

**文檔檢查：**
- [ ] README 更新
- [ ] CHANGELOG 撰寫
- [ ] 升級指南完成

**備份檢查：**
- [ ] 舊版代碼已標記 tag
- [ ] 數據庫備份
- [ ] 回滾計劃就緒

**監控檢查：**
- [ ] 錯誤監控（Sentry / LogRocket）
- [ ] 性能監控（Google Analytics）
- [ ] 用戶反饋渠道

**驗收標準：**
- ✅ 所有檢查項通過
- ✅ 團隊審核通過
- ✅ 準備上線

---

## 第三部分：維護與擴展

## 12. 維護性保障

### 12.1 代碼質量控制

**自動化檢查：**
```yaml
# .github/workflows/quality.yml

name: Code Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # TypeScript 類型檢查
      - name: Type Check
        run: npm run type-check

      # ESLint 檢查
      - name: Lint
        run: npm run lint

      # 測試
      - name: Test
        run: npm test -- --coverage

      # 檢查測試覆蓋率
      - name: Coverage Check
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
```

**Pre-commit Hook：**
```bash
# .husky/pre-commit

#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 檢查格式
npm run format:check

# 檢查類型
npm run type-check

# 運行測試
npm test -- --run --changed
```

### 12.2 依賴規則檢查

**使用 ESLint 強制執行架構規則：**
```javascript
// .eslintrc.js

module.exports = {
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Layer 4 不能引用 Layer 2
          {
            target: './src/layers/4-ui',
            from: './src/layers/2-domain',
            message: 'UI layer cannot directly import from Domain layer. Use Business layer instead.',
          },
          // Layer 3 不能引用 Layer 1
          {
            target: './src/layers/3-business',
            from: './src/layers/1-data',
            message: 'Business layer cannot directly import from Data layer. Use Domain layer instead.',
          },
          // Domain 層不能引用 React
          {
            target: './src/layers/2-domain',
            from: 'react',
            message: 'Domain layer must be framework-agnostic.',
          },
        ],
      },
    ],
  },
};
```

### 12.3 版本管理策略

**語意化版本控制：**
- **Major (x.0.0)**: 破壞性變更（架構重構、API 變更）
- **Minor (0.x.0)**: 新功能（新組件、新 Hook）
- **Patch (0.0.x)**: Bug 修復、小優化

**發布流程：**
```bash
# 1. 創建 release 分支
git checkout -b release/v4.0.0

# 2. 更新版本號
npm version major  # or minor, patch

# 3. 撰寫 CHANGELOG
# 列出所有變更

# 4. 建置
npm run build

# 5. 測試
npm test

# 6. 標記版本
git tag v4.0.0

# 7. 合併到 main
git checkout main
git merge release/v4.0.0

# 8. 推送
git push origin main --tags

# 9. 部署
npm run deploy
```

---

## 13. 擴展性設計

### 13.1 添加新組件

**標準流程：**

```bash
# 1. 使用腳手架工具生成組件
npm run generate:component MyNewComponent

# 這會生成：
# src/layers/4-ui/design-system/atoms/MyNewComponent/
# ├── MyNewComponent.tsx
# ├── MyNewComponent.test.tsx
# ├── MyNewComponent.stories.tsx
# └── index.ts

# 2. 實作組件
# - 使用 Design Tokens
# - 遵循 Atomic Design
# - 編寫測試

# 3. 在 Storybook 中查看
npm run storybook

# 4. 運行測試
npm test MyNewComponent

# 5. 提交 PR
git commit -m "feat: add MyNewComponent"
```

### 13.2 添加新功能

**範例：添加「每週報告」功能**

```
1. Domain Layer (Layer 2)
   └─ 新增 WeeklyReportCalculator
      - calculateWeeklyStats()
      - generateInsights()

2. Business Layer (Layer 3)
   └─ 新增 useWeeklyReport Hook
      - 使用 WeeklyReportCalculator
      - 處理數據格式化

3. UI Layer (Layer 4)
   └─ 新增 WeeklyReport 功能組件
      - 使用 useWeeklyReport
      - 組合現有的 atoms/molecules

4. Page Layer (Layer 4)
   └─ 將 WeeklyReport 加入 HistoryPage
```

**檢查清單：**
- [ ] 所有層次都有對應的實作
- [ ] 遵循依賴規則
- [ ] 有完整的測試
- [ ] 有文檔說明
- [ ] 通過 Code Review

### 13.3 更換 UI 框架

**如果未來要從 React 遷移到其他框架：**

**不需要改動：**
- ✅ Layer 1 (Data) - 純 TypeScript
- ✅ Layer 2 (Domain) - 純 TypeScript
- ✅ Design Tokens - 配置文件

**需要改動：**
- ❌ Layer 3 (Business) - React Hooks → 其他框架的狀態管理
- ❌ Layer 4 (UI) - React 組件 → 其他框架的組件

**遷移成本評估：**
- Layer 1-2: 0% 改動
- Layer 3: 30% 改動（Hook 邏輯需重寫）
- Layer 4: 80% 改動（組件需重寫，但 tokens 可復用）

**總體遷移成本：~40%**（相比原架構的 90%+）

### 13.4 更換設計風格

**如果要換成全新的視覺設計：**

**只需改動 Design Tokens：**
```typescript
// 舊的 tokens
export const ColorTokens = {
  primary: '#10b981',  // emerald
  // ...
};

// 新的 tokens
export const ColorTokens = {
  primary: '#3b82f6',  // blue
  // ...
};
```

**組件代碼無需改動：**
```typescript
// 這段代碼不用改
<Button variant="primary">點擊</Button>
// 因為它使用 resolveToken('components.button.primary')
// 會自動使用新的顏色
```

**改動評估：**
- 修改 tokens: 1 天
- 測試視覺效果: 2 天
- 總計: 3 天

---

## 14. 風險管理

### 14.1 技術風險

| 風險 | 影響 | 概率 | 緩解策略 |
|------|------|------|----------|
| **性能回歸** | 高 | 中 | Lighthouse CI 自動檢測、性能預算 |
| **測試不足** | 高 | 中 | 強制 80% 覆蓋率、PR 必須包含測試 |
| **架構違規** | 中 | 中 | ESLint 規則強制執行 |
| **依賴衝突** | 低 | 低 | 使用 Renovate 自動更新依賴 |

### 14.2 業務風險

| 風險 | 影響 | 概率 | 緩解策略 |
|------|------|------|----------|
| **用戶不適應** | 高 | 中 | A/B 測試、Feature Flag、經典模式 |
| **數據丟失** | 極高 | 極低 | 自動備份、數據遷移測試、回滾計劃 |
| **功能缺失** | 中 | 低 | 專家模式保留所有功能 |
| **開發延期** | 中 | 中 | 分階段上線、MVP 優先 |

### 14.3 回滾計劃

**如果新版本出現嚴重問題：**

```bash
# 1. 立即切換 Feature Flag
VITE_NEW_UI=false

# 2. 回滾到上一個穩定版本
git revert HEAD
git push origin main

# 3. 重新部署
npm run deploy

# 4. 通知用戶
# 顯示 Toast: "我們暫時回到經典介面以修正問題"

# 5. 分析問題
# 收集錯誤日誌、用戶反饋

# 6. 修復並重新上線
```

**預計回滾時間：< 15 分鐘**

---

## 15. 成功標準

### 15.1 技術指標

**架構指標：**
- ✅ 四層架構清晰分離
- ✅ 組件復用率 > 60%
- ✅ 測試覆蓋率 > 80%
- ✅ ESLint 無錯誤
- ✅ TypeScript 無錯誤

**性能指標：**
- ✅ Lighthouse Score > 90
- ✅ 首屏載入 < 2s
- ✅ Bundle Size < 200KB
- ✅ Time to Interactive < 3s

**質量指標：**
- ✅ 無 P0 Bug
- ✅ P1 Bug < 5 個
- ✅ 技術債務減少 70%

### 15.2 業務指標

**用戶體驗：**
- ✅ 新用戶首次記帳 < 30 秒
- ✅ 7 天留存率 > 40%
- ✅ NPS > 30
- ✅ 易用性評分 > 4.0/5.0

**開發效率：**
- ✅ 新功能開發時間減少 50%
- ✅ Bug 修復時間減少 60%
- ✅ UI 修改時間減少 80%

### 15.3 維護性指標

**可維護性：**
- ✅ 新成員上手時間 < 3 天
- ✅ 代碼審查時間 < 30 分鐘
- ✅ 文檔完整度 > 90%

**可擴展性：**
- ✅ 添加新組件 < 1 小時
- ✅ 添加新功能 < 1 天
- ✅ 更換設計風格 < 3 天

---

## 16. Timeline 總覽

```
Phase 0: 準備階段 (1週)
├─ 建立目錄結構
├─ Design Tokens
└─ 測試基礎設施

Phase 1: Layer 2 重構 (2週)
├─ 提取計算引擎
├─ 重構系統服務
└─ 統一類型定義

Phase 2: Layer 1 重構 (1.5週)
├─ 抽象化存儲層
├─ 抽象化 API 層
└─ 數據遷移系統

Phase 3: Layer 3 重構 (2週)
├─ 建立 Custom Hooks
├─ 狀態管理重構
└─ 表單驗證統一

Phase 4: Layer 4 重構 (3週)
├─ 原子組件庫 (1週)
├─ 分子組件 (0.5週)
├─ 功能組件 (1週)
└─ 頁面組件 (0.5週)

Phase 5: 整合與優化 (1.5週)
├─ 漸進式遷移
├─ 性能優化
└─ E2E 測試完善

Phase 6: 文檔與交付 (1週)
├─ 技術文檔
├─ 遷移指南
└─ 上線檢查

總計：12 週 (約 3 個月)
```

---

## 17. 附錄

### 17.1 腳手架工具

**自動生成組件：**
```bash
# scripts/generate-component.js

const componentName = process.argv[2];
const componentType = process.argv[3]; // atom, molecule, organism, feature

// 生成目錄
// 生成模板文件
// 更新 index.ts
```

### 17.2 開發工具推薦

**必備工具：**
- VS Code
- ESLint Plugin
- Prettier Plugin
- TypeScript Plugin

**推薦工具：**
- Storybook (組件開發)
- React DevTools (調試)
- Redux DevTools (狀態調試)
- Lighthouse (性能測試)
- Playwright (E2E 測試)

### 17.3 參考資源

**架構設計：**
- Clean Architecture (Robert C. Martin)
- Atomic Design (Brad Frost)
- Design Tokens (W3C Community Group)

**測試策略：**
- Testing Library Best Practices
- Jest / Vitest Documentation
- Playwright Documentation

**性能優化：**
- Web Vitals
- React Performance Optimization
- Code Splitting Best Practices

---

## 結語

這份重構計劃的核心目標是建立一個**長期可維護、易於擴展**的架構體系。透過：

1. **四層架構** - 關注點清晰分離
2. **Design Tokens** - UI 修改只需調整配置
3. **組件化設計** - 高復用率、低耦合
4. **測試優先** - 每層都有對應測試策略
5. **漸進式遷移** - 新舊系統共存，零停機

我們不僅完成了 UI/UX 改版，更重要的是建立了一個：
- **易於理解**的代碼結構（新成員 3 天上手）
- **易於測試**的純函數設計（80% 覆蓋率）
- **易於修改**的設計系統（UI 改版 3 天完成）
- **易於擴展**的組件體系（新功能 1 天開發）

**準備好開始重構了嗎？讓我們建立一個可以持續演進 5 年以上的架構！** 🚀
