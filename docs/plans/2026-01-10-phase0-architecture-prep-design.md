# Phase 0: 架構準備 - 設計文檔

**日期**: 2026-01-10
**階段**: Phase 0（共6個階段）
**策略**: 漸進式並行（架構重構 + UI/UX改版）
**預計時間**: 3-5天
**風險等級**: 低（純增量，可隨時回退）

---

## 1. 目標與範圍

### 1.1 核心目標

Phase 0 的核心目標是建立新架構的骨架，但**不破壞現有功能**。這是一個純增量的階段，所有新代碼都是額外添加的，舊代碼保持運行。

### 1.2 完成後的成果

**您將擁有：**
1. 清晰的四層目錄結構（`src/layers/`）
2. 基礎的 Design Tokens 系統（約40-50個tokens）
3. TypeScript path aliases 配置（`@data/`, `@domain/`, `@business/`, `@ui/`）
4. ESLint 規則防止跨層引用
5. 優化後的 Vitest 配置

**不包含：**
- ❌ 不遷移任何現有代碼（舊代碼保持在 `src/components/`, `src/utils/` 等）
- ❌ 不改變任何現有功能
- ❌ 不設置 E2E 測試或 Storybook

### 1.3 設計決策

基於與開發者的討論，確認以下方向：

| 維度 | 選擇 | 理由 |
|------|------|------|
| **整體策略** | 漸進式並行（選項C） | 平衡用戶體驗和技術債務 |
| **團隊情況** | 個人開發 + 時間充裕（A+D） | 可追求高質量，每階段做扎實 |
| **起點** | Phase 0 架構準備 | 為後續所有工作打好基礎 |
| **設計系統** | 漸進式（選項C） | 核心tokens + resolver，按需擴展 |
| **測試策略** | 最小化設置（選項A） | 快速開始，降低初期複雜度 |

---

## 2. 目錄結構設計

### 2.1 新架構目錄

創建 `src/layers/` 目錄，與現有代碼**並存**：

```
src/
├── layers/                          # 新架構（逐步遷移到這裡）
│   ├── 1-data/                      # Layer 1: 數據層
│   │   ├── storage/
│   │   ├── api/
│   │   ├── adapters/
│   │   └── README.md
│   ├── 2-domain/                    # Layer 2: 領域層
│   │   ├── calculators/
│   │   ├── systems/
│   │   ├── utils/
│   │   ├── types/
│   │   └── README.md
│   ├── 3-business/                  # Layer 3: 業務層
│   │   ├── hooks/
│   │   ├── state/
│   │   ├── validators/
│   │   └── README.md
│   └── 4-ui/                        # Layer 4: UI層
│       ├── design-system/
│       │   ├── tokens/              # ✅ Phase 0 實現
│       │   │   ├── colors.ts
│       │   │   ├── spacing.ts
│       │   │   ├── typography.ts
│       │   │   ├── resolver.ts
│       │   │   └── index.ts
│       │   ├── atoms/               # 後續階段
│       │   └── molecules/           # 後續階段
│       ├── features/                # 後續階段
│       ├── pages/                   # 後續階段
│       └── README.md
│
├── components/                      # 現有代碼（保持不動）
├── utils/                          # 現有代碼（保持不動）
├── services/                       # 現有代碼（保持不動）
└── types/                          # 現有代碼（保持不動）
```

### 2.2 README 文檔

每個層級的 README.md 應說明：
- 該層的職責
- 允許的依賴關係
- 禁止的依賴關係
- 使用示例

**示例（2-domain/README.md）**：
```markdown
# Layer 2: Domain (領域層)

## 職責
- 純業務邏輯（計算引擎、系統服務）
- 類型定義和值對象
- 框架無關的工具函數

## 依賴規則
✅ 可以依賴：
- Layer 1 (Data)
- 標準庫（Math, Date等）

❌ 不能依賴：
- Layer 3 (Business)
- Layer 4 (UI)
- React 或任何UI框架

## 示例
見 calculators/FinanceCalculator.ts
```

---

## 3. Design Tokens 系統

### 3.1 設計原則

**漸進式策略**：
- 先建立核心 tokens（40-50個）
- 建立 token resolver 機制
- 後續根據需要逐步添加

### 3.2 Token 結構

#### 顏色系統（colors.ts）

