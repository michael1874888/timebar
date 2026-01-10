# Layer 4: UI (UI 層)

## 職責

- React 組件（視覺呈現）
- Design System（Tokens, Atoms, Molecules, Organisms）
- 頁面和功能模組
- 用戶交互邏輯

## 依賴規則

✅ **可以依賴**：
- Layer 3 (Business) - 通過 Hooks 獲取業務邏輯
- React 和 UI 庫
- Design Tokens

❌ **不能依賴**：
- Layer 2 (Domain) - 必須通過 Business layer
- Layer 1 (Data) - 必須通過 Business layer

## 目錄結構

```
4-ui/
├── design-system/
│   ├── tokens/       # ✅ Phase 0 已完成
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   ├── resolver.ts
│   │   └── index.ts
│   ├── atoms/        # Phase 1-2: 基礎組件
│   └── molecules/    # Phase 1-2: 複合組件
├── features/         # Phase 2-3: 功能模組
├── pages/            # Phase 2-3: 頁面組件
└── README.md
```

## Design Tokens 使用

Phase 0 已完成基礎 Design Tokens 系統（~50 tokens）：

### 方式 1: 直接引用

```typescript
import { ColorTokens, SpacingTokens, TypographyTokens } from '@tokens';

const buttonStyle = {
  backgroundColor: ColorTokens.primary.DEFAULT,  // '#10b981'
  padding: SpacingTokens.md,                    // '1rem'
  fontSize: TypographyTokens.size.base,         // '1rem'
};
```

### 方式 2: 使用 Resolver

```typescript
import { resolveToken } from '@tokens';

const buttonStyle = {
  backgroundColor: resolveToken('colors.primary.DEFAULT'),
  padding: resolveToken('spacing.md'),
  fontSize: resolveToken('typography.size.base'),
};
```

### 方式 3: 組合導出

```typescript
import { Tokens } from '@tokens';

const statusColor = Tokens.colors.state.ahead.main;  // 綠色（領先）
```

## 設計原則

1. **Atomic Design**：從小到大構建組件
2. **Design Tokens**：使用 tokens 而非硬編碼值
3. **可組合性**：組件應該易於組合
4. **無業務邏輯**：所有業務邏輯通過 Hooks 獲取

## 未來遷移計劃

Phase 1-2 將會創建：
- **Atoms**: Button, Input, Card, Badge, Icon
- **Molecules**: InputGroup, CardHeader, StatusIndicator
- **Organisms**: RetirementProgress, TimeDisplay, RecordList
- **Features**: Dashboard, History, Settings
- **Pages**: HomePage, HistoryPage, SettingsPage
