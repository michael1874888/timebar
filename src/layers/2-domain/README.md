# Layer 2: Domain (領域層)

## 職責

- 純業務邏輯（計算引擎、系統服務）
- 類型定義和值對象
- 框架無關的工具函數
- 核心業務規則

## 依賴規則

✅ **可以依賴**：
- Layer 1 (Data) - 通過接口（IStorage, ICloudSync）
- 標準庫（Math, Date 等）

❌ **不能依賴**：
- Layer 3 (Business)
- Layer 4 (UI)
- React 或任何 UI 框架

## 目錄結構

```
2-domain/
├── calculators/  # 計算引擎（財務計算、時間成本計算）
├── systems/      # 系統服務（設定系統、分類系統等）
├── utils/        # 純函數工具
├── types/        # TypeScript 類型定義
└── README.md
```

## 設計原則

1. **框架無關**：必須是純 TypeScript，不依賴 UI 框架
2. **純函數優先**：盡可能使用純函數
3. **單一職責**：每個模組只做一件事
4. **可測試性**：易於單元測試

## 示例

見現有代碼：
- `src/utils/financeCalc.ts` - 財務計算引擎
- `src/utils/settingsSystem.ts` - 設定系統服務
- `src/utils/categorySystem.ts` - 分類系統服務

## 未來遷移計劃

Phase 1 將會遷移以下代碼到此層：
- `financeCalc.ts` → `calculators/FinanceCalculator.ts`
- `lifeCostCalc.ts` → `calculators/TimeCalculator.ts`
- `settingsSystem.ts` → `systems/SettingsService.ts`
- `categorySystem.ts` → `systems/CategoryService.ts`
