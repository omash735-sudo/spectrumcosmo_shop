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
import { OnboardingStep } from '@/lib/onboarding/types';

const ONBOARDING_ENABLED_KEY = 'spectrumcosmo_onboarding_enabled';

export function useOnboarding() {
  const pathname = usePathname();
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('spectrumcosmo_session');
      if (stored) {
        setSessionId(stored);
      } else {
        const newId = generateSessionId();
        localStorage.setItem('spectrumcosmo_session', newId);
        setSessionId(newId);
      }
    }
  }, []);

  useEffect(() => {
    if (!isMounted || !sessionId) return;

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
  }, [isMounted, sessionId]);

  useEffect(() => {
    if (!isMounted) return;

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
      setSteps(isMobile ? MOBILE_STEPS : DEFAULT_STEPS);
    };
    loadSteps();
  }, [isMobile, isMounted]);

  useEffect(() => {
    if (!isMounted || !sessionId) return;

    const checkStatus = async () => {
      setIsLoading(true);
      try {
        if (pathname?.startsWith('/admin')) {
          setIsOpen(false);
          setIsLoading(false);
          return;
        }

        const status = await getUserOnboardingStatus(userId, sessionId);
        if (status) {
          setHasCompleted(status.hasCompleted);
          setCurrentStep(status.currentStep);
          
          if (!status.hasCompleted && isEnabled) {
            setIsOpen(true);
          }
        } else if (isEnabled) {
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [userId, sessionId, pathname, isEnabled, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
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
  }, [isMounted]);

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
    return step.target.split(',').map(s => s.trim());
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
