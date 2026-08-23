'use client';

import { useEffect } from 'react';
import { usePlatform } from '@/hooks/usePlatform';

export default function NativeStatusBar() {
  const { isNative } = usePlatform();

  useEffect(() => {
    if (isNative) {
      const setStatusBar = async () => {
        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        } catch (error) {
          console.log('StatusBar not available:', error);
        }
      };
      setStatusBar();
    }
  }, [isNative]);

  return null;
}
