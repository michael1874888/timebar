export const PositiveMessaging = {
  // GPS 狀態訊息
  gpsStatus: {
    ahead: (years: number) => ({
      emoji: '🎉',
      title: '太棒了！',
      message: `你領先計劃 ${years.toFixed(1)} 年！`,
      action: '繼續保持這個節奏'
    }),

    onTrack: () => ({
      emoji: '✓',
      title: '完美！',
      message: '你正走在計畫的軌道上',
      action: '穩健前進，持續就是力量'
    }),

    behind: (years: number, extraSaving: number) => ({
      emoji: '💪',
      title: '再加把勁！',
      message: `還差 ${years.toFixed(1)} 年`,
      action: `每月多存 ${extraSaving}，6 個月就能追上`
    })
  },

  // 消費記錄後
  afterSpending: (amount: number, days: number) => ({
    neutral: `已記錄 ${amount} 元的消費`,
    insight: `下次省下來，就能買回 ${days} 天自由時光`,
    motivation: '每次的小決定，都在塑造未來'
  }),

  // 儲蓄記錄後
  afterSaving: (_amount: number, days: number) => ({
    celebration: '太棒了！',
    impact: `你剛剛買回了 ${days} 天自由`,
    quote: getRandomQuote('save')
  }),

  // 里程碑解鎖
  milestoneUnlocked: (milestone: string) => ({
    title: '🏆 成就解鎖！',
    message: `你解鎖了「${milestone}」`,
    reward: '這是你努力的證明'
  })
};

function getRandomQuote(type: 'save' | 'spend') {
  const saveQuotes = [
    '每一次忍住，都是在買回自己的自由',
    '省下的不是錢，是時間',
    '你正在用行動改變未來',
    '自律帶來自由',
    '你比昨天的自己更自由了'
  ];

  const spendQuotes = [
    '沒關係，知道代價就好',
    '偶爾享受也是生活的一部分',
    '下次可以做得更好',
    '重要的是持續前進'
  ];

  const quotes = type === 'save' ? saveQuotes : spendQuotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
}
