'use client';

import dynamic from 'next/dynamic';

const OnboardingTour = dynamic(() => import('./OnboardingTour'), {
  ssr: false,
});

const FloatingHelpButton = dynamic(() => import('./FloatingHelpButton'), {
  ssr: false,
});

export default function ClientOnboarding() {
  return (
    <>
      <OnboardingTour />
      <FloatingHelpButton />
    </>
  );
}
