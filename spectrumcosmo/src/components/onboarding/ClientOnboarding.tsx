'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const OnboardingTour = dynamic(() => import('./OnboardingTour'), {
  ssr: false,
  loading: () => null,
});

const FloatingHelpButton = dynamic(() => import('./FloatingHelpButton'), {
  ssr: false,
  loading: () => null,
});

export default function ClientOnboarding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <OnboardingTour />
      <FloatingHelpButton />
    </>
  );
}
