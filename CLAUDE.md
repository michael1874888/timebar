# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TimeBar v4.2** - A financial tracking web app that converts spending into "retirement time cost" with gamification features. Helps users understand their spending in terms of delayed/advanced retirement days using the Goal Trajectory Deviation model.

- **Language**: Traditional Chinese (繁體中文) - all UI text, comments, and documentation
- **Stack**: React 18 + TypeScript + Vite 5
- **Testing**: Vitest with 140 tests (精簡測試策略 - focused testing strategy)
- **Backend**: Google Apps Script (optional cloud sync via Google Sheets)
- **Deployment**: GitHub Pages at `/timebar/` base path

## Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173/timebar/)
npm run build            # Production build to dist/
npm run preview          # Preview production build

# Testing
npm test                 # Run all 140 tests (5 test files)
npm test:watch           # Watch mode
npm test:ui              # Vitest UI
npm test:coverage        # Generate coverage report

# Running specific tests
npm test -- financeCalc            # Only financeCalc.test.ts (56 tests)
npm test -- App                    # Only App.test.tsx (32 tests)
npm test -- OnboardingScreen       # Only OnboardingScreen.test.tsx (5 tests)
npm test -- TrajectoryCalculator   # Only TrajectoryCalculator.test.ts (18 tests)
npm test -- progressiveDisclosure  # Only progressiveDisclosure.test.ts (29 tests)
```

## Architecture Overview

### v2.3 Dependency Injection Refactor

The codebase underwent a major architectural refactor in v2.3 to improve testability and maintainability:

**Core Principles:**
- **Dependency Injection**: Services accept interfaces (IStorage, ICloudSync) rather than directly depending on implementations
- **Pure Functions**: CategoryService and other services use immutable operations
- **Backward Compatibility**: All refactoring maintains static exports for existing code
- **Debounced Cloud Sync**: Settings changes are batched and synced to cloud after 1s delay

**Key Architecture Files:**
- [src/utils/interfaces.ts](src/utils/interfaces.ts) - Core interfaces: `IStorage`, `ICloudSync`, `IDebouncer`
- [src/utils/adapters.ts](src/utils/adapters.ts) - Adapter implementations: `StorageAdapter`, `GoogleSheetsAdapter`
- [src/utils/settingsSystem.ts](src/utils/settingsSystem.ts) - Unified settings management with `SettingsService` class
- [src/utils/categorySystem.ts](src/utils/categorySystem.ts) - Category management with `CategoryService` class

**Pattern Example:**
```typescript
// New: Class-based service with DI
class SettingsService {
  constructor(
    private storage: IStorage,
    private cloudSync: ICloudSync,
    debounceDelay: number = 1000
  ) { ... }
}

// Backward compatible: Static export
export const SettingsSystem = {
  getAllSettings: () => defaultService.getAllSettings(),
  saveSetting: (key, value) => defaultService.saveSetting(key, value),
  // ...
}
```

### System Modules

**Core Systems** (all in [src/utils/](src/utils/)):
- **SettingsSystem** - Unified settings management (categories, challenges, budget)
- **CategorySystem** - 8 default categories + custom categories with visibility toggle
- **PointsSystem** - Gamification points (earn from challenges, spending, saving)
- **InventorySystem** - User items (e.g., "免罪卡" guilt-free pass)
- **RecordSystem** - Spending/saving records with subscription tracking
- **financeCalc** - Core financial calculations (compound interest, annuity, GPS)

**Domain Layer** (in [src/layers/2-domain/](src/layers/2-domain/)):
- **TrajectoryCalculator** - Goal Trajectory Deviation model calculations (v4.1)
  - `calculateStartDate()` - Determine tracking start date
  - `calculateMonthsElapsed()` - Calculate months since start
  - `calculateActualSavings()` - Compute actual savings from records
  - `calculateDeviation()` - Core deviation calculation (ahead/behind/on-track)

**Storage & Sync Strategy:**
- **Read**: Local cache first, sync from cloud on app startup
- **Write**: Immediate local save, debounced cloud sync (1s delay)
- **Conflict Resolution**: Cloud wins (last-write-wins)
- **Smart Merge**: On startup, cloud data is source of truth if available

### Data Flow

```
User Action
    ↓
Local Storage (immediate)
    ↓
Debouncer (1s delay)
    ↓
