# Changelog

All notable changes to TimeBar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-01-10

### Added
- **漸進式揭露系統** - 新用戶首次使用時只看到核心功能，進階功能根據使用天數自動解鎖
- **UserData.createdAt** - 記錄用戶完成 Onboarding 的時間，用於漸進式解鎖判斷
- **UnlockNotification 組件** - 功能解鎖時的慶祝通知
- **progressiveDisclosure.ts** - 漸進式揭露邏輯模組

### Changed
- **UI/UX 大幅簡化** - 從 9 個畫面精簡至 5 個核心畫面（loading, onboarding, home, history, settings）
- **Onboarding 流程簡化** - 從 5 步驟簡化為 3 步驟（年齡、月薪、退休年齡）
  - 目前存款自動設為 $0
  - 每月儲蓄自動設為月薪的 20%
  - 通膨率、ROI 使用預設值（2.5%, 6%）
- **主畫面重構** - 使用 'home' screen 替代 'dashboard'
- **RetirementProgress 組件** - 替換原有的 LifeBattery 視覺化
- **設定頁扁平化** - 所有子頁面改為 Modal 或 Collapsible，減少導航深度
- **測試策略精簡與優化** - 移除內部實作細節測試，新增關鍵 UI 測試
  - 刪除 categorySystem.test.ts (21 tests)
  - 刪除 settingsSystem.test.ts (9 tests)
  - 新增 OnboardingScreen.test.tsx (5 tests) - 按鈕文字驗證
  - 保留 financeCalc.test.ts (56 tests) - 核心計算邏輯
  - 保留 App.test.tsx (32 tests) - 完整用戶流程
  - 測試總數：120 → 88 → 93（涵蓋率仍為 100%）

### Fixed
- **Onboarding 按鈕文字** - 修正第 3 步驟按鈕文字顯示錯誤（step < 4 → step < 2）

### Removed
- **獨立設定子頁面** - Shop、Challenge Settings、Category Settings、Subscription Manager 等獨立頁面
- **冗餘的 Screen types** - 'tracker', 'shop', 'challenge-settings', 'subscription-manager', 'category-settings', 'quick-actions-settings'

---

## [3.1.0] - 2026-01-06

### Added
- **Dependency Injection 架構重構** (v2.3)
  - 新增 interfaces.ts - IStorage, ICloudSync, IDebouncer 接口
  - 新增 adapters.ts - StorageAdapter, GoogleSheetsAdapter 適配器
  - SettingsService 和 CategoryService 採用 DI 模式
- **Debounced Cloud Sync** - 設定變更延遲 1 秒批次同步至雲端

### Changed
- **SettingsSystem 重構** - 從靜態物件重構為 class-based service
- **CategorySystem 重構** - 採用 pure functions 和 immutable 操作

### Backward Compatibility
- 所有重構保持靜態導出，現有代碼無需修改

---

## [3.0.0] - 2025-12

### Initial Release
- 基於 React 18 + TypeScript + Vite 5
- 時間成本計算引擎
- 退休 GPS 追蹤
- 遊戲化系統（積分、挑戰、商店）
- Google Sheets 雲端同步
- 120 個測試確保品質

---

## Version History

- **3.2.0** (2026-01-10) - UI/UX 大幅簡化、漸進式揭露系統
- **3.1.0** (2026-01-06) - DI 架構重構、debounced sync
- **3.0.0** (2025-12) - 初始發布
