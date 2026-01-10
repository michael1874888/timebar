# Layer 1: Data (數據層)

## 職責

- 數據持久化（LocalStorage, SessionStorage, IndexedDB）
- API 通信（Google Apps Script, REST APIs）
- 數據適配器（將外部數據轉換為內部格式）

## 依賴規則

✅ **可以依賴**：
- 標準庫（fetch, localStorage, sessionStorage）
- 外部 API SDK

❌ **不能依賴**：
- Layer 2 (Domain)
- Layer 3 (Business)
- Layer 4 (UI)
- React 或任何 UI 框架

## 目錄結構

```
1-data/
├── storage/       # 存儲適配器（LocalStorage, SessionStorage等）
├── api/          # API 客戶端（Google Sheets, 未來的後端）
├── adapters/     # 數據轉換適配器
└── README.md
```

## 設計原則

1. **框架無關**：不依賴任何 UI 框架
2. **接口導向**：通過接口定義行為（IStorage, ICloudSync）
3. **可替換性**：實現可以輕鬆替換（LocalStorage → IndexedDB）

## 示例

見現有代碼：
- `src/utils/adapters.ts` - StorageAdapter, GoogleSheetsAdapter
- `src/utils/interfaces.ts` - IStorage, ICloudSync 接口定義
