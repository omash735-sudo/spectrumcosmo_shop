'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_STEPS, MOBILE_STEPS } from '@/lib/onboarding/steps';
import { 
  getUserOnboardingStatus, 
  saveOnboardingProgress, 
  resetOnboarding,
  generateSessionId 
} from '@/lib/onboarding/persistence';
import { OnboardingStep, OnboardingConfig } from '@/lib/onboarding/types';

const ONBOARDING_ENABLED_KEY = 'spectrumcosmo_onboarding_enabled';

export function useOnboarding() {
  const pathname = usePathname();
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('spectrumcosmo_session');
      if (stored) return stored;
      const newId = generateSessionId();
      localStorage.setItem('spectrumcosmo_session', newId);
      return newId;
    }
    return generateSessionId();
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Check if tour is enabled
  useEffect(() => {
    const checkEnabled = async () => {
      try {
        const res = await fetch('/api/admin/onboarding/config');
        if (res.ok) {
          const data = await res.json();
          setIsEnabled(data.isEnabled);
        }
      } catch (err) {
        console.error('Failed to fetch onboarding config:', err);
      }
    };
    checkEnabled();
  }, []);

  // Load steps from API or use defaults
  useEffect(() => {
    const loadSteps = async () => {
      try {
        const res = await fetch('/api/admin/onboarding/steps');
        if (res.ok) {
          const data = await res.json();
          if (data.steps && data.steps.length > 0) {
            setSteps(data.steps.filter((s: OnboardingStep) => s.isActive));
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch onboarding steps:', err);
      }
      // Fallback to defaults
      setSteps(isMobile ? MOBILE_STEPS : DEFAULT_STEPS);
    };
    loadSteps();
  }, [isMobile]);

  // Check if user has seen the tour
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const status = await getUserOnboardingStatus(userId, sessionId);
        if (status) {
          setHasCompleted(status.hasCompleted);
          setCurrentStep(status.currentStep);
          
          // Only show if not completed and on a valid page
          if (!status.hasCompleted && !pathname?.startsWith('/admin')) {
            setIsOpen(true);
          }
        } else {
          // First time user - show tour
          if (!pathname?.startsWith('/admin')) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [userId, sessionId, pathname]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get user ID from auth
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserId(data.id || null);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  const handleNext = useCallback(() => {
    const nextStep = currentStep + 1;
    if (nextStep >= steps.length) {
      handleFinish();
    } else {
      setCurrentStep(nextStep);
      saveOnboardingProgress(userId, sessionId, false, nextStep);
    }
  }, [currentStep, steps.length, userId, sessionId]);

  const handleBack = useCallback(() => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    saveOnboardingProgress(userId, sessionId, false, prevStep);
  }, [currentStep, userId, sessionId]);

  const handleSkip = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleFinish = useCallback(() => {
    setHasCompleted(true);
    setIsOpen(false);
    saveOnboardingProgress(userId, sessionId, true, steps.length);
  }, [userId, sessionId, steps.length]);

  const restartTour = useCallback(async () => {
    await resetOnboarding(userId, sessionId);
    setHasCompleted(false);
    setCurrentStep(0);
    setIsOpen(true);
  }, [userId, sessionId]);

  const getStepTarget = useCallback((step: OnboardingStep) => {
    // Handle multiple selectors
    const selectors = step.target.split(',').map(s => s.trim());
    return selectors;
  }, []);

  return {
    isOpen,
    setIsOpen,
    currentStep,
    steps,
    isLoading,
    isEnabled,
    hasCompleted,
    handleNext,
    handleBack,
    handleSkip,
    handleFinish,
    restartTour,
    getStepTarget,
    isMobile,
  };
}