```typescript
// src/layers/4-ui/design-system/tokens/colors.ts

export const ColorTokens = {
  // 核心顏色（從現有UI提取）
  primary: {
    DEFAULT: '#10b981',  // emerald-500（現有的主色）
    hover: '#059669',    // emerald-600
    active: '#047857',   // emerald-700
  },

  // 狀態顏色（GPS進度條使用）
  state: {
    ahead: {
      main: '#10b981',    // 綠色（領先）
      light: '#34d399',   // emerald-400
      dark: '#059669',    // emerald-600
    },
    onTrack: {
      main: '#3b82f6',    // 藍色（準時）
      light: '#60a5fa',   // blue-400
      dark: '#2563eb',    // blue-600
    },
    behind: {
      main: '#f97316',    // 橘色（落後）
      light: '#fb923c',   // orange-400
      dark: '#ea580c',    // orange-600
    },
  },

  // 中性色（背景、文字、邊框）
  neutral: {
    bg: {
      primary: '#1f2937',   // gray-800 - 主背景
      secondary: '#111827', // gray-900 - 次要背景
    },
    text: {
      primary: '#f9fafb',   // gray-50 - 主文字
      secondary: '#d1d5db', // gray-300 - 次要文字
    },
    border: '#374151',      // gray-700 - 邊框
  },

  // 語義化顏色
  semantic: {
    success: '#10b981',   // emerald-500
    warning: '#f59e0b',   // amber-500
    error: '#ef4444',     // red-500
    info: '#3b82f6',      // blue-500
  },
};
```

#### 間距系統（spacing.ts）

```typescript
// src/layers/4-ui/design-system/tokens/spacing.ts

export const SpacingTokens = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};
```

#### 字體系統（typography.ts）

```typescript
// src/layers/4-ui/design-system/tokens/typography.ts

export const TypographyTokens = {
  size: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px - 時間成本顯示用
  },

  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};
```

### 3.3 Token Resolver

核心機制，支持點記法引用：

```typescript
// src/layers/4-ui/design-system/tokens/resolver.ts

type TokenPath = string; // 例如 'colors.state.ahead.main'

/**
 * 解析 token 路徑為實際值
 * @param path - 點記法路徑，如 'colors.primary.DEFAULT'
 * @returns 解析後的值
 * @throws 如果路徑不存在
 */
export function resolveToken(path: TokenPath): string {
  const parts = path.split('.');
  let value: any = {
    colors: ColorTokens,
    spacing: SpacingTokens,
    typography: TypographyTokens
  };

  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      throw new Error(`Token not found: ${path}`);
    }
  }

  return value;
}

/**
 * 批量解析 tokens
 */
export function resolveTokens(paths: TokenPath[]): string[] {
  return paths.map(resolveToken);
}
```

### 3.4 統一導出

```typescript
// src/layers/4-ui/design-system/tokens/index.ts

export { ColorTokens } from './colors';
export { SpacingTokens } from './spacing';
export { TypographyTokens } from './typography';
export { resolveToken, resolveTokens } from './resolver';

// 便捷的組合導出
export const Tokens = {
  colors: ColorTokens,
  spacing: SpacingTokens,
  typography: TypographyTokens,
};
```

### 3.5 使用示例

```typescript
// 在組件中使用
import { resolveToken } from '@tokens';

const buttonStyle = {
  backgroundColor: resolveToken('colors.primary.DEFAULT'),
  padding: resolveToken('spacing.md'),
  fontSize: resolveToken('typography.size.base'),
};

// 或直接引用
import { ColorTokens } from '@tokens';

const statusColor = ColorTokens.state.ahead.main;
```

---

## 4. TypeScript 配置

### 4.1 Path Aliases

```json
// tsconfig.json（修改）

{
  "compilerOptions": {
    // ... 現有配置保持不變
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],              // 現有的alias（保持）
      "@data/*": ["./src/layers/1-data/*"],
      "@domain/*": ["./src/layers/2-domain/*"],
      "@business/*": ["./src/layers/3-business/*"],
      "@ui/*": ["./src/layers/4-ui/*"],
      "@tokens": ["./src/layers/4-ui/design-system/tokens"]
    }
  }
}
```

### 4.2 Vite 配置

