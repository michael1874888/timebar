// 覺察提醒動畫 - 橙/紅色粒子上升效果
interface AwarenessParticlesProps {
  active: boolean;
}

export function AwarenessParticles({ active }: AwarenessParticlesProps) {
  if (!active) return null;

  // 生成 40 個粒子（比 confetti 少一點，更內斂）
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.5 + Math.random() * 0.8,
    // 橙/紅色系，象徵時間成本
    color: ['#fb923c', '#f97316', '#ea580c', '#ef4444', '#dc2626'][Math.floor(Math.random() * 5)],
    size: 6 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-awareness"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </div>
  );
}
