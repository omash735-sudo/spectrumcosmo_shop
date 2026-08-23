'use client';

import { useState, useEffect } from 'react';

export function useAppMode() {
  const [isAppMode, setIsAppMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkAppMode = () => {
      // Check if installed as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      // Also check if viewed in mobile browser (not desktop)
      const isMobile = window.innerWidth < 768;
      
      // App mode = installed PWA OR (mobile + standalone/fullscreen)
      const isApp = isStandalone || isFullscreen || isMinimalUi || isIOSStandalone;
      
      // Only enable app mode on mobile devices
      setIsAppMode(isApp && isMobile);
    };

    checkAppMode();
    
    // Listen for changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkAppMode();
    mediaQuery.addEventListener('change', handleChange);
    
    // Also listen for resize
    window.addEventListener('resize', checkAppMode);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', checkAppMode);
    };
  }, []);

  return { isAppMode, mounted };
}