```javascript
// vite.config.js（修改）

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/timebar/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/layers/1-data'),
      '@domain': path.resolve(__dirname, './src/layers/2-domain'),
      '@business': path.resolve(__dirname, './src/layers/3-business'),
      '@ui': path.resolve(__dirname, './src/layers/4-ui'),
      '@tokens': path.resolve(__dirname, './src/layers/4-ui/design-system/tokens'),
    },
  },
});
```

### 4.3 使用示例

```typescript
// 之前（相對路徑，容易出錯）
import { FinanceCalc } from '../../utils/financeCalc';
import { UserData } from '../../../types';

// 之後（絕對路徑，清晰明確）
import { FinanceCalculator } from '@domain/calculators/FinanceCalculator';
import { UserData } from '@domain/types/entities';
import { resolveToken } from '@tokens';
```

---

## 5. ESLint 架構規則

### 5.1 安裝依賴

```bash
npm install --save-dev eslint-plugin-import
```

### 5.2 配置規則

```javascript
// .eslintrc.cjs（修改或創建）

module.exports = {
  // ... 現有配置保持不變

  plugins: [
    // ... 現有插件
    'import',
  ],

  rules: {
    // ... 現有規則

    // 新增：架構層次依賴規則
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Layer 4 (UI) 不能直接引用 Layer 2 (Domain)
          {
            target: './src/layers/4-ui',
            from: './src/layers/2-domain',
            message: '❌ UI layer 不能直接引用 Domain layer。請通過 Business layer (Layer 3) 引用。',
          },

          // Layer 4 (UI) 不能直接引用 Layer 1 (Data)
          {
            target: './src/layers/4-ui',
            from: './src/layers/1-data',
            message: '❌ UI layer 不能直接引用 Data layer。請通過 Business layer (Layer 3) 引用。',
          },

          // Layer 3 (Business) 不能直接引用 Layer 1 (Data)
          {
            target: './src/layers/3-business',
            from: './src/layers/1-data',
            message: '❌ Business layer 不能直接引用 Data layer。請通過 Domain layer (Layer 2) 引用。',
          },

          // Layer 2 (Domain) 不能引用 React（保持框架無關）
          {
            target: './src/layers/2-domain',
            from: 'react',
            message: '❌ Domain layer 必須保持框架無關，不能引用 React。',
          },

          // Layer 2 (Domain) 不能引用上層
          {
            target: './src/layers/2-domain',
            from: './src/layers/3-business',
            message: '❌ Domain layer 不能引用 Business layer。依賴方向錯誤。',
          },
          {
            target: './src/layers/2-domain',
            from: './src/layers/4-ui',
            message: '❌ Domain layer 不能引用 UI layer。依賴方向錯誤。',
          },

          // Layer 1 (Data) 不能引用 React
          {
            target: './src/layers/1-data',
            from: 'react',
            message: '❌ Data layer 必須保持框架無關，不能引用 React。',
          },

          // Layer 1 (Data) 不能引用上層
          {
            target: './src/layers/1-data',
            from: './src/layers/2-domain',
            message: '❌ Data layer 不能引用 Domain layer。依賴方向錯誤。',
          },
          {
            target: './src/layers/1-data',
            from: './src/layers/3-business',
            message: '❌ Data layer 不能引用 Business layer。依賴方向錯誤。',
          },
          {
            target: './src/layers/1-data',
            from: './src/layers/4-ui',
            message: '❌ Data layer 不能引用 UI layer。依賴方向錯誤。',
          },
        ],
      },
    ],
  },
};
```

### 5.3 驗證方式

```bash
# 檢查架構規則
npm run lint

# 自動修復（如果可能）
npm run lint -- --fix
```

### 5.4 依賴規則圖示

```
┌─────────────┐
│  Layer 4    │
│  (UI)       │  ✅ 可引用 Layer 3
│             │  ❌ 不可引用 Layer 2, 1
│             │  ❌ 不可引用 React 之外的框架
└─────────────┘
       ↓ 只能向下依賴
┌─────────────┐
│  Layer 3    │
│  (Business) │  ✅ 可引用 Layer 2
│             │  ❌ 不可引用 Layer 1
│             │  ✅ 可引用 React (Hooks)
└─────────────┘
       ↓ 只能向下依賴
┌─────────────┐
│  Layer 2    │
│  (Domain)   │  ✅ 可引用 Layer 1
│             │  ❌ 不可引用 React
│             │  ✅ 純 TypeScript
└─────────────┘
       ↓ 只能向下依賴
┌─────────────┐
│  Layer 1    │
│  (Data)     │  ✅ 只依賴標準庫
│             │  ❌ 不可引用任何上層
│             │  ❌ 不可引用 React
└─────────────┘
```

