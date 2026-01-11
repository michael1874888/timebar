/**
 * TimeBar Design System - Animation Tokens
 * 動畫系統定義
 */

export const AnimationTokens = {
  // Duration (持續時間)
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Easing (緩動函數)
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // 自定義貝塞爾曲線
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    snappy: 'cubic-bezier(0.4, 0, 0, 1)',
  },

  // Transition (過渡)
  transition: {
    default: 'all 300ms ease',
    fast: 'all 150ms ease',
    slow: 'all 500ms ease',
    // 具體屬性過渡
    opacity: 'opacity 300ms ease',
    transform: 'transform 300ms ease',
    colors: 'background-color 200ms ease, color 200ms ease, border-color 200ms ease',
    shadow: 'box-shadow 300ms ease',
  },

  // Keyframes 定義 (用於 CSS-in-JS 或 CSS)
  keyframes: {
    // 淡入
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    // 滑入
    slideUp: {
      from: { transform: 'translateY(100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideDown: {
      from: { transform: 'translateY(-100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideLeft: {
      from: { transform: 'translateX(100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    slideRight: {
      from: { transform: 'translateX(-100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    // 縮放
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.95)', opacity: 0 },
    },
    // 脈搏動畫 (用於強調)
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    // 彈跳
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    // 搖擺 (用於警告)
    shake: {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
    },
    // 旋轉 (用於載入)
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    // 進度條填充
    progressFill: {
      from: { width: '0%' },
      to: { width: 'var(--progress-width)' },
    },
    // 數字上漲動畫 (用於時間成本)
    countUp: {
      from: { opacity: 0, transform: 'translateY(10px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    // 慶祝動畫
    celebrate: {
      '0%': { transform: 'scale(0.5) rotate(-10deg)', opacity: 0 },
      '50%': { transform: 'scale(1.1) rotate(5deg)' },
      '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
    },
    // 彩帶掉落
    confettiFall: {
      '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: 1 },
      '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: 0 },
    },
    // 覺察粒子上升
    particleRise: {
      '0%': { transform: 'translateY(0) scale(1)', opacity: 1 },
      '100%': { transform: 'translateY(-100px) scale(0.5)', opacity: 0 },
    },
  },

  // 預組合動畫
  animations: {
    fadeIn: '300ms ease fadeIn',
    fadeOut: '300ms ease fadeOut',
    slideUp: '300ms smooth slideUp',
    slideDown: '300ms smooth slideDown',
    scaleIn: '300ms spring scaleIn',
    pulse: '2s ease-in-out infinite pulse',
    bounce: '1s ease infinite bounce',
    shake: '500ms ease shake',
    spin: '1s linear infinite spin',
    celebrate: '500ms spring celebrate',
    confetti: '3s ease-in-out confettiFall',
    particle: '1.5s ease-out particleRise',
  },

  // 頁面過渡配置
  pageTransition: {
    // 頁面進入
    enter: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    // 頁面離開
    exit: {
      animate: { opacity: 0, x: -20 },
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },
    // Modal 進入
    modalEnter: {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] },
    },
    // Modal 離開
    modalExit: {
      animate: { opacity: 0, scale: 0.95, y: 20 },
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },
  },
} as const;

export type AnimationToken = typeof AnimationTokens;
