'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#C96712', '#FF6B35', '#FFD700', '#FF4444', '#44B8FF', '#44DD88', '#FF44FF', '#FF88FF'];

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rotation: number;
      rotationSpeed: number;
    }[] = [];

    for (let i = 0; i < 200; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: 4 + Math.random() * 8,
        h: 6 + Math.random() * 12,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
      });
    }

    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 5) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, 1 - elapsed / 5);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[10000]"
    />
  );
}
