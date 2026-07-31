'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingHelpButtonProps {
  onClick: () => void;
  isVisible?: boolean;
}

export default function FloatingHelpButton({ onClick, isVisible = true }: FloatingHelpButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {showTooltip && !isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-14 right-0 bg-[var(--background-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] shadow-lg whitespace-nowrap"
          >
            Need help? Click here!
            <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-[var(--background-card)] border-r border-b border-[var(--border)] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        <HelpCircle size={24} className="relative z-10" />
        <div className="absolute inset-0 rounded-full bg-[var(--primary)] opacity-20 animate-ping" />
      </motion.button>
    </div>
  );
}
