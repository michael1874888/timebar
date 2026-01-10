// src/layers/4-ui/design-system/tokens/colors.ts

/**
 * 顏色 Design Tokens
 *
 * 從現有 UI 提取核心顏色，建立統一的設計系統
 * 所有顏色值來自 Tailwind CSS 調色板
 */

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
      main: '#10b981',       // 綠色（領先）
      light: '#34d399',      // emerald-400
      dark: '#059669',       // emerald-600
      bar: '#10b981',        // 進度條顏色
      dot: '#34d399',        // 標記點顏色
      background: '#d1fae5', // 背景顏色 (emerald-100)
    },
    onTrack: {
      main: '#3b82f6',       // 藍色（準時）
      light: '#60a5fa',      // blue-400
      dark: '#2563eb',       // blue-600
      bar: '#3b82f6',        // 進度條顏色
      dot: '#60a5fa',        // 標記點顏色
      background: '#dbeafe', // 背景顏色 (blue-100)
    },
    behind: {
      main: '#f97316',       // 橘色（落後）
      light: '#fb923c',      // orange-400
      dark: '#ea580c',       // orange-600
      bar: '#f97316',        // 進度條顏色
      dot: '#fb923c',        // 標記點顏色
      background: '#ffedd5', // 背景顏色 (orange-100)
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