Cloud Sync (Google Sheets API)
```

**Important**: When cloud sync succeeds on startup, cloud data completely replaces local data (no merge). This ensures cross-device consistency and prevents stale data after clearAllData().

## Type System

All types defined in [src/types/index.ts](src/types/index.ts):

**Core Types:**
- `UserData` - User profile, settings, points, inventory
- `Record` - Spending/saving records with metadata
- `Category` - Spending categories (default/custom)
- `ChallengeDefinition` - Daily challenges (default/custom)
- `QuickAction` - Quick entry buttons
- `Screen` - App routing ('loading' | 'onboarding' | 'home' | 'history' | 'settings')

**Financial Types:**
- `GPSResult` - Retirement age estimation
- `TimeFormatted` - Time cost formatting
- `DeviationResult` - Goal trajectory deviation calculation result (v4.1)
  - Contains: targetAccumulatedSavings, actualAccumulatedSavings, deviation, deviationHours, deviationDays, deviationYears, isOnTrack, isAhead, isBehind, monthsElapsed, requiredMonthlySavings, startDate

## Financial Calculation Logic

Core module: [src/utils/financeCalc.ts](src/utils/financeCalc.ts)

**Key Formulas:**
```javascript
// Real rate of return (實質報酬率)
realRate = (1 + ROI) / (1 + inflation) - 1

// One-time spending/saving future value
FV = amount × (1 + realRate)^yearsToRetire

// Monthly recurring future value (annuity)
FV = monthly × ((1 + monthlyRate)^months - 1) / monthlyRate

// Time cost
timeCost = FV ÷ hourlyWage
```

**Default Parameters:**
- Inflation: 2.5%
- ROI: 6%
- Real Rate: ≈3.41%
- Working hours/year: 2112 (22 days × 8 hrs × 12 months)

**UMD Pattern**: financeCalc.ts uses UMD to work in both browser and Node.js (for tests).

## Testing Philosophy

**精簡測試策略 (Streamlined Testing Strategy):**
> Don't test UI implementation details, only test core business logic and critical user flows. Keep tests stable to avoid frequent modifications due to UI changes.

**Test Coverage (140 tests total):**
1. **financeCalc.test.ts** (56 tests) - Core calculations, edge cases, precision
2. **App.test.tsx** (32 tests) - E2E flows: onboarding → home → history → settings
3. **OnboardingScreen.test.tsx** (5 tests) - Button text display, onboarding flow validation
4. **TrajectoryCalculator.test.ts** (18 tests) - Goal trajectory deviation calculations (v4.1)
5. **progressiveDisclosure.test.ts** (29 tests) - Feature unlock logic

**Note:** Internal implementation tests (settingsSystem, categorySystem) were removed in v3.2 to follow the streamlined testing strategy. Their functionality is covered by E2E tests.

**When adding features:**
- Test core logic in dedicated util test files
- Add E2E flow tests in App.test.tsx for critical user paths
- Avoid testing React component implementation details

## Google Sheets Backend

Optional cloud sync via Google Apps Script:

**Files:**
- [google-apps-script/Code.gs](google-apps-script/Code.gs) - Backend API
- Must set `SPREADSHEET_ID` in Code.gs before deployment

**API Endpoints:**
- `getUserData()` - Fetch user data + settings
- `saveUserData(data)` - Save user data + settings
- `addRecord(record)` - Add spending/saving record
- `getAllRecords()` - Fetch all records

**Sheets Structure:**
- "消費紀錄" (14 columns) - Records with subscription tracking
- "使用者資料" (16 columns) - User data with v2.2 settings fields
- "快速記帳按鈕" - Quick actions (auto-created when saved)

**Environment Variable:**
- `VITE_GAS_URL` - Google Apps Script deployment URL

## Important Conventions

### Code Style
- **Language**: All UI strings, comments, and docs in Traditional Chinese
  - **Exception**: Test files (*.test.ts, *.test.tsx) may use English for test descriptions, mock component labels, and assertions for better compatibility with testing tools and international collaboration
- **File naming**: camelCase for TS/JS files, PascalCase for React components
- **Imports**: Use `@/` alias for src/ (configured in vite.config.js)

### Data Mutations
- **Settings/Category systems**: Use pure functions, create new arrays (never mutate)
- **React state**: Use immutable update patterns
- **Storage**: Always save to local immediately, then schedule cloud sync

### Backward Compatibility
- When refactoring, maintain static exports for existing consumers
- Example: SettingsService class exports + SettingsSystem static object

### Error Handling
- Cloud sync failures don't break app (local data still works)
- Log errors but degrade gracefully to offline mode

## Key File Locations

**Entry Points:**
- [src/main.tsx](src/main.tsx) - React entry
- [index.html](index.html) - Vite entry
- [src/components/App.tsx](src/components/App.tsx) - Main app component

**Configuration:**
- [vite.config.js](vite.config.js) - Vite config (base: '/timebar/', alias: '@')
- [vitest.config.ts](vitest.config.ts) - Test config (jsdom, setup file)
- [tsconfig.json](tsconfig.json) - TypeScript config
- [tailwind.config.js](tailwind.config.js) - Tailwind CSS config (`darkMode: 'selector'`，避免 OS 深色模式滲漏)

**Tests:**
- [src/tests/setup.ts](src/tests/setup.ts) - Test environment setup
- [src/tests/](src/tests/) - All test files

**Styles:**
- [src/styles/index.css](src/styles/index.css) - Tailwind + global styles
- [src/styles/animations.css](src/styles/animations.css) - Custom animations

## Common Patterns

### Adding a New Setting

1. Add type to `AppSettings` in [settingsSystem.ts](src/utils/settingsSystem.ts):
```typescript
export interface AppSettings {
  myNewSetting?: MyType
}
```

2. Add storage key to `SETTING_KEYS`:
```typescript
const SETTING_KEYS = {
  MY_NEW_SETTING: 'timebar_my_new_setting',
}
```

3. Update `getAllSettings()` and `getStorageKey()` methods

4. Update cloud sync in `syncFromCloud()` and `syncToCloud()`

5. Update Google Apps Script [Code.gs](google-apps-script/Code.gs) to persist the new field

### Adding a New Category

Use CategorySystem methods:
```typescript
import { CategorySystem } from '@/utils/categorySystem'

