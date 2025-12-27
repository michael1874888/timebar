// 慶祝動畫元件
interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  if (!active) return null;

  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random(),
    color: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f472b6'][Math.floor(Math.random() * 5)],
    size: 8 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-confetti"
          style={{
            left: `${p.x}%`,
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
