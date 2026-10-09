'use client';

import { useState, useEffect } from 'react';

export function usePlatform() {
  const [isNative, setIsNative] = useState(false);
  const [isWeb, setIsWeb] = useState(true);
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios' | 'unknown'>('web');

  useEffect(() => {
    // `window.Capacitor` is NOT proof of running inside the app: it also
    // exists in a normal browser as soon as @capacitor/core is imported
    // anywhere in the bundle. `isNativePlatform()` is true only inside the
    // Android/iOS app, and it is synchronous, so there is no async wait
    // (previously: dynamic import + a native bridge call) before the
    // native layout can be chosen.
    const cap = (window as any).Capacitor;
    const native = cap?.isNativePlatform?.() === true;

    if (!native) {
      setIsNative(false);
      setIsWeb(true);
      setPlatform('web');
      return;
    }

    setIsNative(true);
    setIsWeb(false);

    const name = cap.getPlatform?.();
    setPlatform(name === 'android' || name === 'ios' ? name : 'unknown');
  }, []);

  return { isNative, isWeb, platform };
}
