'use client';

import { ReactNode } from 'react';
import { useAppMode } from '@/hooks/useAppMode';
import { usePlatform } from '@/hooks/usePlatform';
import MobileHeader from './MobileHeader';
import MobileSearchBar from './MobileSearchBar';
import MobileBottomNav from './MobileBottomNav';

interface AppModeWrapperProps {
  children: ReactNode;
}

export default function AppModeWrapper({ children }: AppModeWrapperProps) {
  const { isAppMode, mounted } = useAppMode();
  const { isNative } = usePlatform();

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Native apps (Capacitor) always use app mode
  const showAppMode = isAppMode || isNative;

  if (showAppMode) {
    return (
      <>
        <MobileHeader />
        <MobileSearchBar />
        {children}
        <MobileBottomNav />
      </>
    );
  }

  return <>{children}</>;
}
