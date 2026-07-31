export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  isActive: boolean;
  order: number;
  deviceType?: 'desktop' | 'mobile' | 'both';
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
