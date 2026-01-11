# Layer 3: Business (業務層)

## 職責

- React Hooks（業務邏輯封裝）
- 狀態管理（Context, Zustand 等）
- 業務驗證器
- 複雜業務流程編排

## 依賴規則

✅ **可以依賴**：
- Layer 2 (Domain) - 調用計算器和系統服務
- React Hooks (useState, useEffect, useContext 等)

❌ **不能依賴**：
- Layer 1 (Data) - 必須通過 Domain layer 訪問
- Layer 4 (UI) - 依賴方向錯誤

## 目錄結構

```
3-business/
├── hooks/        # 自定義 React Hooks
├── state/        # 狀態管理（Context, stores）
├── validators/   # 業務驗證邏輯
└── README.md
```

## 設計原則

1. **關注點分離**：業務邏輯與 UI 分離
2. **可重用性**：Hooks 應該在多個組件中可重用
3. **單一職責**：每個 Hook 只做一件事
4. **依賴注入**：通過 Domain layer 訪問數據

## 示例使用

```typescript
// 未來的 Hook 示例
import { useRecords } from '@business/hooks/useRecords';
import { useRetirementCalculation } from '@business/hooks/useRetirementCalculation';

function DashboardScreen() {
  const { records, addRecord } = useRecords();
  const { retirementAge, daysAhead } = useRetirementCalculation();
  
  // UI logic here
}
```

## 未來遷移計劃

Phase 1-2 將會創建以下 Hooks：
- `useRecords` - 記錄管理
- `useSettings` - 設定管理
- `useCategories` - 分類管理
- `useRetirementCalculation` - 退休計算
- `useSync` - 雲端同步狀態