---

## 6. 測試配置優化

### 6.1 Vitest 配置

```typescript
// vitest.config.ts（修改）

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',

    // 新增：覆蓋率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],

      // 只統計新架構的代碼
      include: ['src/layers/**/*.{ts,tsx}'],

      // 排除測試文件和類型定義
      exclude: [
        'src/layers/**/*.test.{ts,tsx}',
        'src/layers/**/*.spec.{ts,tsx}',
        'src/layers/**/types/**',
        'src/layers/**/index.ts',
        'src/layers/**/README.md',
      ],

      // 覆蓋率閾值（Phase 0較寬鬆，後續提高）
      thresholds: {
        lines: 60,        // 目標：80%，但Phase 0先設60%
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/layers/1-data'),
      '@domain': path.resolve(__dirname, './src/layers/2-domain'),
      '@business': path.resolve(__dirname, './src/layers/3-business'),
      '@ui': path.resolve(__dirname, './src/layers/4-ui'),
      '@tokens': path.resolve(__dirname, './src/layers/4-ui/design-system/tokens'),
    },
  },
});
```

### 6.2 測試工具函數

```typescript
// src/tests/helpers.ts（新建）

/**
 * Phase 0 基礎測試工具
 * 後續階段會擴展這個文件
 */

import type { UserData } from '@/types';

/**
 * 創建模擬的用戶數據
 */
export function createMockUserData(overrides?: Partial<UserData>): UserData {
  return {
    age: 30,
    salary: 50000,
    retireAge: 65,
    currentSavings: 0,
    monthlySavings: 10000,
    inflationRate: 2.5,
    roiRate: 6,
    points: 0,
    inventory: {
      guiltFreePass: 0,
    },
    challenges: [],
    ...overrides,
  };
}

// 後續階段會添加：
// - renderWithProviders (React Testing Library wrapper)
// - createMockRecord
// - createMockCategory
// - waitForSync
```

### 6.3 Package.json Scripts

```json
// package.json（修改）

{
  "scripts": {
    // ... 現有scripts保持不變

    // 新增：測試相關
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:layers": "vitest src/layers",

    // 新增：類型檢查
    "type-check": "tsc --noEmit",

    // 新增：完整檢查
    "check": "npm run type-check && npm run lint && npm test -- --run"
  }
}
```

---

## 7. 實施檢查清單

### 7.1 目錄結構

- [ ] 創建 `src/layers/` 根目錄
- [ ] 創建 `src/layers/1-data/` 及子目錄（storage, api, adapters）
- [ ] 創建 `src/layers/2-domain/` 及子目錄（calculators, systems, utils, types）
- [ ] 創建 `src/layers/3-business/` 及子目錄（hooks, state, validators）
- [ ] 創建 `src/layers/4-ui/` 及子目錄（design-system, features, pages）
- [ ] 創建 `src/layers/4-ui/design-system/tokens/` 目錄
- [ ] 為每個層級添加 README.md 說明文檔

### 7.2 Design Tokens

- [ ] 實現 `colors.ts`（ColorTokens）
- [ ] 實現 `spacing.ts`（SpacingTokens）
- [ ] 實現 `typography.ts`（TypographyTokens）
- [ ] 實現 `resolver.ts`（resolveToken 函數）
- [ ] 實現 `index.ts`（統一導出）
- [ ] 撰寫 tokens 使用文檔

### 7.3 TypeScript 配置

- [ ] 修改 `tsconfig.json` 添加 path aliases
- [ ] 修改 `vite.config.js` 添加 resolve.alias
- [ ] 驗證 path aliases 正常工作（`tsc --noEmit`）

### 7.4 ESLint 配置

- [ ] 安裝 `eslint-plugin-import`
- [ ] 修改 `.eslintrc.cjs` 添加架構規則
- [ ] 驗證規則生效（故意違反規則測試）
- [ ] 確保現有代碼不受影響

### 7.5 測試配置

