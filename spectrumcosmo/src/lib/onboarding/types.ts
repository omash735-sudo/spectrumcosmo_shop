export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  isActive: boolean;
  order: number;
  deviceType?: 'desktop' | 'mobile' | 'both';
  condition?: {
    always?: boolean;
    isLoggedIn?: boolean;
    isLoggedOut?: boolean;
    pathname?: string[];
  };
  navigateTo?: string;
  scrollTo?: boolean;
  fallbackSelector?: string;
  contextTargets?: Record<string, string>;
}

export interface UserOnboardingProgress {
  userId: string | null;
  sessionId: string;
  hasCompleted: boolean;
  currentStep: number;
  lastUpdated: string;
}

export interface OnboardingConfig {
  isEnabled: boolean;
  steps: OnboardingStep[];
}
