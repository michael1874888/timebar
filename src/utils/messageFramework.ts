// TimeBar - 正向訊息框架
// 將所有負面訊息改寫成正向/行動導向

export interface MessageSet {
  positive: string;
  action: string;
}

// 訊息類型
type MessageCategory = 
  | 'behind'          // 落後目標
  | 'noSavings'       // 沒有儲蓄
  | 'highSpending'    // 高消費
  | 'missedGoal'      // 未達目標
  | 'longWayToGo'     // 還有很長的路
  | 'subscriptionWarning'; // 訂閱警告

// 正向訊息映射
const positiveMessages: Record<MessageCategory, MessageSet> = {
  behind: {
    positive: '你正在追趕中，每一步都算數！',
    action: '試試今日挑戰，馬上開始進步'
  },
  noSavings: {
    positive: '今天是開始的好日子！',
    action: '從一杯咖啡開始，解鎖第一個里程碑'
  },
  highSpending: {
    positive: '意識到問題就成功了一半！',
    action: '看看哪個分類可以調整'
  },
  missedGoal: {
    positive: '目標可以調整，重要的是持續前進',
    action: '重新設定一個更適合你的目標'
  },
  longWayToGo: {
    positive: '每一天都在累積你的自由',
    action: '專注在今天能做的小事'
  },
  subscriptionWarning: {
    positive: '發現了一個優化機會！',
    action: '評估這個訂閱是否值得'
  }
};

/**
 * 取得正向訊息
 */
export const getPositiveMessage = (category: MessageCategory): MessageSet => {
  return positiveMessages[category];
};

/**
 * 格式化落後訊息（正向版）
 */
export const formatBehindMessage = (days: number): string => {
  if (days <= 7) {
    return `距離目標只差 ${days} 天，這週努力一下就能追上！`;
  }
  if (days <= 30) {
    return `還有 ${days} 天的差距，一個月內絕對追得回來！`;
  }
  if (days <= 90) {
    return `落後 ${days} 天，小調整就能慢慢追回，不用著急`;
  }
  return `有一段距離要追，但每一步都讓你更接近自由`;
};

/**
 * 格式化消費反饋訊息（正向版）
 */
export const formatSpendFeedback = (workingDays: number): string => {
  if (workingDays < 1) {
    return '小額消費，影響不大，繼續保持覺察！';
  }
  if (workingDays < 3) {
    return '已記錄！知道代價就是進步的開始';
  }
  if (workingDays < 7) {
    return '這筆不小，但下次會做更好的決定';
  }
  return '大筆支出已記錄，考慮看看是否有替代方案';
};

/**
 * 格式化儲蓄反饋訊息
 */
export const formatSaveFeedback = (workingDays: number): string => {
  if (workingDays < 1) {
    return '每一分錢都是自由的磚塊！';
  }
  if (workingDays < 3) {
    return '不錯！又賺回了幾天的自由';
  }
  if (workingDays < 7) {
    return '太棒了！這筆儲蓄很有感';
  }
  return '🎉 大豐收！你的未來自我會感謝你';
};

/**
 * 取得激勵語句
 */
export const getMotivationalMessage = (): string => {
  const messages = [
    '每一分錢都是你未來自由的磚塊 🧱',
    '今天的忍耐，是明天的自由 ✨',
    '你正在買回自己的時間 ⏰',
    '小小的決定，大大的改變 💪',
    '退休後的你會感謝現在的決定 🙏',
    '自由不是免費的，是一點一滴省出來的 🎯',
    '每次說「不買」，都是對自己說「我值得更好的未來」💎',
    '財務自由之路，你已經在路上了 🚀'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * 取得狀態描述（正向版）
 */
export const getStatusDescription = (
  isAhead: boolean,
  isOnTrack: boolean,
  daysDiff: number
): string => {
  if (isOnTrack) {
    return '✅ 完美！你正準時抵達財務自由';
  }
  if (isAhead) {
    if (daysDiff > 30) {
      return '🚀 大幅領先！你的努力正在發光';
    }
    return '🎉 領先中！繼續保持這個節奏';
  }
  // Behind
  return formatBehindMessage(Math.abs(daysDiff));
};
