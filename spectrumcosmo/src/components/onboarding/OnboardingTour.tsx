'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
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
    isNavigating,
    getCurrentSteps,
    getCurrentStepIndex,
    getStepCount,
    shouldShowStep,
  } = useOnboarding();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const stepRef = useRef<HTMLDivElement>(null);

  const filteredSteps = getCurrentSteps();
  const currentStepIndex = getCurrentStepIndex();
  const totalSteps = getStepCount();

  const currentFilteredStep = filteredSteps[currentStepIndex] || null;

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
    }, 4000);
  };

  useEffect(() => {
    if (!isOpen || !currentFilteredStep || isNavigating) return;
    
    if (currentFilteredStep.target === 'body') {
      setHoveredElement(null);
      return;
    }

    const targetSelector = getStepTarget(currentFilteredStep);
    const selectors = targetSelector.split(',').map(s => s.trim());
    let element: Element | null = null;
    
    for (const selector of selectors) {
      const found = document.querySelector(selector);
      if (found) {
        element = found;
        break;
      }
    }

    if (!element && currentFilteredStep.fallbackSelector) {
      element = document.querySelector(currentFilteredStep.fallbackSelector);
    }

    setHoveredElement(element || null);

    if (element) {
      const rect = element.getBoundingClientRect();
      const isVisible = 
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth;

      if (!isVisible && currentFilteredStep.scrollTo) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isOpen, currentFilteredStep, getStepTarget, isNavigating]);

  if (!isEnabled || isLoading || hasCompleted || !isOpen || isNavigating) {
    return null;
  }

  if (!currentFilteredStep || totalSteps === 0) {
    return null;
  }

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  const getPositionStyles = () => {
    if (currentFilteredStep.target === 'body') {
      return {
        position: 'fixed' as const,
        top: isMobile ? '10%' : '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: isMobile ? '90%' : '500px',
        width: isMobile ? '90%' : 'auto',
      };
    }

    if (hoveredElement) {
      const rect = hoveredElement.getBoundingClientRect();
      const placement = isMobile ? 'bottom' : currentFilteredStep.placement;

      const positions = {
        top: { bottom: window.innerHeight - rect.top + 16, left: rect.left + rect.width / 2 },
        bottom: { top: rect.bottom + 16, left: rect.left + rect.width / 2 },
        left: { top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + 16 },
        right: { top: rect.top + rect.height / 2, left: rect.right + 16 },
        center: { top: '50%', left: '50%' },
      };

      const pos = positions[placement as keyof typeof positions] || positions.bottom;
      const transform = placement === 'center' ? 'translate(-50%, -50%)' : 'translate(-50%, 0)';
      
      return {
        position: 'fixed' as const,
        ...pos,
        transform,
        maxWidth: isMobile ? '85%' : '400px',
        width: isMobile ? '85%' : 'auto',
      };
    }

    return {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: isMobile ? '90%' : '400px',
      width: isMobile ? '90%' : 'auto',
    };
  };

  const getOverlayStyles = () => {
    if (!hoveredElement || currentFilteredStep.target === 'body') {
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
          ref={stepRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="pointer-events-auto bg-[var(--background-card)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 sm:p-6"
          style={positionStyles}
        >
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--primary)]">
                  {currentStepIndex + 1} / {totalSteps}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">•</span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] break-words">
                {currentFilteredStep.title}
              </h3>
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={handleSkipWithSound}
                className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Skip tour"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <p className="text-sm text-[var(--foreground-muted)] mb-4 sm:mb-6 leading-relaxed">
            {currentFilteredStep.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={handleBackWithSound}
                  className="px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition border border-[var(--border)] rounded-lg hover:border-[var(--primary)] min-h-[36px]"
                >
                  <ChevronLeft size={16} className="inline mr-1" />
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSkipWithSound}
                className="px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition min-h-[36px]"
              >
                Skip
              </button>
              {isLast ? (
                <button
                  onClick={handleFinishWithSound}
                  className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition shadow-md min-h-[36px]"
                >
                  Finish 
                </button>
              ) : (
                <button
                  onClick={handleNextWithSound}
                  className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition shadow-md flex items-center gap-1 min-h-[36px]"
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
              animate={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </motion.div>

        {showConfetti && <Confetti />}
      </motion.div>
    </AnimatePresence>
  );
}