CategorySystem.addCustomCategory({
  id: 'unique-id',
  name: '分類名稱',
  icon: '🎯',
  color: '#hexcolor',
  sortOrder: 100,
})
```

### Adding a New Screen

1. Create component in appropriate folder under [src/components/](src/components/)
2. Add to `Screen` type in [src/types/index.ts](src/types/index.ts)
3. Import and add route in [App.tsx](src/components/App.tsx)
4. Add navigation from existing screens

## Version History Context

- **v4.2** (2026-02-22): 消費備註功能 & Dark Mode 修正
  - CategorySelectModal 漸進式展開 UI（選分類 → 確認+備註+儲存）
  - `onSelect` callback 改為 `(categoryId, note)` 雙參數
  - 歷史頁面備註顯示修正（分類名 + 備註分行，不再互相覆蓋）
  - Tailwind `darkMode` 改為 `selector`，修復 OS 深色模式下淺色介面文字對比度問題
  - 所有元件 CSS 的 `@media (prefers-color-scheme: dark)` 改為 `:root[data-theme="dark"]`
- **v4.1** (2026-01-16): Goal Trajectory Deviation Model
  - Replaced absolute opportunity cost model with trajectory-based deviation tracking
  - New TrajectoryCalculator (`src/layers/2-domain/calculators/TrajectoryCalculator.ts`)
  - New DeviationResult type for tracking savings vs target
  - RetirementProgress component shows accumulated savings progress bar
  - Opportunity cost shown as reference value (💭 機會成本僅供參考)
  - RecalibrationDialog for goal changes with reset/keep history options
  - Added trajectoryStartDate persistence for consistent tracking
  - Tests: 138 → 140 (added TrajectoryCalculator tests)
- **v4.0** (2026-01-11): HomePage Migration & Layer 4 Architecture
  - Migrated from DashboardScreen to new HomePage (`src/layers/4-ui/pages/HomePage/`)
  - Adopted Layer 4 UI architecture with `@ui/` and `@business/` aliases
  - Integrated all features: Toast, CategorySelect, Challenges, QuickActions, Points, Confetti
  - Consumption/Savings mode toggle for recording both transaction types
  - Catch-up hints when retirement progress falls behind
  - Tests: 88 → 122 (added HomePage integration tests)
  - DashboardScreen kept as commented backup for rollback capability
- **v3.2** (2026-01-10): UI/UX simplification & Progressive Disclosure
  - Screens: 9 → 5 (removed tracker, shop, challenge-settings, etc.)
  - Onboarding: 5 steps → 3 steps
  - Added progressive disclosure system (features unlock based on usage)
  - Tests: 120 → 88 (removed internal implementation tests)
  - New components: RetirementProgress, UnlockNotification, progressiveDisclosure.ts
- **v3.1** (2026-01-06): Architecture refactoring
  - v2.3: Dependency injection refactor (SettingsSystem, CategorySystem)
  - Debounced cloud sync (1s delay)
- **v3.0**: Initial release
  - v2.2: Extended settings sync (hidden categories, modified challenges)
  - v2.1: Subscription management, record metadata (createdAt, updatedAt)
  - v2.0: Gamification (points, inventory, challenges)

When reading code, be aware that comments may reference these version milestones.
