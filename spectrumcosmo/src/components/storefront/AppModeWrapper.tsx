'use client';

import { ReactNode } from 'react';
import { useAppMode } from '@/hooks/useAppMode';

interface AppModeWrapperProps {
  children: (isAppMode: boolean) => ReactNode;
}

export default function AppModeWrapper({ children }: AppModeWrapperProps) {
  const { isAppMode, mounted } = useAppMode();

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children(isAppMode)}</>;
}
