import React, { useEffect, useRef } from 'react';

interface CelebrationCanvasProps {
  isActive: boolean;
  onComplete?: () => void;
  colors?: string[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
  shape: 'rect' | 'circle';
}

const DEFAULT_CONFETTI_COLORS = [
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#A855F7', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899' // Pink
];

export const CelebrationCanvas: React.FC<CelebrationCanvasProps> = ({
  isActive,
  onComplete,
  colors = DEFAULT_CONFETTI_COLORS
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) return;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Generate confetti particles
    const particleCount = 120;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI) / 2 + Math.PI / 4; // Upward arc
      const speed = 7 + Math.random() * 11;
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 300,
        y: height * 0.55,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1,
        shape: Math.random() > 0.3 ? 'rect' : 'circle'
      });
    }

    let animationFrame: number;
    const startTime = performance.now();
    const durationMs = 2800;

    const render = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.985; // air resistance
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - progress * 1.2);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (progress < 1) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        onComplete?.();
      }
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isActive, colors, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
};
