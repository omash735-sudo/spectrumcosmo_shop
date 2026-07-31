'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { INTELLIGENT_STEPS, MOBILE_STEPS } from '@/lib/onboarding/intelligent-steps';
import { 
  getUserOnboardingStatus, 
  saveOnboardingProgress, 
  resetOnboarding,
  generateSessionId 
} from '@/lib/onboarding/persistence';
import { OnboardingStep } from '@/lib/onboarding/types';

export function useOnboarding() {
  const pathname = usePathname();
  const router = useRouter();
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
  const [isNavigating, setIsNavigating] = useState(false);

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
      setSteps(isMobile ? MOBILE_STEPS : INTELLIGENT_STEPS);
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

  const getStepTarget = useCallback((step: OnboardingStep): string => {
    if (step.contextTargets && pathname) {
      const contextKey = Object.keys(step.contextTargets).find(key => {
        if (key === '[id]') {
          return pathname.includes('/products/') && pathname !== '/products';
        }
        return pathname === key;
      });
      if (contextKey && step.contextTargets[contextKey]) {
        return step.contextTargets[contextKey];
      }
    }
    return step.target;
  }, [pathname]);

  const shouldShowStep = useCallback((step: OnboardingStep): boolean => {
    if (!step.condition) return true;
    if (step.condition.always) return true;
    if (step.condition.isLoggedIn !== undefined && step.condition.isLoggedIn !== !!userId) return false;
    if (step.condition.isLoggedOut !== undefined && step.condition.isLoggedOut !== !userId) return false;
    if (step.condition.pathname) {
      const matches = step.condition.pathname.some(pattern => {
        if (pattern === '[id]') {
          return pathname?.startsWith('/products/') && pathname !== '/products';
        }
        return pathname === pattern;
      });
      if (!matches) return false;
    }
    return true;
  }, [pathname, userId]);

  const getCurrentSteps = useCallback(() => {
    return steps.filter(step => shouldShowStep(step));
  }, [steps, shouldShowStep]);

  const getStepIndex = useCallback(() => {
    const filteredSteps = getCurrentSteps();
    const currentStepId = steps[currentStep]?.id;
    return filteredSteps.findIndex(s => s.id === currentStepId);
  }, [steps, currentStep, getCurrentSteps]);

  const getStep = useCallback(() => {
    const filteredSteps = getCurrentSteps();
    const index = getStepIndex();
    return filteredSteps[index] || null;
  }, [getCurrentSteps, getStepIndex]);

  const nextStep = useCallback(async () => {
    const filteredSteps = getCurrentSteps();
    const currentIndex = getStepIndex();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= filteredSteps.length) {
      handleFinish();
      return;
    }

    const nextStepData = filteredSteps[nextIndex];
    if (!nextStepData) return;

    const stepIndex = steps.findIndex(s => s.id === nextStepData.id);
    if (stepIndex === -1) return;

    setCurrentStep(stepIndex);
    await saveOnboardingProgress(userId, sessionId, false, stepIndex);

    if (nextStepData.navigateTo && pathname !== nextStepData.navigateTo) {
      setIsNavigating(true);
      router.push(nextStepData.navigateTo);
      setTimeout(() => {
        setIsNavigating(false);
      }, 1500);
    }

    if (nextStepData.scrollTo) {
      setTimeout(() => {
        const target = document.querySelector(nextStepData.target);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [getCurrentSteps, getStepIndex, steps, userId, sessionId, pathname, router]);

  const prevStep = useCallback(() => {
    const filteredSteps = getCurrentSteps();
    const currentIndex = getStepIndex();
    const prevIndex = currentIndex - 1;

    if (prevIndex < 0) return;

    const prevStepData = filteredSteps[prevIndex];
    if (!prevStepData) return;

    const stepIndex = steps.findIndex(s => s.id === prevStepData.id);
    if (stepIndex === -1) return;

    setCurrentStep(stepIndex);
    saveOnboardingProgress(userId, sessionId, false, stepIndex);
  }, [getCurrentSteps, getStepIndex, steps, userId, sessionId]);

  const handleSkip = useCallback(() => {
    setIsOpen(false);
    saveOnboardingProgress(userId, sessionId, false, steps.length - 1);
  }, [userId, sessionId, steps.length]);

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

  const getFilteredSteps = useCallback(() => {
    return steps.filter(step => shouldShowStep(step));
  }, [steps, shouldShowStep]);

  const getCurrentStepIndex = useCallback(() => {
    const filtered = getFilteredSteps();
    const currentStepId = steps[currentStep]?.id;
    return filtered.findIndex(s => s.id === currentStepId);
  }, [getFilteredSteps, steps, currentStep]);

  const getStepCount = useCallback(() => {
    return getFilteredSteps().length;
  }, [getFilteredSteps]);

  return {
    isOpen,
    setIsOpen,
    currentStep,
    steps,
    isLoading,
    isEnabled,
    hasCompleted,
    handleNext: nextStep,
    handleBack: prevStep,
    handleSkip,
    handleFinish,
    restartTour,
    getStepTarget,
    isMobile,
    isNavigating,
    getStep: getStep,
    getStepIndex,
    getCurrentSteps,
    getFilteredSteps,
    getCurrentStepIndex,
    getStepCount,
    shouldShowStep,
  };
}
