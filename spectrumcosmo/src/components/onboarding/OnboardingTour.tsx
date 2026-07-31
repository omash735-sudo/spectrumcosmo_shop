'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX } from 'lucide-react';
import { useOnboardingContext } from '@/providers/OnboardingProvider';
import Confetti from '@/components/ui/Confetti';

export default function OnboardingTour() {
  const {
    isOpen,
    setIsOpen,
    currentStep,
    steps,
    handleNext,
    handleBack,
    handleSkip,
    handleFinish,
    getStepTarget,
    isMobile,
    hasCompleted,
    isLoading,
    isEnabled,
  } = useOnboardingContext();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = (type: 'next' | 'back' | 'complete' | 'skip') => {
    if (!soundEnabled) return;
    try {
      const ctx = audioContextRef.current || new AudioContext();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'next') {
        osc.frequency.value = 600;
        gain.gain.value = 0.08;
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'back') {
        osc.frequency.value = 400;
        gain.gain.value = 0.08;
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'complete') {
        [523, 659, 784].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.value = 0.06;
          o.start(ctx.currentTime + i * 0.12);
          o.stop(ctx.currentTime + i * 0.12 + 0.15);
        });
      } else if (type === 'skip') {
        osc.frequency.value = 300;
        gain.gain.value = 0.06;
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch (err) {}
  };

  const handleNextWithSound = () => {
    playSound('next');
    handleNext();
  };

  const handleBackWithSound = () => {
    playSound('back');
    handleBack();
  };

  const handleSkipWithSound = () => {
    playSound('skip');
    setIsOpen(false);
    handleSkip();
  };

  const handleFinishWithSound = () => {
    playSound('complete');
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setIsOpen(false);
      handleFinish();
    }, 3000);
  };

  useEffect(() => {
    if (!isOpen || !steps.length || !steps[currentStep]) return;
    
    const step = steps[currentStep];
    if (step.target === 'body') {
      setHoveredElement(null);
      return;
    }

    const selectors = step.target.split(',').map(s => s.trim());
    let element: Element | null = null;
    
    for (const selector of selectors) {
      const found = document.querySelector(selector);
      if (found) {
        element = found;
        break;
      }
    }

    setHoveredElement(element || null);

    if (element) {
      const rect = element.getBoundingClientRect();
      const isVisible = 
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth;

      if (!isVisible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isOpen, steps]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleSkipWithSound();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isEnabled || isLoading || hasCompleted || !isOpen || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const getPositionStyles = () => {
    if (step.target === 'body') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: isMobile ? '90%' : '500px',
      };
    }

    if (hoveredElement) {
      const rect = hoveredElement.getBoundingClientRect();
      const placement = isMobile ? 'bottom' : step.placement;

      const positions = {
        top: { bottom: window.innerHeight - rect.top + 20, left: rect.left + rect.width / 2 },
        bottom: { top: rect.bottom + 20, left: rect.left + rect.width / 2 },
        left: { top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + 20 },
        right: { top: rect.top + rect.height / 2, left: rect.right + 20 },
        center: { top: '50%', left: '50%' },
      };

      const pos = positions[placement as keyof typeof positions] || positions.bottom;
      return {
        position: 'fixed' as const,
        ...pos,
        transform: placement === 'center' ? 'translate(-50%, -50%)' : 'translate(-50%, 0)',
        maxWidth: isMobile ? '85%' : '400px',
      };
    }

    return {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: isMobile ? '90%' : '400px',
    };
  };

  const getOverlayStyles = () => {
    if (!hoveredElement || step.target === 'body') {
      return { display: 'none' as const };
    }

    const rect = hoveredElement.getBoundingClientRect();
    const padding = 12;
    
    return {
      position: 'fixed' as const,
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      borderRadius: '12px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      pointerEvents: 'none' as const,
      zIndex: 9998,
      transition: 'all 0.3s ease',
    };
  };

  const positionStyles = getPositionStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        <div style={getOverlayStyles()} />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="pointer-events-auto bg-[var(--background-card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6"
          style={positionStyles}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--primary)]">
                  {currentStep + 1} / {steps.length}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">•</span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}%
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                {step.title}
              </h3>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition"
                aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={handleSkipWithSound}
                className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition"
                aria-label="Skip tour"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <p className="text-sm text-[var(--foreground-muted)] mb-6 leading-relaxed">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={handleBackWithSound}
                  className="px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition border border-[var(--border)] rounded-lg hover:border-[var(--primary)]"
                >
                  <ChevronLeft size={16} className="inline mr-1" />
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSkipWithSound}
                className="px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
              >
                Skip
              </button>
              {isLast ? (
                <button
                  onClick={handleFinishWithSound}
                  className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition shadow-md"
                >
                  Finish 🎉
                </button>
              ) : (
                <button
                  onClick={handleNextWithSound}
                  className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition shadow-md flex items-center gap-1"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 h-1 bg-[var(--background-secondary)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </motion.div>

        {showConfetti && <Confetti />}
      </motion.div>
    </AnimatePresence>
  );
}
