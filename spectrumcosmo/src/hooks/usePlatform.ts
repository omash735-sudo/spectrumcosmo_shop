'use client';

import { useState, useEffect } from 'react';

export function usePlatform() {
  const [isNative, setIsNative] = useState(false);
  const [isWeb, setIsWeb] = useState(true);
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios' | 'unknown'>('web');

  useEffect(() => {
    const checkPlatform = async () => {
      // Check if running in Capacitor
      const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
      
      if (isCapacitor) {
        try {
          const { Device } = await import('@capacitor/device');
          const info = await Device.getInfo();
          setIsNative(true);
          setIsWeb(false);
          
          if (info.platform === 'android') {
            setPlatform('android');
          } else if (info.platform === 'ios') {
            setPlatform('ios');
          } else {
            setPlatform('unknown');
          }
        } catch {
          // Fallback if device plugin not available
          setIsNative(true);
          setIsWeb(false);
          setPlatform('unknown');
        }
      } else {
        setIsNative(false);
        setIsWeb(true);
        setPlatform('web');
      }
    };

    checkPlatform();
  }, []);

  return { isNative, isWeb, platform };
}
