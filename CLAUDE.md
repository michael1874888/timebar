# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TimeBar v3.2** - A financial tracking web app that converts spending into "retirement time cost" with gamification features. Helps users understand their spending in terms of delayed/advanced retirement days using compound interest calculations.

- **Language**: Traditional Chinese (繁體中文) - all UI text, comments, and documentation
- **Stack**: React 18 + TypeScript + Vite 5
- **Testing**: Vitest with 120 tests (精簡測試策略 - focused testing strategy)
- **Backend**: Google Apps Script (optional cloud sync via Google Sheets)
- **Deployment**: GitHub Pages at `/timebar/` base path

## Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173/timebar/)
npm run build            # Production build to dist/
npm run preview          # Preview production build

# Testing
npm test                 # Run all 120 tests (4 test files)
npm test:watch           # Watch mode
npm test:ui              # Vitest UI
npm test:coverage        # Generate coverage report

# Running specific tests
npm test -- financeCalc       # Only financeCalc.test.ts (56 tests)
npm test -- App               # Only App.test.tsx (34 tests)
npm test -- settingsSystem    # Only settingsSystem.test.ts (9 tests)
npm test -- categorySystem    # Only categorySystem.test.ts (21 tests)
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
- `Screen` - App routing ('onboarding' | 'dashboard' | 'tracker' | 'history' | 'settings' | ...)

**Financial Types:**
- `GPSResult` - Retirement age estimation
- `TimeFormatted` - Time cost formatting

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

**Test Coverage (120 tests total):**
1. **financeCalc.test.ts** (56 tests) - Core calculations, edge cases, precision
2. **App.test.tsx** (34 tests) - E2E flows: onboarding → dashboard → tracking → history → settings
3. **settingsSystem.test.ts** (9 tests) - DI architecture, debounce, cloud sync
4. **categorySystem.test.ts** (21 tests) - CRUD, visibility, pure functions

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
- [tailwind.config.js](tailwind.config.js) - Tailwind CSS config

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

- **v2.3**: Dependency injection refactor (SettingsSystem, CategorySystem)
- **v2.2**: Extended settings sync (hidden categories, modified challenges)
- **v2.1**: Subscription management, record metadata (createdAt, updatedAt)
- **v2.0**: Gamification (points, inventory, challenges)
- **v3.2**: Current version with full feature set

When reading code, be aware that comments may reference these version milestones.
