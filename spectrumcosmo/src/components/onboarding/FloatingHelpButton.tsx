'use client';

import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function FloatingHelpButton() {
  const { restartTour, hasCompleted } = useOnboarding();
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (hasCompleted) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasCompleted]);

  const handleClick = () => {
    setShowTooltip(false);
    restartTour();
  };

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

      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
      >
        <HelpCircle size={24} className="relative z-10" />
      </button>
    </div>
  );
}
