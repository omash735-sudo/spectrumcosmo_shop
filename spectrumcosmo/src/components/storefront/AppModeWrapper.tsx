'use client';

import { ReactNode } from 'react';
import { useAppMode } from '@/hooks/useAppMode';
import { usePlatform } from '@/hooks/usePlatform';

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

  // AppModeWrapper ONLY provides app mode context, does NOT render navigation
  // Navigation is handled by LayoutWrapper
  return <>{children}</>;
}
