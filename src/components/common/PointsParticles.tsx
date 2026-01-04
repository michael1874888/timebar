import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  emoji: string;
}

interface PointsParticlesProps {
  active: boolean;
  amount?: number;
  x?: number;
  y?: number;
}

export function PointsParticles({ active, amount = 10, x = 50, y = 50 }: PointsParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showNumber, setShowNumber] = useState(false);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      setShowNumber(false);
      return;
    }

    // 創建粒子
    const newParticles: Particle[] = [];
    const emojis = ['⏳', '✨', '🌟', '💫'];
    
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        id: Date.now() + i,
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // 向上偏移
        life: 1,
        size: 16 + Math.random() * 8,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      });
    }
    
    setParticles(newParticles);
    setShowNumber(true);

    // 動畫更新
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // 重力
            life: p.life - 0.03
          }))
          .filter(p => p.life > 0)
      );
    }, 16);

    // 清理
    const timeout = setTimeout(() => {
      setParticles([]);
      setShowNumber(false);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [active, x, y]);

  if (!active && particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* 浮動數字 */}
      {showNumber && (
        <div 
          className="absolute text-amber-400 font-bold text-2xl animate-float-up"
          style={{ 
            left: `${x}%`, 
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
          }}
        >
          +{amount} ⏳
        </div>
      )}

      {/* 粒子 */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute transition-opacity"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            opacity: p.life,
            transform: `translate(-50%, -50%) scale(${0.5 + p.life * 0.5})`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}