- [ ] 修改 `vitest.config.ts` 添加覆蓋率配置
- [ ] 創建 `src/tests/helpers.ts` 工具函數
- [ ] 修改 `package.json` 添加測試 scripts
- [ ] 運行 `npm test` 確保現有測試通過
- [ ] 運行 `npm run test:coverage` 查看覆蓋率報告

### 7.6 文檔

- [ ] 確保每個層級都有 README.md
- [ ] 更新專案主 README.md 說明新架構
- [ ] 提交所有更改到 git

### 7.7 驗收測試

- [ ] 所有現有測試仍然通過
- [ ] `npm run type-check` 無錯誤
- [ ] `npm run lint` 無錯誤
- [ ] 可以成功引用 tokens（寫一個簡單測試）
- [ ] ESLint 規則可以捕獲違規（寫一個故意違規的代碼測試）

---

## 8. 成功標準

### 8.1 技術指標

- ✅ 四層目錄結構完整建立
- ✅ 40-50 個 Design Tokens 定義完成
- ✅ Token resolver 機制正常運作
- ✅ TypeScript path aliases 配置正確
- ✅ ESLint 規則可捕獲架構違規
- ✅ 所有現有測試通過
- ✅ 無 TypeScript 編譯錯誤
- ✅ 無 ESLint 錯誤

### 8.2 文檔指標

- ✅ 每個層級都有 README.md
- ✅ Tokens 有使用文檔和示例
- ✅ 架構規則有清晰說明

### 8.3 向後兼容

- ✅ 現有代碼無需修改仍可運行
- ✅ 現有測試全部通過
- ✅ 建置流程無變化
- ✅ 部署流程無變化

---

## 9. 風險與緩解

### 9.1 已識別風險

| 風險 | 影響 | 概率 | 緩解策略 |
|------|------|------|----------|
| **Path aliases 衝突** | 中 | 低 | 使用獨特的前綴（@data, @domain等），不與現有@衝突 |
| **ESLint 規則誤報** | 低 | 中 | 提供清晰的錯誤訊息，可在必要時用註釋禁用 |
| **Tokens 不夠用** | 低 | 中 | 設計為漸進式，可隨時添加新 tokens |
| **團隊不適應** | 低 | 低 | 個人開發，無團隊協作問題 |

### 9.2 回滾計劃

由於 Phase 0 是純增量的，回滾極其簡單：

```bash
# 刪除新增的 layers 目錄
rm -rf src/layers

# 恢復配置文件
git checkout tsconfig.json vite.config.js .eslintrc.cjs vitest.config.ts

# 完成
```

現有代碼不受影響，應用仍可正常運行。

---

## 10. 下一步

Phase 0 完成後，根據漸進式並行策略，下一步有兩個選擇：

### 選項A：Phase 1 - Layer 2 重構（架構優先）

開始提取純函數到 Domain Layer：
- 遷移 `financeCalc.ts` → `FinanceCalculator.ts`
- 遷移 `lifeCostCalc.ts` → `TimeCalculator.ts`
- 提取 `SettingsSystem` 為純類別

### 選項B：UI/UX Phase 1 - 主畫面重構（體驗優先）

開始改善用戶體驗：
- 激活 RetirementProgress 組件
- 合併 Dashboard 和 Tracker
- 創建 CategorySelectModal

**建議**：先做 UI/UX Phase 1，因為：
1. 可以立即看到視覺效果（動力）
2. RetirementProgress 可以用新的 Design Tokens（驗證架構）
3. 用戶體驗改善更明顯

---

## 11. 附錄

### 11.1 參考文檔

- REFACTORING-PLAN.md - 完整架構重構計劃
- UI-UX-ANALYSIS-AND-REDESIGN.md - UI/UX 改版計劃

### 11.2 相關決策記錄

- 2026-01-10: 選擇漸進式並行策略（選項C）
- 2026-01-10: 選擇漸進式設計系統（選項C）
- 2026-01-10: 選擇最小化測試設置（選項A）

### 11.3 Token 數量統計

| 類別 | 數量 |
|------|------|
| 顏色 | ~25 |
| 間距 | 7 |
| 字體大小 | 10 |
| 字體粗細 | 5 |
| 行高 | 3 |
| **總計** | **~50** |

---

**文檔狀態**: ✅ 完成
**審核狀態**: 待審核
**實施狀態**: 待開始
