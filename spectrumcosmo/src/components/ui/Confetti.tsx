'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

const COLORS = ['#C96712', '#FF6B35', '#FFD700', '#FF4444', '#44B8FF', '#44DD88', '#FF44FF'];

export default function Confetti() {
  const piecesRef = useRef<ConfettiPiece[]>([]);

  useEffect(() => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 80; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      });
    }
    piecesRef.current = pieces;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
      {piecesRef.current.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size * 2,
            backgroundColor: piece.color,
            borderRadius: '2px',
          }}
          initial={{
            y: 0,
            rotate: 0,
            opacity: 0,
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: piece.rotation + 720,
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
